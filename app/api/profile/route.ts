import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Get user's items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        *,
        categories (name)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
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
    const totalViews = itemsWithStats.reduce((sum, item) => sum + item.views, 0);
    const totalLikes = itemsWithStats.reduce((sum, item) => sum + item.likes, 0);

    const responseData = {
      profile: {
        ...profile,
        email: user.email
      },
      items: itemsWithStats,
      stats: {
        totalItemsSold: itemsWithStats.length,
        totalItemsBought: 0, // To be implemented with purchase tracking
        totalViews,
        totalLikes,
        averageRating: profile.rating || 0
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, phone, year_of_study, branch, location } = body;

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        name,
        bio,
        phone,
        year_of_study,
        branch,
        location,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


