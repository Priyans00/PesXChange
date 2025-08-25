import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get SRN from query parameter
    const { searchParams } = new URL(request.url);
    const srn = searchParams.get('srn');
    
    if (!srn) {
      return NextResponse.json({ error: "SRN is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user profile by SRN
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('srn', srn)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Get user's items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        *,
        categories (
          name,
          icon
        )
      `)
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Items fetch error:', itemsError);
      // Don't fail the whole request if items can't be fetched
    }

    // Get user statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_user_stats', {
      user_id: profile.id
    });

    if (statsError) {
      console.error('Stats fetch error:', statsError);
      // Don't fail the whole request if stats can't be fetched
    }

    return NextResponse.json({
      profile,
      items: items || [],
      stats: stats || {
        items_listed: 0,
        items_sold: 0,
        total_views: 0,
        total_likes: 0,
        average_rating: 0
      }
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { srn, bio, phone, avatar_url } = await request.json();
    
    if (!srn) {
      return NextResponse.json({ error: "SRN is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Update user profile
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        bio,
        phone,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('srn', srn)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
