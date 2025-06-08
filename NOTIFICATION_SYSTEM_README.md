# Notification System Implementation

## Overview

This document describes the comprehensive notification system implemented for the BuildSphere construction management application. The system provides real-time in-app notifications for workflow assignments and form updates across all form types (diary, safety, cleansing, labour).

## Features

- ✅ **Real-time in-app notifications** in the header
- ✅ **Email notifications** (existing functionality preserved)
- ✅ **Workflow integration** for all form types
- ✅ **Mark as read/unread** functionality
- ✅ **Delete notifications** capability
- ✅ **Pagination** support
- ✅ **Notification types** (info, warning, success, error)
- ✅ **Auto-navigation** to relevant forms when clicked
- ✅ **Unread count** display
- ✅ **Real-time polling** for new notifications

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    form_type VARCHAR(50), -- diary, safety, cleansing, labour
    form_id VARCHAR(255),
    project_id VARCHAR(255),
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes

- `idx_notifications_user_id` - For user-specific queries
- `idx_notifications_read` - For read/unread filtering
- `idx_notifications_created_at` - For chronological ordering
- `idx_notifications_user_read_created` - Composite index for efficient querying

## API Endpoints

### Base URL: `/api/notifications`

#### 1. Get Notifications
```http
GET /api/notifications
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `unread_only` (optional): Filter unread notifications only (boolean)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "user_id": "user_456",
      "title": "New Diary Entry Assigned",
      "message": "A new diary entry for Project Alpha has been assigned to you for review.",
      "type": "info",
      "form_type": "diary",
      "form_id": "diary_789",
      "project_id": "project_101",
      "action_url": "/diary",
      "metadata": {},
      "read": false,
      "read_at": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "unreadCount": 5,
  "page": 1,
  "limit": 20
}
```

#### 2. Mark Notification as Read
```http
POST /api/notifications/mark-read/:notificationId
```

#### 3. Mark All Notifications as Read
```http
POST /api/notifications/mark-all-read
```

#### 4. Delete Notification
```http
DELETE /api/notifications/:notificationId
```

#### 5. Clear All Notifications
```http
DELETE /api/notifications/clear-all
```

#### 6. Create Notification (Internal API)
```http
POST /api/notifications
```

**Body:**
```json
{
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info",
  "form_type": "diary",
  "form_id": "form_123",
  "project_id": "project_456",
  "action_url": "/diary"
}
```

## Frontend Integration

### Notification Service

The `notificationService` provides a clean interface for frontend components:

```typescript
import { notificationService } from '../services/notificationService';

// Get notifications
const response = await notificationService.getNotifications({
  page: 1,
  limit: 10,
  unread_only: true
});

// Mark as read
await notificationService.markAsRead(notificationId);

// Mark all as read
await notificationService.markAllAsRead();

// Delete notification
await notificationService.deleteNotification(notificationId);

// Handle notification click (auto-navigate)
notificationService.handleNotificationClick(notification, navigate);
```

### Header Component Integration

The Header component now includes:

- **Real-time notification fetching** every 30 seconds
- **Unread count badge** on the notification bell
- **Notification dropdown** with full functionality
- **Auto-navigation** when notifications are clicked
- **Visual indicators** for different notification types

## Workflow Integration

### Form Types Supported

1. **Diary Entries** (`/api/diary`)
2. **Safety Inspections** (`/api/safety`)
3. **Labour Returns** (`/api/labour`)
4. **Cleansing Records** (`/api/cleansing`)

### Notification Triggers

Notifications are automatically created when:

- ✅ **Form is created** and assigned to workflow nodes
- ✅ **Form is approved** and moves to next node
- ✅ **Form is rejected** and needs admin attention
- ✅ **Form is sent back** for revision

### Notification Recipients

- **Executors**: Users assigned to execute workflow nodes
- **CC Users**: Users who should be informed about workflow progress
- **Admins**: Users with admin role (get all notifications)

## Notification Types and Styling

### Type Classes

- `info`: Blue styling for general information
- `warning`: Orange styling for warnings/attention needed
- `success`: Green styling for successful actions
- `error`: Red styling for errors/rejections

### Auto-Generated Messages

The system automatically generates appropriate titles and messages based on:

- **Form type** (diary, safety, cleansing, labour)
- **Action type** (created, approved, rejected, sent_back)
- **Project information**
- **User roles** (executor, cc, admin)

## Testing

### Database Setup

1. Run the SQL schema from `notifications_table.sql`
2. Ensure proper indexes are created
3. Verify RLS policies if using Supabase

### API Testing

Use the provided test script:

```bash
node test_notifications.js
```

This will test all API endpoints and verify functionality.

### Manual Testing

1. **Create a form** (diary, safety, cleansing, or labour)
2. **Check notifications** appear in header
3. **Click notification** to verify navigation
4. **Mark as read** and verify state change
5. **Test workflow actions** (approve, reject, send back)

## Configuration

### Environment Variables

```env
# Frontend URL for notification links
FRONTEND_URL=http://localhost:3000

# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email configuration (existing)
RESEND_API_KEY=your_resend_api_key
```

### Polling Interval

The frontend polls for new notifications every 30 seconds. This can be adjusted in the Header component:

```typescript
// Set up polling for new notifications every 30 seconds
const interval = setInterval(fetchNotifications, 30000);
```

## Security

### Authentication

- All notification endpoints require authentication
- Users can only see their own notifications
- Admin users have additional privileges

### Data Validation

- Input validation on all API endpoints
- SQL injection protection via parameterized queries
- XSS protection via proper data sanitization

## Performance Considerations

### Database Optimization

- Proper indexing for fast queries
- Pagination to limit result sets
- Efficient composite indexes for common query patterns

### Frontend Optimization

- Debounced API calls
- Efficient state management
- Minimal re-renders with proper React optimization

## Future Enhancements

### Potential Improvements

1. **WebSocket integration** for real-time notifications
2. **Push notifications** for mobile devices
3. **Notification preferences** per user
4. **Notification categories** and filtering
5. **Bulk actions** for notification management
6. **Notification templates** for customization
7. **Analytics** for notification engagement

### Scalability

The current implementation supports:

- **High volume** of notifications via efficient database design
- **Multiple projects** and users
- **Extensible** notification types and triggers
- **Modular** architecture for easy enhancements

## Troubleshooting

### Common Issues

1. **Notifications not appearing**: Check database connection and user authentication
2. **Navigation not working**: Verify action_url format and routing setup
3. **Performance issues**: Check database indexes and query optimization
4. **Email conflicts**: Ensure both email and in-app notifications work independently

### Debug Tools

- Use browser developer tools to inspect API calls
- Check server logs for notification creation
- Use the test script to verify API functionality
- Monitor database queries for performance issues

## Support

For issues or questions about the notification system:

1. Check this documentation first
2. Review the test script for examples
3. Examine the API logs for errors
4. Test with the provided endpoints

---

**Implementation Status**: ✅ Complete and fully functional
**Last Updated**: January 2024
**Version**: 1.0.0 