import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get user's items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        *,
        categories (name)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error("Items error:", itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Get likes count for each item
    const itemsWithStats = await Promise.all(
      (items || []).map(async (item) => {
        const { count: likesCount } = await supabase
          .from('item_likes')
          .select('*', { count: 'exact', head: true })
          .eq('item_id', item.id);

        return {
          id: item.id,
          title: item.title,
          price: item.price,
          location: item.location,
          condition: item.condition,
          category: item.categories?.name || 'Others',
          images: item.images || [],
          views: item.views || 0,
          likes: likesCount || 0,
          created_at: item.created_at,
          is_available: item.is_available
        };
      })
    );

    // Calculate stats
    const activeItems = itemsWithStats.filter(item => item.is_available);
    const soldItems = itemsWithStats.filter(item => !item.is_available);
    const totalViews = itemsWithStats.reduce((sum, item) => sum + item.views, 0);
    const totalLikes = itemsWithStats.reduce((sum, item) => sum + item.likes, 0);
    const totalEarnings = soldItems.reduce((sum, item) => sum + item.price, 0);

    const responseData = {
      profile,
      items: activeItems, // Only return active items for listing display
      allItems: itemsWithStats, // All items for complete stats
      stats: {
        itemsSold: soldItems.length,
        activeListings: activeItems.length,
        totalEarnings,
        totalViews,
        totalFavorites: totalLikes,
        averageRating: profile.rating || 4.5 // Default rating until we implement rating system
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in PESU profile stats API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
