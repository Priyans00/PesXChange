// PESU Auth Service - integrates with PESU Academy authentication
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

class PESUAuthService {
  private readonly storageKey = 'pesu_auth_user';

  async authenticate(username: string, password: string): Promise<AuthUser> {
    const response = await fetch('/api/auth/pesu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
      console.error('Auth API error:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.user) {
      throw new Error('Invalid response from authentication service');
    }

    const user: AuthUser = data.user;

    // Store user in localStorage for session persistence
    this.setStoredUser(user);
    
    return user;
  }

  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  setStoredUser(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('https://pesu-auth.onrender.com/health');
      const data = await response.json();
      return data.status === 'true' || data.status === true;
    } catch {
      return false;
    }
  }
}

export const pesuAuthService = new PESUAuthService();
