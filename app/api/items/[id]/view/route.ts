import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    // First get the current view count
    const { data: currentItem, error: fetchError } = await supabase
      .from('items')
      .select('views')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current views:', fetchError);
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Increment view count
    const { error } = await supabase
      .from('items')
      .update({ 
        views: (currentItem.views || 0) + 1
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating view count:', error);
      return NextResponse.json({ error: "Failed to update views" }, { status: 500 });
    }

    return NextResponse.json({ message: "View count updated" });

  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
