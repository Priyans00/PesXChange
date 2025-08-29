import { NextResponse, type NextRequest } from "next/server";

// Security headers
function addSecurityHeaders(response: NextResponse) {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Security Headers (CSP is now handled in next.config.ts to avoid conflicts)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// Rate limiting for API routes
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const API_RATE_LIMIT = 100; // requests per minute
const API_RATE_WINDOW = 60 * 1000; // 1 minute

// Lazy cleanup of stale rate limit entries during rate limit checks
function checkApiRateLimit(ip: string): boolean {
  const now = Date.now();
  
  // Cleanup stale entries
  for (const [entryIp, data] of rateLimitMap.entries()) {
    if (now - data.lastReset > API_RATE_WINDOW) {
      rateLimitMap.delete(entryIp);
    }
  }
  
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now - userLimit.lastReset > API_RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  if (userLimit.count >= API_RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get client IP
  const clientIP = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown';

  // API route rate limiting
  if (pathname.startsWith('/api/')) {
    if (!checkApiRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }), 
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Validate request headers for security
  const userAgent = request.headers.get('user-agent') || '';
  const suspicious = [
    'sqlmap', 'nikto', 'dirb', 'nmap', 'masscan',
    'python-requests', 'libwww'
  ];
  const suspiciousWithWhitelist = ['wget', 'curl'];
  
  // Define trusted IPs (add your trusted IPs or CIDR ranges here)
  const trustedIPs = [
    '127.0.0.1',
    '::1',
    // Add more trusted IPs or CIDR ranges as needed
  ];
  
  function isTrustedIP(ip: string): boolean {
    // Simple exact match; for CIDR support, use a library like ip-cidr or netmask
    return trustedIPs.includes(ip);
  }
  
  // Block always for highly suspicious user agents
  if (suspicious.some(tool => userAgent.toLowerCase().includes(tool))) {
    console.warn(`Suspicious user agent blocked: ${userAgent} from ${clientIP}`);
    return new Response('Forbidden', { status: 403 });
  }
  
  // Block 'curl' and 'wget' user agents only if not from trusted IPs
  if (
    suspiciousWithWhitelist.some(tool => userAgent.toLowerCase().includes(tool)) &&
    !isTrustedIP(clientIP)
  ) {
    console.warn(`Suspicious user agent blocked: ${userAgent} from ${clientIP}`);
    return new Response('Forbidden', { status: 403 });
  }

  // Check for common attack patterns in URL
  const suspiciousPatterns = [
    /\.\./,     // Path traversal
    /<script/i, // XSS
    /union.*select/i, // SQL injection
    /\bexec\b/i,
    /\beval\b/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(pathname + request.nextUrl.search))) {
    console.warn(`Suspicious request blocked: ${pathname} from ${clientIP}`);
    return new Response('Bad Request', { status: 400 });
  }

  // Routes that require authentication
  const protectedRoutes = ['/profile', '/sell', '/chat', '/protected', '/favorites'];
  
  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  let response = NextResponse.next();
  
  if (isProtectedRoute) {
    // For protected routes, we'll let the client-side handle auth
    // since we can't access localStorage from middleware
    response = NextResponse.next();
  }

  // For auth routes, continue normally
  if (pathname.startsWith('/auth/')) {
    response = NextResponse.next();
  }

  // Add security headers to all responses
  return addSecurityHeaders(response);
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
