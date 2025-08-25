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
    type Message = { sender_id: string; receiver_id: string };

    // Find all users that have exchanged messages with this user
    const { data: messages, error } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      console.error("Database error in active-chats:", error);
      // Return empty array if there's a database error (e.g., migration not run)
      return NextResponse.json([]);
    }

    // Handle case where messages is null or undefined
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json([]);
    }

    // Get unique other user IDs
    const otherUserIds = new Set<string>();
    messages.forEach((m: Message) => {
      if (m.sender_id !== userId) otherUserIds.add(m.sender_id);
      if (m.receiver_id !== userId) otherUserIds.add(m.receiver_id);
    });

    if (otherUserIds.size === 0) return NextResponse.json([]);

    // Fetch user details for these IDs
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, name")
      .in("id", Array.from(otherUserIds));

    if (usersError) {
      console.error("Database error fetching user profiles:", usersError);
      // Return empty array if user_profiles table has issues
      return NextResponse.json([]);
    }

    return NextResponse.json(users || []);
  } catch (err) {
    console.error("Unexpected error in active-chats:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch chats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}