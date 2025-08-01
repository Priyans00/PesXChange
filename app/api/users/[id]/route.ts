import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get user info using admin client (server-side only)
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Return only safe user information
    const userInfo = {
      id: data.user.id,
      email: data.user.email,
      created_at: data.user.created_at,
    };

    return NextResponse.json(userInfo);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user information " + error },
      { status: 500 }
    );
  }
}
