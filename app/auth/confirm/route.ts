import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Handle different parameter formats from Supabase
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code"); // Alternative format
  const error = searchParams.get("error");
  const error_code = searchParams.get("error_code");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/auth/complete-profile";

  console.log("Confirmation route called with all params:", {
    token_hash: !!token_hash,
    type,
    code: !!code,
    error,
    error_code,
    error_description,
    next,
    fullUrl: request.url
  });

  // Check for error parameters first
  if (error || error_code) {
    console.log("Error in confirmation URL:", { error, error_code, error_description });
    let errorMessage = "Email confirmation failed.";
    
    if (error_code === "otp_expired") {
      errorMessage = "Email confirmation link has expired. Please request a new confirmation email.";
    } else if (error_description) {
      errorMessage = decodeURIComponent(error_description);
    } else if (error) {
      errorMessage = error;
    }
    
    redirect(`/auth/error?error=${encodeURIComponent(errorMessage)}`);
  }

  // Handle token_hash + type format (new Supabase format)
  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      console.log("Email verification successful with token_hash, redirecting to:", next);
      redirect(next);
    } else {
      console.error("Email verification error with token_hash:", error);
      redirect(`/auth/error?error=${encodeURIComponent(error?.message || 'Verification failed')}`);
    }
  }

  // Handle code format (legacy or alternative format)
  if (code) {
    const supabase = await createClient();
    
    // Try to exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log("Email verification successful with code, redirecting to:", next);
      redirect(next);
    } else {
      console.error("Email verification error with code:", error);
      redirect(`/auth/error?error=${encodeURIComponent(error?.message || 'Code verification failed')}`);
    }
  }

  console.log("Missing required parameters in confirmation URL");
  redirect(`/auth/error?error=${encodeURIComponent('Invalid confirmation link. Please check your email and try again.')}`);
}
