import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Input validation functions
function validatePagination(limit: string | null, offset: string | null) {
  const parsedLimit = parseInt(limit || "20");
  const parsedOffset = parseInt(offset || "0");
  
  // Enforce reasonable limits
  return {
    limit: Math.min(Math.max(parsedLimit, 1), 100), // Between 1 and 100
    offset: Math.max(parsedOffset, 0) // Non-negative
  };
}

function validatePriceRange(minPrice: string | null, maxPrice: string | null) {
  const min = minPrice ? parseFloat(minPrice) : null;
  const max = maxPrice ? parseFloat(maxPrice) : null;
  
  if (min !== null && (isNaN(min) || min < 0)) return { min: null, max };
  if (max !== null && (isNaN(max) || max < 0)) return { min, max: null };
  if (min !== null && max !== null && min > max) return { min: null, max: null };
  
  return { min, max };
}

function sanitizeSearchTerm(search: string | null): string | null {
  if (!search) return null;
  // Remove potentially dangerous characters and limit length
  return search.replace(/[<>]/g, '').trim().substring(0, 100) || null;
}

// Cache for category lookup
const categoryCache = new Map<string, number | null>();

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  
  try {
    // Validate and sanitize input parameters
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const { min: minPrice, max: maxPrice } = validatePriceRange(
      searchParams.get("minPrice"), 
      searchParams.get("maxPrice")
    );
    const search = sanitizeSearchTerm(searchParams.get("search"));
    const { limit, offset } = validatePagination(
      searchParams.get("limit"), 
      searchParams.get("offset")
    );

    // Build query with performance optimizations
    let query = supabase
      .from("items")
      .select(`
        id,
        title,
        description,
        price,
        condition,
        location,
        images,
        created_at,
        seller_id,
        category_id,
        categories!inner(name)
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply category filter efficiently
    if (category && category !== "All") {
      // Use cache for category lookup
      let categoryId = categoryCache.get(category);
      if (categoryId === undefined) { // Only fetch if not cached
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .eq("name", category)
          .single();
        
        if (categoryData?.id) {
          categoryId = categoryData.id;
          categoryCache.set(category, categoryId as number);
        } else {
          categoryId = null;
          categoryCache.set(category, null); // Cache null result to avoid repeated lookups
        }
      }
      
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
    }

    // Apply other filters
    if (condition && condition !== "All") {
      // Validate condition against allowed values
      const allowedConditions = ["New", "Like New", "Good", "Fair", "Poor"];
      if (allowedConditions.includes(condition)) {
        query = query.eq("condition", condition);
      }
    }

    if (minPrice !== null) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice !== null) {
      query = query.lte("price", maxPrice);
    }

    if (search) {
      // Use full-text search on both title and description fields
      query = query.or(
        `title.textSearch.${search}.websearch,description.textSearch.${search}.websearch`
      );
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("Error fetching items:", error);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json([]);
    }

    // Batch fetch user profiles for better performance
    const sellerIds = [...new Set(items.map(item => item.seller_id))];
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("id, name, rating, verified")
      .in("id", sellerIds);

    // Create lookup map
    const userProfileMap = new Map(
      userProfiles?.map(profile => [profile.id, profile]) || []
    );

    // Batch fetch likes count
    const itemIds = items.map(item => item.id);
    const { data: likesData } = await supabase
      .from("item_likes")
      .select("item_id")
      .in("item_id", itemIds);

    // Count likes per item
    const likesCountMap = new Map<string, number>();
    likesData?.forEach(like => {
      const current = likesCountMap.get(like.item_id) || 0;
      likesCountMap.set(like.item_id, current + 1);
    });

    // Combine data efficiently
    const itemsWithDetails = items.map(item => {
      const userProfile = userProfileMap.get(item.seller_id);
      const likesCount = likesCountMap.get(item.id) || 0;

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        location: item.location,
        condition: item.condition,
        category: item.categories[0]?.name || "Others", // Get category name from relation
        images: item.images || [],
        likes: likesCount,
        createdAt: item.created_at,
        seller: {
          id: item.seller_id,
          name: userProfile?.name || "Unknown User",
          rating: userProfile?.rating || 0,
          verified: userProfile?.verified || false
        }
      };
    });

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
    const body = await req.json();
    const {
      title,
      description,
      price,
      location,
      condition,
      category,
      images,
      seller_id,
      is_available = true,
      views = 0
    } = body;

    // Validate required fields
    if (!title || !description || !price || !seller_id) {
      return NextResponse.json({ 
        error: "Missing required fields: title, description, price, seller_id" 
      }, { status: 400 });
    }

    // Verify the seller exists in user_profiles
    const { data: seller, error: sellerError } = await supabase
      .from("user_profiles")
      .select("id, name")
      .eq("id", seller_id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ 
        error: "Invalid seller_id or seller not found" 
      }, { status: 400 });
    }

    // Get or create category ID
    let categoryId = null;
    if (category && category !== "Others") {
      // Try to find existing category
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category)
        .single();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category if it doesn't exist
        const { data: newCategory, error: categoryError } = await supabase
          .from("categories")
          .insert([{ name: category }])
          .select("id")
          .single();

        if (!categoryError && newCategory) {
          categoryId = newCategory.id;
        }
      }
    }

    // Create the item
    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          title,
          description,
          price: parseFloat(price),
          location: location || "PES University, Bangalore",
          condition,
          category_id: categoryId, // Use category_id instead of category
          images: images || [],
          seller_id,
          is_available,
          views
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error creating item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Item created successfully:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}