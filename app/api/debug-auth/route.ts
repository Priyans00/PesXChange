import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
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
      userError: userError?.message || null,
      sessionError: sessionError?.message || null,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
