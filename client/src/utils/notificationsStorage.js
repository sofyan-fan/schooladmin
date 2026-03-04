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
// is_global: when true (admin only), the notification will be visible to all users
export const addNotification = async ({ subject, message, is_global = false }) => {
  try {
    const created = await notificationAPI.add_notification({ subject, message, is_global });
    return created;
  } catch (error) {
    console.error('Failed to add notification via API:', error);
    throw error;
  }
};

// Update an existing notification via backend API (admin only)
export const updateNotification = async (id, { subject, message, is_global = false }) => {
  try {
    const updated = await notificationAPI.update_notification(id, { subject, message, is_global });
    return updated;
  } catch (error) {
    console.error('Failed to update notification via API:', error);
    throw error;
  }
};

// Delete a notification via backend API
export const deleteNotification = async (id) => {
  try {
    await notificationAPI.delete_notification(id);
    return id;
  } catch (error) {
    console.error('Failed to delete notification via API:', error);
    throw error;
  }
};
