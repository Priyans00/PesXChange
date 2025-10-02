// Centralized API Services - replaces Next.js API routes
export { pesuAuthService } from './pesu-auth';
export { apiClient } from './api-client';
export { itemsService } from './items-service';
export { messagesService } from './messages-service';
export { profilesService } from './profiles-service';

// Re-export types for convenience
export type { Item, CreateItemRequest, ItemFilters } from './items-service';
export type { Message, SendMessageRequest, Conversation } from './messages-service';
export type { UserProfile, UpdateProfileRequest } from './profiles-service';
export type { PaginatedResponse } from './api-client';

// Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pesxchange-backend.onrender.com';