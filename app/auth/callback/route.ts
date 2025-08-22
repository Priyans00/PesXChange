import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    
    try {
      // Exchange the code for a session
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("OAuth callback error:", error);
        redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
      }

      if (!user) {
        redirect(`/auth/error?error=${encodeURIComponent("No user found after OAuth")}`);
      }

      // Check if user already has a complete profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, name, srn')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist or is incomplete, redirect to complete profile
      if (profileError || !profile || !profile.name || !profile.srn) {
        console.log("User needs to complete profile");
        redirect("/auth/complete-profile");
      }

      // Profile exists and is complete, redirect to intended destination
      console.log("User has complete profile, redirecting to:", next);
      redirect(next);
      
    } catch (error) {
      console.error("OAuth callback exception:", error);
      redirect(`/auth/error?error=${encodeURIComponent("OAuth authentication failed")}`);
    }
  }

  // No code provided
  redirect(`/auth/error?error=${encodeURIComponent("No authorization code provided")}`);
}
