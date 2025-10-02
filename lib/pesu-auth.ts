// PESU Auth Service - integrates with PESU Academy authentication via Go Fiber backend
import { apiClient } from './api-client';

export interface PESUProfile {
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

export interface PESUAuthResponse {
  status: boolean;
  profile?: PESUProfile;
  message: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  srn: string;
  name: string;
  email: string;
  profile: PESUProfile;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

class PESUAuthService {
  private readonly storageKey = 'pesu_auth_user';
  private readonly tokenKey = 'pesu_auth_token';

  async authenticate(username: string, password: string): Promise<AuthUser> {
    try {
      // Use the new Go Fiber backend via API client
      const data = await apiClient.authenticateWithPESU(username.trim(), password) as AuthResponse;
      
      if (!data.user || !data.token) {
        throw new Error('Invalid response from authentication service');
      }

      const user: AuthUser = data.user;
      
      // Store user and token in localStorage for session persistence
      this.setStoredUser(user);
      this.setAuthToken(data.token);
      
      return user;
    } catch (error) {
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('authentication failed')) {
          throw new Error('Invalid PESU credentials. Please check your SRN and password.');
        } else if (error.message.includes('authentication service unavailable')) {
          throw new Error('Authentication service is temporarily unavailable. Please try again later.');
        } else if (error.message.includes('Unable to connect')) {
          throw new Error('Unable to connect to authentication service. Please check your internet connection.');
        }
        throw error;
      }
      
      throw new Error('Authentication failed. Please try again.');
    }
  }

  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return null;
    }
    
    try {
      const user = JSON.parse(stored);
      return user;
    } catch {
      return null;
    }
  }

  setStoredUser(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
  }

  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check both the Go backend and original PESU auth service
      const [backendHealth, pesuHealth] = await Promise.allSettled([
        apiClient.healthCheck(),
        fetch('https://pesu-auth.onrender.com/health').then(r => r.json())
      ]);
      
      const backendHealthy = backendHealth.status === 'fulfilled' && 
        (backendHealth.value as { status?: string })?.status === 'ok';
      
      const pesuHealthy = pesuHealth.status === 'fulfilled' && 
        ((pesuHealth.value as { status?: string | boolean })?.status === 'true' || 
         (pesuHealth.value as { status?: string | boolean })?.status === true);
      
      return backendHealthy && pesuHealthy;
    } catch {
      return false;
    }
  }
}

export const pesuAuthService = new PESUAuthService();
