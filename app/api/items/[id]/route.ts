import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    // First, fetch the item details
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        categories(name)
      `)
      .eq('id', id)
      .single();

    if (itemError) {
      console.error('Error fetching item:', itemError);
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Then, fetch the seller details
    const { data: seller, error: sellerError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        rating,
        verified,
        avatar_url,
        bio,
        phone,
        location,
        created_at
      `)
      .eq('id', item.seller_id)
      .single();

    if (sellerError) {
      console.error('Error fetching seller:', sellerError);
      // Continue without seller info rather than failing completely
    }

    // Get like count for this item
    const { count: likeCount } = await supabase
      .from('item_likes')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', id);

    // Transform the data to match our interface
    const transformedItem = {
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      location: item.location,
      year: item.year,
      condition: item.condition,
      category: item.categories?.name || 'Unknown',
      category_id: item.category_id,
      images: item.images || [],
      views: item.views || 0,
      likes: likeCount || 0,
      is_available: item.is_available,
      created_at: item.created_at,
      updated_at: item.updated_at,
      seller: {
        id: seller?.id || item.seller_id,
        name: seller?.name || 'Unknown Seller',
        rating: seller?.rating || 0,
        verified: seller?.verified || false,
        avatar_url: seller?.avatar_url,
        bio: seller?.bio,
        phone: seller?.phone,
        location: seller?.location || 'Unknown Location',
        created_at: seller?.created_at,
      }
    };

    return NextResponse.json(transformedItem);

  } catch (error) {
    console.error('Error fetching item details:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
