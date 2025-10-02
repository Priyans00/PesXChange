// Items API Service - replaces Next.js API routes with Go Fiber backend calls
import { apiClient, PaginatedResponse } from './api-client';

export interface ItemCategory {
  name: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  seller_id: string;
  categories: string[];
  created_at: string;
  updated_at: string;
  image_urls?: string[];
  images?: string[];
  status?: string;
  seller?: {
    id: string;
    name: string;
    nickname: string;
    rating: number;
    verified: boolean;
  };
}

export interface CreateItemRequest {
  title: string;
  description: string;
  price: number;
  location: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  image_urls?: string[];
  categories?: string[];
  [key: string]: unknown; // Allow additional properties
}

export interface ItemFilters {
  search?: string;
  category?: string;
  condition?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'created_at' | 'price_asc' | 'price_desc' | 'title';
  limit?: number;
  offset?: number;
}

export class ItemsService {
  // Get all items with optional filters
  async getItems(filters: ItemFilters = {}): Promise<PaginatedResponse<Item>> {
    const params: Record<string, string> = {};
    
    // Convert filters to string parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });

    return apiClient.getItems(params) as Promise<PaginatedResponse<Item>>;
  }

  // Get a single item by ID
  async getItem(itemId: string): Promise<{ data: Item }> {
    return apiClient.getItem(itemId) as Promise<{ data: Item }>;
  }

  // Create a new item
  async createItem(itemData: CreateItemRequest): Promise<{ data: Item }> {
    return apiClient.createItem(itemData as Record<string, unknown>) as Promise<{ data: Item }>;
  }

  // Update an existing item
  async updateItem(itemId: string, updates: Partial<CreateItemRequest>): Promise<{ data: Item }> {
    return apiClient.updateItem(itemId, updates as Record<string, unknown>) as Promise<{ data: Item }>;
  }

  // Delete an item
  async deleteItem(itemId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.deleteItem(itemId) as Promise<{ success: boolean; message: string }>;
  }

  // Search items (convenience method)
  async searchItems(query: string, filters?: Omit<ItemFilters, 'search'>): Promise<PaginatedResponse<Item>> {
    return this.getItems({
      search: query,
      ...filters,
    });
  }

  // Get items by category (convenience method)
  async getItemsByCategory(category: string, filters?: Omit<ItemFilters, 'category'>): Promise<PaginatedResponse<Item>> {
    return this.getItems({
      category,
      ...filters,
    });
  }

  // Get items by seller (this would need to be implemented in the backend)
  async getItemsBySeller(sellerId: string, filters?: ItemFilters): Promise<PaginatedResponse<Item>> {
    // For now, we'll use the general getItems with seller filtering
    // The backend would need to implement seller-specific filtering
    return this.getItems({
      ...filters,
      // Note: The backend doesn't have seller filtering yet, 
      // this is a placeholder for future implementation
    });
  }
}

// Export a singleton instance
export const itemsService = new ItemsService();