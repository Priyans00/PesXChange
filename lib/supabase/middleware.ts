import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Only protect specific routes, not all routes
  const protectedPaths = ['/protected', '/chat', '/sell', '/profile'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Allow public access to item-listing and other public pages
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value); // Request cookies don't support options
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check if user has completed their profile (for authenticated users)
  if (user && isProtectedPath && request.nextUrl.pathname !== '/auth/complete-profile') {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('srn, name')
        .eq('id', user.id)
        .single();

      // Redirect if no profile exists or if SRN is missing
      if (error || !profile || !profile.srn) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/complete-profile";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If there's an error checking the profile, redirect to complete profile
      console.error("Profile check error:", error);
      const url = request.nextUrl.clone();
      url.pathname = "/auth/complete-profile";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};