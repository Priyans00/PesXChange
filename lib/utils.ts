import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// SRN Validation Utility
export function validateSRN(srn: string): { isValid: boolean; error?: string } {
  if (!srn) {
    return { isValid: false, error: "SRN is required" };
  }

  // PES University SRN format: PES[1-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}
  const srnPattern = /^PES\d{1}[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
  
  if (!srnPattern.test(srn)) {
    return { 
      isValid: false, 
      error: "Invalid SRN format. Expected format: PES2UG24CS453" 
    };
  }

  return { isValid: true };
}

// Input Sanitization Utility
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove potential XSS patterns
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}
