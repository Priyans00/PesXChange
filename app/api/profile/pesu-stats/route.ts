import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 2 * 60 * 1000; // 2 minutes

// Cache for profile stats (5 minutes TTL)
const profileStatsCache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function rateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);

  if (!clientData || now > clientData.reset) {
    rateLimitMap.set(clientIP, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function GET(req: NextRequest) {
  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
  
  if (!rateLimit(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  // Input validation
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  // Check cache first
  const cacheKey = `profile-stats-${userId}`;
  const cached = profileStatsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json(cached.data);
  }

  try {
    // Verify authentication - get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Authorization check - users can only access their own profile stats
    if (user.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user profile with optimized query
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, srn, bio, phone, rating, verified, location, created_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get user's items with single query including relations
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        id,
        title,
        price,
        location,
        condition,
        images,
        views,
        is_available,
        created_at,
        categories!inner (
          name
        )
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error("Items error:", itemsError);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    // Get all likes for user's items in batch
    const itemIds = (items || []).map(item => item.id);
    const { data: likesData, error: likesError } = await supabase
      .from('item_likes')
      .select('item_id')
      .in('item_id', itemIds);

    if (likesError) {
      console.error("Likes error:", likesError);
      return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
    }

    // Create likes count map
    const likesCountMap = new Map<string, number>();
    (likesData || []).forEach(like => {
      const current = likesCountMap.get(like.item_id) || 0;
      likesCountMap.set(like.item_id, current + 1);
    });

    // Process items with likes data
    const itemsWithStats = (items || []).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      location: item.location,
      condition: item.condition,
      category: Array.isArray(item.categories) && item.categories.length > 0 
        ? item.categories[0].name 
        : 'Others',
      images: item.images || [],
      views: item.views || 0,
      likes: likesCountMap.get(item.id) || 0,
      created_at: item.created_at,
      is_available: item.is_available
    }));

    // Calculate stats efficiently
    let activeCount = 0;
    let soldCount = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalEarnings = 0;
    const activeItems: typeof itemsWithStats = [];

    itemsWithStats.forEach(item => {
      totalViews += item.views;
      totalLikes += item.likes;
      
      if (item.is_available) {
        activeCount++;
        activeItems.push(item);
      } else {
        soldCount++;
        totalEarnings += item.price;
      }
    });

    const responseData = {
      profile,
      items: activeItems, // Only return active items for listing display
      stats: {
        itemsSold: soldCount,
        activeListings: activeCount,
        totalEarnings,
        totalViews,
        totalFavorites: totalLikes,
        averageRating: profile.rating || 4.5 // Default rating until we implement rating system
      }
    };

    // Cache the response
    profileStatsCache.set(cacheKey, {
      data: responseData,
      expiry: Date.now() + CACHE_TTL
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in PESU profile stats API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
