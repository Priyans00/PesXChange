import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateRateLimiter } from "@/lib/rateLimiter";

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') 
    .replace(/<[^>]*>/g, '') 
    .trim();
}

export async function PUT(req: NextRequest) {
  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
  
  if (!profileUpdateRateLimiter.checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  
  try {
    // Verify authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, bio, phone } = body;

    // Input validation
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Authorization check - users can only update their own profile
    if (user.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate and sanitize bio
    let sanitizedBio = null;
    if (bio && typeof bio === 'string') {
      sanitizedBio = sanitizeInput(bio);
      if (sanitizedBio.length > 500) {
        return NextResponse.json({ error: "Bio must be 500 characters or less" }, { status: 400 });
      }
    }

    // Validate and sanitize phone
    let sanitizedPhone = null;
    if (phone && typeof phone === 'string') {
      sanitizedPhone = sanitizeInput(phone);
      // Phone validation (basic)
      const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
      if (!phoneRegex.test(sanitizedPhone)) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
      }
    }

    // Verify user exists and get current profile
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, bio, phone')
      .eq('id', userId)
      .single();

    if (checkError || !existingProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Check if there are actually changes to make
    const hasChanges = existingProfile.bio !== sanitizedBio || 
                      existingProfile.phone !== sanitizedPhone;
    
    if (!hasChanges) {
      return NextResponse.json({
        success: true,
        profile: existingProfile,
        message: "No changes to update"
      });
    }

    // Update user profile with sanitized data
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        bio: sanitizedBio,
        phone: sanitizedPhone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, name, srn, bio, phone, rating, verified, location')
      .single();

    if (error) {
      console.error("Update profile error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Clear any cached profile data
    // This would clear the cache if we had implemented cache invalidation
    
    return NextResponse.json({
      success: true,
      profile: data
    });
  } catch (error) {
    console.error('Error updating PESU profile:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
