import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { is_available, seller_id } = body;

    if (!seller_id) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
    }

    // Verify the seller owns this item
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("seller_id")
      .eq("id", id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.seller_id !== seller_id) {
      return NextResponse.json({ error: "Unauthorized - not the seller" }, { status: 403 });
    }

    // Update the item availability
    const { data, error } = await supabase
      .from("items")
      .update({
        is_available: is_available,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating item availability:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data
    });
  } catch (error) {
    console.error("Error in item availability update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
