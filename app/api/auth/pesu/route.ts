import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { username, password }: PESUAuthRequest = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log(`PESU Auth attempt for user: ${username}`);

    // Call PESU Auth API
    const response = await fetch('https://pesu-auth.onrender.com/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PesXChange/1.0',
      },
      body: JSON.stringify({
        username: username.toUpperCase().trim(),
        password,
        profile: true,
      }),
    });

    console.log(`PESU Auth API response status: ${response.status}`);

    if (!response.ok) {
      console.error('PESU Auth API returned non-200 status:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    const data: PESUAuthResponse = await response.json();
    console.log(`PESU Auth API response:`, { status: data.status, message: data.message, hasProfile: !!data.profile });

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
