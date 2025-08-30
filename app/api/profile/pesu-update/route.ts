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
    // Note: This API currently works without Supabase authentication
    // as it uses custom PESU authentication. User access is controlled
    // by the frontend authentication state.
    // TODO: Implement proper session-based authentication if needed

    const body = await req.json();
    const { userId, bio, phone, nickname } = body;

    // Input validation
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // User ID validation (UUID or SRN format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const srnRegex = /^PES[0-9]{1}UG[0-9]{2}[A-Z]{2}[0-9]{3}$/;
    if (!uuidRegex.test(userId) && !srnRegex.test(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Determine if userId is UUID or SRN and get the actual user ID
    let actualUserId = userId;
    
    // If userId is an SRN, find the UUID by SRN
    if (!uuidRegex.test(userId)) {
      const { data: userBySrn, error: srnError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('srn', userId)
        .single();
      
      if (srnError || !userBySrn) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      actualUserId = userBySrn.id;
    }

    // Note: Authorization is currently handled by the frontend.
    // In a production environment, you should implement proper session-based
    // authentication to verify the user can update this profile.

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

    // Validate and sanitize nickname
    let sanitizedNickname: string | null = null;
    if (nickname && typeof nickname === 'string') {
      sanitizedNickname = sanitizeInput(nickname);
      if (sanitizedNickname.length < 2 || sanitizedNickname.length > 50) {
        return NextResponse.json({ error: "Nickname must be between 2 and 50 characters" }, { status: 400 });
      }
      
      // Check for potentially inappropriate content
      const inappropriateWords = ['admin', 'moderator', 'official', 'pesu', 'university'];
      if (inappropriateWords.some(word => 
        sanitizedNickname!.toLowerCase().includes(word.toLowerCase())
      )) {
        return NextResponse.json({ error: "Please choose a different nickname" }, { status: 400 });
      }
    }

    // Verify user exists and get current profile
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, bio, phone, nickname')
      .eq('id', actualUserId)
      .single();

    if (checkError || !existingProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Check if there are actually changes to make
    const hasChanges = existingProfile.bio !== sanitizedBio || 
                      existingProfile.phone !== sanitizedPhone ||
                      existingProfile.nickname !== sanitizedNickname;
    
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
        nickname: sanitizedNickname,
        updated_at: new Date().toISOString()
      })
      .eq('id', actualUserId)
      .select('id, name, srn, bio, phone, nickname, rating, verified, location')
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
