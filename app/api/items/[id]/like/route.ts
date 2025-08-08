import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: itemId } = await params;
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("item_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from("item_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", itemId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like
      const { error } = await supabase
        .from("item_likes")
        .insert([{ user_id: user.id, item_id: itemId }]);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}