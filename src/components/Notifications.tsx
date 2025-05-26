import React from 'react';

interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  description?: string;
  time: string;
  read: boolean;
  type?: string;
}

interface NotificationsProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  emptyMessage?: string;
}

const Notifications: React.FC<NotificationsProps> = ({ 
  notifications, 
  onMarkAsRead, 
  emptyMessage = 'No notifications to display' 
}) => {
  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!notification.read ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}
          onClick={() => onMarkAsRead(notification.id)}
        >
          <div className="flex justify-between">
            <div>
              <p className="font-medium text-sm">{notification.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {notification.message || notification.description}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                {notification.time}
              </span>
            </div>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-blue-500 mt-1 ml-2"></span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications; 