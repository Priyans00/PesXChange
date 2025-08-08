import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  
  // Get query parameters
  const category = searchParams.get("category");
  const condition = searchParams.get("condition");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // First, get items with basic info
    let query = supabase
      .from("items")
      .select(`
        *,
        categories (name)
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category && category !== "All") {
      // Get category ID
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category)
        .single();
      
      if (categoryData) {
        query = query.eq("category_id", categoryData.id);
      }
    }

    if (condition && condition !== "All") {
      query = query.eq("condition", condition);
    }

    if (minPrice) {
      query = query.gte("price", parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte("price", parseFloat(maxPrice));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("Error fetching items:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json([]);
    }

    // Get unique seller IDs
    const sellerIds = [...new Set(items.map(item => item.seller_id))];

    // Fetch user profiles separately
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("id, name, rating, verified")
      .in("id", sellerIds);

    // Create a map of user profiles for quick lookup
    const userProfileMap = new Map();
    userProfiles?.forEach(profile => {
      userProfileMap.set(profile.id, profile);
    });

    // Get likes count for each item
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        // Get likes count
        const { count } = await supabase
          .from("item_likes")
          .select("*", { count: "exact", head: true })
          .eq("item_id", item.id);

        // Get user profile
        const userProfile = userProfileMap.get(item.seller_id);

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          location: item.location,
          year: item.year,
          condition: item.condition,
          category: item.categories?.name || "Others",
          images: item.images || [],
          views: item.views || 0,
          likes: count || 0,
          createdAt: item.created_at,
          seller: {
            id: item.seller_id,
            name: userProfile?.name || "Unknown User",
            rating: userProfile?.rating || 0,
            verified: userProfile?.verified || false
          }
        };
      })
    );

    return NextResponse.json(itemsWithDetails);
  } catch (error) {
    console.error("Error in items API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      price,
      location,
      year,
      condition,
      category,
      images
    } = body;

    // Get category ID
    let categoryId = null;
    if (category && category !== "Others") {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category)
        .single();
      categoryId = categoryData?.id;
    }

    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          title,
          description,
          price,
          location: location || "PES University, Bangalore",
          year,
          condition,
          category_id: categoryId,
          images: images || [],
          seller_id: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}