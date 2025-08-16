import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    // Find all users that have exchanged messages with this user
    const { data: messages, error } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;

    // Get unique other user IDs
    const otherUserIds = new Set<string>();
    messages?.forEach((m: any) => {
      if (m.sender_id !== userId) otherUserIds.add(m.sender_id);
      if (m.receiver_id !== userId) otherUserIds.add(m.receiver_id);
    });

    if (otherUserIds.size === 0) return NextResponse.json([]);

    // Fetch user details for these IDs
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, name")
      .in("id", Array.from(otherUserIds));

    if (usersError) throw usersError;

    return NextResponse.json(users || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch chats" }, { status: 500 });
  }
}