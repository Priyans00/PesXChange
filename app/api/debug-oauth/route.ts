import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    // Get the current user and session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    let profileData = null;
    let profileError = null;
    
    // If user exists, check their profile
    if (user) {
      try {
        const { data: profile, error: pError } = await supabase
          .from('user_profiles')
          .select('id, name, srn')
          .eq('id', user.id)
          .single();
        profileData = profile;
        profileError = pError;
      } catch (err) {
        profileError = err;
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user: user ? {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
      } : null,
      session: session ? {
        access_token: session.access_token ? "present" : "missing",
        refresh_token: session.refresh_token ? "present" : "missing",
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      } : null,
      profile: profileData ? {
        id: profileData.id,
        hasName: !!profileData.name,
        hasSrn: !!profileData.srn,
      } : null,
      errors: {
        userError: userError?.message || null,
        sessionError: sessionError?.message || null,
        profileError: profileError instanceof Error ? profileError.message : (profileError as { message?: string })?.message || null,
        profileErrorCode: (profileError as { code?: string })?.code || null,
      },
      recommendation: getRecommendation(user, session, profileData, profileError as { code?: string } | null)
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

function getRecommendation(
  user: { id: string } | null, 
  session: { access_token: string } | null, 
  profile: { name?: string, srn?: string } | null, 
  profileError: { code?: string } | null
) {
  if (!user || !session) {
    return "User needs to login";
  }
  
  if (profileError?.code === 'PGRST116' || !profile || !profile.name || !profile.srn) {
    return "User needs to complete profile";
  }
  
  return "User is fully authenticated and can access protected routes";
}
