import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CreateProfileRequest {
  srn: string;
  prn: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  branch: string;
  semester: string;
  section: string;
  campus_code: number;
  campus: string;
}

export async function POST(request: NextRequest) {
  try {
    const profileData: CreateProfileRequest = await request.json();
    const supabase = await createClient();

    // Use the upsert function to create or update user profile
    const { data, error } = await supabase.rpc('upsert_user_profile', {
      p_srn: profileData.srn,
      p_prn: profileData.prn,
      p_name: profileData.name,
      p_email: profileData.email,
      p_phone: profileData.phone,
      p_program: profileData.program,
      p_branch: profileData.branch,
      p_semester: profileData.semester,
      p_section: profileData.section,
      p_campus_code: profileData.campus_code,
      p_campus: profileData.campus,
    });

    if (error) {
      console.error('Profile upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to create/update user profile' },
        { status: 500 }
      );
    }

    // Get the full profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      id: data, // Return the UUID
      profile 
    });

  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
