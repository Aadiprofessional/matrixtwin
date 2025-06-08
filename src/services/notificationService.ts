import { apiRequest } from '../utils/api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  form_type?: string;
  form_id?: string;
  project_id?: string;
  action_url?: string;
  metadata?: any;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  page: number;
  limit: number;
}

class NotificationService {
  /**
   * Get notifications for the current user
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unread_only?: boolean;
  }): Promise<NotificationResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.unread_only) queryParams.append('unread_only', params.unread_only.toString());
      
      const url = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest<NotificationResponse>(url, {
        method: 'GET'
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiRequest(`/notifications/mark-read/${notificationId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiRequest('/notifications/mark-all-read', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiRequest(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await apiRequest('/notifications/clear-all', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.getNotifications({ 
        limit: 1, 
        unread_only: true 
      });
      return response.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Format relative time for notifications
   */
  formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return notificationTime.toLocaleDateString();
    }
  }

  /**
   * Get notification type styling
   */
  getNotificationTypeClass(type: string): string {
    switch (type) {
      case 'info':
        return 'bg-ai-blue/10 border-l-4 border-ai-blue text-ai-blue';
      case 'warning':
        return 'bg-warning/10 border-l-4 border-warning text-warning';
      case 'success':
        return 'bg-success/10 border-l-4 border-success text-success';
      case 'error':
        return 'bg-error/10 border-l-4 border-error text-error';
      default:
        return 'bg-ai-blue/10 border-l-4 border-ai-blue text-ai-blue';
    }
  }

  /**
   * Handle notification click - navigate to appropriate page
   */
  handleNotificationClick(notification: Notification, navigate: (path: string) => void): void {
    // Mark as read first
    if (!notification.read) {
      this.markAsRead(notification.id).catch(console.error);
    }

    // Navigate to the appropriate page
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.form_type) {
      // Fallback to form type page
      navigate(`/${notification.form_type}`);
    } else {
      // Default to dashboard
      navigate('/dashboard');
    }
  }
}

export const notificationService = new NotificationService(); 