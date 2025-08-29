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

// Input Sanitization Utility - Server-Safe
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove potential XSS patterns - server-safe
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

// PostgREST Query Sanitization - Enhanced Security
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return '';
  
  // Comprehensive sanitization for PostgREST query safety
  return query
    .replace(/[^\w\s\-\.]/g, '') // Only allow alphanumeric, spaces, hyphens, dots
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\.(and|or|not|eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|sl|sr|nxl|nxr|adj|ov|fts|plfts|phfts|wfts)\./gi, '') // Remove PostgREST operators
    .trim()
    .slice(0, 50); // Strict length limit
}
