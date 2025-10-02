// Profiles API Service - replaces Next.js API routes with Go Fiber backend calls
import { apiClient } from './api-client';

export interface UserProfile {
  id: string;
  srn: string;
  prn?: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string; // Go backend uses 'phone' instead of 'contact_number'
  bio?: string;
  avatar_url?: string;
  program?: string;
  branch?: string;
  semester?: string;
  section?: string;
  campus_code?: number;
  campus?: string;
  rating: number;
  verified: boolean;
  location?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  phone?: string; // Go backend uses 'phone' instead of 'contact_number'
  email?: string;
  bio?: string;
  [key: string]: unknown; // Allow additional properties
}

export class ProfilesService {
  // Get user profile by ID
  async getProfile(userId: string): Promise<{ data: UserProfile }> {
    return apiClient.getProfile(userId) as Promise<{ data: UserProfile }>;
  }

  // Update user profile
  async updateProfile(userId: string, updates: Record<string, unknown>): Promise<{ data: UserProfile }> {
    return apiClient.updateProfile(userId, updates) as Promise<{ data: UserProfile }>;
  }

  // Get current user's profile (convenience method)
  async getCurrentProfile(): Promise<{ data: UserProfile }> {
    // This assumes we store the current user ID somewhere
    // We might need to get this from the auth context or token
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No current user found');
    }
    return this.getProfile(currentUserId);
  }

  // Update current user's profile (convenience method)
  async updateCurrentProfile(updates: UpdateProfileRequest): Promise<{ data: UserProfile }> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No current user found');
    }
    return this.updateProfile(currentUserId, updates);
  }

  // Helper method to get current user ID from localStorage or auth context
  private getCurrentUserId(): string | null {
    // Try to get from PESU auth user storage (matches our auth flow)
    try {
      const storedUser = localStorage.getItem('pesu_auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.id || null;
      }
    } catch {
      // Error parsing stored user - continue to fallback methods
    }

    // Fallback: Try to get from other storage keys
    const userId = localStorage.getItem('user_id');
    if (userId) {
      return userId;
    }

    // Fallback: Try to parse from JWT token
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_id || payload.id || null;
      } catch {
        // Error parsing JWT token - return null
      }
    }

    return null;
  }

  // Search users by name or SRN (if implemented in backend)
  async searchUsers(query: string): Promise<{ data: UserProfile[] }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pesxchange-backend.onrender.com'}/api/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get user rating/reviews (if implemented in backend)
  async getUserRating(userId: string): Promise<{ rating: number; review_count: number; reviews: unknown[] }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pesxchange-backend.onrender.com'}/api/users/${userId}/rating`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

// Export a singleton instance
export const profilesService = new ProfilesService();