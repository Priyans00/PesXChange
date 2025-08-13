import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { name, srn } = await req.json();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name || !srn) {
      return NextResponse.json({ 
        error: "Name and SRN are required" 
      }, { status: 400 });
    }

    // Validate SRN format
    const srnPattern = /^PES\d{1}[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
    if (!srnPattern.test(srn)) {
      return NextResponse.json({ 
        error: "Invalid SRN format. Expected format: PES2UG24CS453" 
      }, { status: 400 });
    }

    // Check if SRN already exists
    const { data: existingSrn, error: srnError } = await supabase
      .from('user_profiles')
      .select('srn')
      .eq('srn', srn)
      .single();

    if (srnError && srnError.code !== 'PGRST116') {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingSrn) {
      return NextResponse.json({ 
        error: "This SRN is already registered" 
      }, { status: 409 });
    }

    // Check if user already has a profile (might exist from trigger)
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('id, srn')
      .eq('id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingProfile) {
      if (existingProfile.srn) {
        return NextResponse.json({ 
          error: "Profile already exists with SRN" 
        }, { status: 409 });
      }
      
      // Update existing profile with SRN and name
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ name, srn })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ 
          error: "Failed to update profile" 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        message: "Profile updated successfully", 
        profile: data 
      });
    }

    // Create new user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: user.id,
          name,
          srn,
          location: 'PES University, Bangalore'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ 
        error: "Failed to create profile" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Profile created successfully", 
      profile: data 
    });
    
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
