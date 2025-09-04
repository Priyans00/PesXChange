import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Try to get user ID from multiple sources
    let userId: string | null = null;
    let userEmail: string | null = null;

    // First, try Supabase auth (for existing sessions)
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
    if (supabaseUser && !authError) {
      userId = supabaseUser.id;
      userEmail = supabaseUser.email || null;
    } else {
      // If no Supabase session, try to get from request headers or query
      const userIdFromHeader = request.headers.get('X-User-ID');
      const userIdFromQuery = request.nextUrl.searchParams.get('userId');
      
      userId = userIdFromHeader || userIdFromQuery;
      
      if (!userId) {
        return NextResponse.json({ error: "No user session found. Please log in again." }, { status: 401 });
      }
    }

    // Get user profile using the userId
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: "Profile not found. Please try logging in again." }, { status: 404 });
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
        email: userEmail || profile.email
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
    // Try to get user ID from multiple sources
    let userId: string | null = null;

    // First, try Supabase auth (for existing sessions)
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
    if (supabaseUser && !authError) {
      userId = supabaseUser.id;
    } else {
      // If no Supabase session, try to get from request headers or query
      const userIdFromHeader = req.headers.get('X-User-ID');
      const userIdFromQuery = req.nextUrl.searchParams.get('userId');
      
      userId = userIdFromHeader || userIdFromQuery;
      
      if (!userId) {
        return NextResponse.json({ error: "No user session found. Please log in again." }, { status: 401 });
      }
    }

    const body = await req.json();
    const { name, bio, phone, nickname, year_of_study, branch, location } = body;

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        name,
        bio,
        phone,
        nickname,
        year_of_study,
        branch,
        location,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
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


