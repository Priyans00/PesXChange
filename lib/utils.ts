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

/**
 * Get the display name for a user, prioritizing nickname over real name
 * @param user User object with name and optional nickname
 * @param showRealName Whether to show real name in parentheses when nickname is used
 * @returns Display name string
 */
export function getDisplayName(
  user: { name: string; nickname?: string | null }, 
  showRealName: boolean = false
): string {
  const displayName = user.nickname || user.name;
  
  if (user.nickname && showRealName) {
    return `${user.nickname} (${user.name})`;
  }
  
  return displayName;
}

/**
 * Get the initials for a user's avatar, using nickname if available
 * @param user User object with name and optional nickname
 * @returns First letter of display name, uppercase
 */
export function getDisplayInitials(user: { name: string; nickname?: string | null }): string {
  return (user.nickname || user.name).charAt(0).toUpperCase();
}

/**
 * Validate nickname for inappropriate content
 * @param nickname The nickname to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateNickname(nickname: string): { isValid: boolean; error?: string } {
  const trimmed = nickname.trim();
  
  if (!trimmed) {
    return { isValid: true }; // Empty nickname is allowed
  }
  
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { isValid: false, error: 'Nickname must be between 2 and 50 characters' };
  }
  
  // Check for potentially inappropriate content
  const inappropriateWords = ['admin', 'moderator', 'official', 'pesu', 'university', 'support', 'help'];
  if (inappropriateWords.some(word => 
    trimmed.toLowerCase().includes(word.toLowerCase())
  )) {
    return { isValid: false, error: 'Please choose a different nickname' };
  }
  
  return { isValid: true };
}
