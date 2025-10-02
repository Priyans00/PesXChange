// Messages API Service - replaces Next.js API routes with Go Fiber backend calls
import { apiClient, PaginatedResponse } from './api-client';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  sender?: {
    id: string;
    name: string;
    nickname: string;
  };
  receiver?: {
    id: string;
    name: string;
    nickname: string;
  };
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_nickname: string;
  last_message?: Message;
  unread_count: number;
}

export interface SendMessageRequest {
  receiver_id: string;
  item_id: string;
  message: string; // Changed from 'content' to 'message' to match backend
}

export interface MessageFilters {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}

export class MessagesService {
  // Send a new message
  async sendMessage(messageData: SendMessageRequest): Promise<{ data: Message }> {
    return apiClient.sendMessage(messageData.receiver_id, messageData.item_id, messageData.message) as Promise<{ data: Message }>;
  }

  // Get active chats for the current user
  async getActiveChats(): Promise<PaginatedResponse<Conversation>> {
    return apiClient.getActiveChats() as Promise<PaginatedResponse<Conversation>>;
  }

  // Get messages in a conversation with another user about a specific item
  async getMessages(otherUserId: string, itemId: string, limit = 50, offset = 0): Promise<PaginatedResponse<Message>> {
    return apiClient.getMessages(otherUserId, itemId, limit, offset) as Promise<PaginatedResponse<Message>>;
  }

  // Mark messages as read in a conversation about a specific item
  async markMessagesAsRead(otherUserId: string, itemId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.markMessagesAsRead(otherUserId, itemId) as Promise<{ success: boolean; message: string }>;
  }

  // Mark all messages in a conversation as read
  async markConversationAsRead(otherUserId: string): Promise<{ success: boolean; message: string }> {
    // This would need to be implemented in the backend as a bulk operation
    // For now, we'll make individual API calls or implement this endpoint
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/conversations/${otherUserId}/read`, {
        method: 'POST',
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
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/unread/count`, {
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
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete a message (if supported)
  async deleteMessage(messageId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/${messageId}`, {
        method: 'DELETE',
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
      console.error('Error deleting message:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const messagesService = new MessagesService();