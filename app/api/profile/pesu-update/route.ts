import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    const body = await req.json();
    const { userId, bio, phone } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify user exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError || !existingProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        bio: bio || null,
        phone: phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Update profile error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: data
    });
  } catch (error) {
    console.error('Error updating PESU profile:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
