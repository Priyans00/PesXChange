import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ['/profile', '/sell', '/chat', '/protected', '/favorites'];
  
  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // If it's a protected route, we'll let the client-side handle the redirect
  // since we can't access localStorage from middleware
  if (isProtectedRoute) {
    // We can't check auth status here since we use localStorage
    // The client-side components will handle redirects
    return NextResponse.next();
  }

  // For auth routes, continue normally
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
