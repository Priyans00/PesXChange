
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

// Helper to validate that the next path is a safe internal path
function getSafeRedirectPath(next: string | null): string {
  const allowedPaths = [
    "/profile",
    "/protected", 
    "/sell",
    "/chat",
    "/item-listing"
  ];
  
  if (
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("://") &&
    (allowedPaths.includes(next) || allowedPaths.some(path => next.startsWith(path + "/")))
  ) {
    return next;
  }
  return "/profile";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (process.env.NODE_ENV === 'development') {
    console.log("OAuth callback called with:", { 
      hasCode: !!code, 
      next, 
      host: request.headers.get('host'),
      origin: request.headers.get('origin')
    });
  }

  if (!code) {
    if (process.env.NODE_ENV === 'development') {
      console.log("No authorization code provided");
    }
    redirect(`/auth/error?error=${encodeURIComponent("No authorization code provided")}`);
  }

  const supabase = await createClient();
  
  try {
    // Exchange the code for a session
    if (process.env.NODE_ENV === 'development') {
      console.log("Exchanging code for session...");
    }
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("OAuth exchange error:", error?.message);
      // Don't immediately redirect to error, try to handle gracefully
      if (error.message?.includes('invalid_grant') || error.message?.includes('code_verifier')) {
        console.log("Potential PKCE/domain mismatch, redirecting to login");
        redirect(`/auth/login?error=${encodeURIComponent("OAuth authentication failed. Please try again.")}`);
      }
      redirect(`/auth/error?error=${encodeURIComponent(error.message || "Authentication failed")}`);
    }

    const { user, session } = data;

    if (!user || !session) {
      if (process.env.NODE_ENV === 'development') {
        console.log("No user or session found after OAuth exchange");
      }
      redirect(`/auth/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("User authenticated successfully:", user.id, user.email);
    }

    // Wait a moment for session to be fully established
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if user already has a complete profile
    if (process.env.NODE_ENV === 'development') {
      console.log("Checking user profile...");
    }
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, name, srn')
        .eq('id', user.id)
        .single();

      if (process.env.NODE_ENV === 'development') {
        console.log("Profile check result:", { 
          hasProfile: !!profile,
          profileError: profileError?.message,
          profileData: profile ? { hasName: !!profile.name, hasSrn: !!profile.srn } : null
        });
      }

      // If profile doesn't exist or is incomplete, redirect to complete profile
      if (profileError?.code === 'PGRST116' || !profile || !profile.name || !profile.srn) {
        if (process.env.NODE_ENV === 'development') {
          console.log("User needs to complete profile");
        }
        redirect("/auth/complete-profile");
      }

      // Profile exists and is complete, redirect to intended destination
      if (process.env.NODE_ENV === 'development') {
        console.log("User has complete profile, redirecting to:", next);
      }
      redirect(next);

    } catch (profileCheckError) {
      console.error("Profile check failed:", profileCheckError);
      // If profile check fails, still allow user to complete profile
      if (process.env.NODE_ENV === 'development') {
        console.log("Profile check failed, redirecting to complete profile as fallback");
      }
      redirect("/auth/complete-profile");
    }
    
  } catch (error) {
    console.error("OAuth callback exception:", error instanceof Error ? error.message : String(error));
    if (process.env.NODE_ENV === 'development') {
      console.error("Full error stack:", error);
    }
    
    // More graceful error handling - redirect to login instead of generic error
    redirect(`/auth/login?error=${encodeURIComponent("OAuth authentication encountered an issue. Please try again.")}`);
  }
}
