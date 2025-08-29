import { NextRequest, NextResponse } from 'next/server';

// Rate limiting for auth attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now();
  const attempts = authAttempts.get(identifier);
  
  if (!attempts || now - attempts.lastAttempt > AUTH_WINDOW) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempts.count >= MAX_AUTH_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

interface PESUAuthRequest {
  username: string;
  password: string;
}

interface PESUProfile {
  name: string;
  prn: string;
  srn: string;
  program: string;
  branch: string;
  semester: string;
  section: string;
  email: string;
  phone: string;
  campus_code: number;
  campus: string;
}

interface PESUAuthResponse {
  status: boolean;
  profile?: PESUProfile;
  message: string;
  timestamp: string;
}

function validateSRN(srn: string): boolean {
  // Enhanced SRN validation
  const srnPattern = /^PES\d{1}[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
  return srnPattern.test(srn.toUpperCase());
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '').substring(0, 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password }: PESUAuthRequest = body;

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);

    if (!validateSRN(sanitizedUsername)) {
      return NextResponse.json(
        { error: 'Invalid SRN format' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkAuthRateLimit(`${clientIP}-${sanitizedUsername}`)) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again later.' },
        { status: 429 }
      );
    }

    console.log(`PESU Auth attempt for user: ${sanitizedUsername}`);

    // Create a fresh AbortController for each request to avoid signal conflicts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://pesu-auth.onrender.com/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PesXChange/1.0',
      },
      body: JSON.stringify({
        username: sanitizedUsername.toUpperCase(),
        password: sanitizedPassword,
        profile: true,
      }),
      signal: controller.signal,
    });

    // Clear timeout on successful completion
    clearTimeout(timeoutId);
    console.log(`PESU Auth API response status: ${response.status}`);

    if (!response.ok) {
      console.error('PESU Auth API returned non-200 status:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    const data: PESUAuthResponse = await response.json();
    
    // Validate response data
    if (!data || typeof data.status !== 'boolean') {
      console.error('Invalid response format from PESU Auth API');
      return NextResponse.json(
        { error: 'Invalid authentication response' },
        { status: 500 }
      );
    }

    console.log(`PESU Auth API response:`, { 
      status: data.status, 
      message: data.message, 
      hasProfile: !!data.profile 
    });

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!data.profile) {
      return NextResponse.json(
        { error: 'Profile information not available' },
        { status: 500 }
      );
    }

    console.log(`Authentication successful for ${data.profile.name} (${data.profile.srn})`);

    // Create/update user profile in Supabase
    let userUuid = null;
    try {
      const profileResponse = await fetch(`${request.nextUrl.origin}/api/profile/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.profile),
      });

      if (!profileResponse.ok) {
        console.error('Failed to upsert user profile:', await profileResponse.text());
        // Continue anyway - profile creation failure shouldn't block login
      } else {
        const profileResult = await profileResponse.json();
        userUuid = profileResult.id;
        console.log('User profile upserted successfully with UUID:', userUuid);
      }
    } catch (profileError) {
      console.error('Profile upsert error:', profileError);
      // Continue anyway - profile creation failure shouldn't block login
    }

    // Return the user data with proper UUID
    return NextResponse.json({
      user: {
        id: userUuid || data.profile.srn, // Fallback to SRN if UUID not available
        srn: data.profile.srn,
        name: data.profile.name,
        email: data.profile.email,
        profile: data.profile,
      },
    });

  } catch (error) {
    console.error('PESU Auth API error:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Unable to connect to authentication service. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
