// API Configuration for PesXChange Go Fiber Backend
// This file centralizes all API endpoint configurations and provides a type-safe client

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pesxchange-backend.onrender.com';

export const API_ENDPOINTS = {
  // Authentication - Updated to match working Go backend endpoints
  AUTH: {
    PESU_LOGIN: '/api/auth/pesu',  // This is the actual working endpoint
    CHECK_SRN: '/api/auth/check-srn',
  },
  
  // User/Profile Management
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
  },
  
  // Items
  ITEMS: {
    LIST: '/api/items',
    GET: '/api/items',
    CREATE: '/api/items',
    UPDATE: '/api/items',
    DELETE: '/api/items',
    BY_SELLER: '/api/items/seller',
  },
  
  // Messaging
  MESSAGES: {
    SEND: '/api/messages',
    GET: '/api/messages',
    MARK_READ: '/api/messages/read',
    ACTIVE_CHATS: '/api/active-chats',
  },
  
  // Health Check
  HEALTH: '/health',
} as const;

// Response types for type safety
export interface APIResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Generic API client class
export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string> } = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    let url = `${this.baseURL}${endpoint}`;
    
    // Add query parameters if provided
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const authToken = localStorage.getItem('pesu_auth_token');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Add user ID header for backend authentication
    const userStr = localStorage.getItem('pesu_auth_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.id) {
          headers['X-User-ID'] = user.id;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    const config: RequestInit = {
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
      ...fetchOptions,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error details before throwing
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        
        // Special handling for invalid tokens - clear auth data
        if (response.status === 401 && errorMessage === 'Invalid token') {
          console.warn('Invalid token detected, clearing auth data');
          // Clear stored auth data
          localStorage.removeItem('pesu_auth_token');
          localStorage.removeItem('pesu_auth_user');
          // Optionally redirect to login, but let the component handle it
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', {
        url,
        method: config.method || 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
        authHeaders: headers['X-User-ID'] ? 'Present' : 'Missing',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Authentication Methods
  async authenticateWithPESU(username: string, password: string) {
    return this.request(API_ENDPOINTS.AUTH.PESU_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async checkSRN(srn: string) {
    return this.request(API_ENDPOINTS.AUTH.CHECK_SRN, {
      params: { srn },
    });
  }

  // Profile Methods
  async getProfile(userId: string) {
    return this.request(`${API_ENDPOINTS.PROFILE.GET}/${userId}`);
  }

  async updateProfile(userId: string, updates: Record<string, unknown>) {
    return this.request(`${API_ENDPOINTS.PROFILE.UPDATE}/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Item Methods
  async getItems(filters: Record<string, string> = {}) {
    return this.request<PaginatedResponse>(API_ENDPOINTS.ITEMS.LIST, {
      params: filters,
    });
  }

  async getItem(itemId: string) {
    return this.request(`${API_ENDPOINTS.ITEMS.GET}/${itemId}`);
  }

  async createItem(itemData: Record<string, unknown>) {
    return this.request(API_ENDPOINTS.ITEMS.CREATE, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateItem(itemId: string, updates: Record<string, unknown>) {
    return this.request(`${API_ENDPOINTS.ITEMS.UPDATE}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteItem(itemId: string) {
    return this.request(`${API_ENDPOINTS.ITEMS.DELETE}/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getItemsBySeller(sellerId: string, limit = 50, offset = 0) {
    return this.request(`${API_ENDPOINTS.ITEMS.BY_SELLER}/${sellerId}`, {
      params: {
        limit: limit.toString(),
        offset: offset.toString(),
      },
    });
  }

  // Message Methods
  async sendMessage(receiverId: string, itemId: string, content: string) {
    return this.request(API_ENDPOINTS.MESSAGES.SEND, {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        item_id: itemId,
        message: content, // Backend expects 'message', not 'content'
      }),
    });
  }

  async sendDirectMessage(senderId: string, receiverId: string, message: string) {
    return this.request(API_ENDPOINTS.MESSAGES.SEND, {
      method: 'POST',
      body: JSON.stringify({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message,
      }),
    });
  }

  async getMessages(otherUserId: string, itemId: string, limit = 50, offset = 0) {
    return this.request(API_ENDPOINTS.MESSAGES.GET, {
      params: {
        other_user_id: otherUserId,
        item_id: itemId,
        limit: limit.toString(),
        offset: offset.toString(),
      },
    });
  }

  async markMessagesAsRead(otherUserId: string, itemId: string) {
    return this.request(API_ENDPOINTS.MESSAGES.MARK_READ, {
      method: 'PUT',
      body: JSON.stringify({
        other_user_id: otherUserId,
        item_id: itemId,
      }),
    });
  }

  async getActiveChats() {
    return this.request(API_ENDPOINTS.MESSAGES.ACTIVE_CHATS);
  }

  // Health Check
  async healthCheck() {
    return this.request(API_ENDPOINTS.HEALTH);
  }
}

// Export a default instance
export const apiClient = new APIClient();

// Export the base URL for other components that might need it
export { API_BASE_URL };