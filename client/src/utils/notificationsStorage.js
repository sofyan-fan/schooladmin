import notificationAPI from '@/apis/notificationAPI';

// Load notifications from backend API
export const loadNotifications = async () => {
  try {
    const data = await notificationAPI.get_notifications();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load notifications from API:', error);
    return [];
  }
};

// Add a new notification via backend API
export const addNotification = async ({ subject, message }) => {
  try {
    const created = await notificationAPI.add_notification({ subject, message });
    return created;
  } catch (error) {
    console.error('Failed to add notification via API:', error);
    throw error;
  }
};
