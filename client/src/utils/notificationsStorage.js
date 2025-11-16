const NOTIFICATIONS_STORAGE_KEY = 'schooladmin_notifications';

export const loadNotifications = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
    return [];
  }
};

export const saveNotifications = (notifications) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications)
    );
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error);
  }
};

export const addNotification = (notification) => {
  const current = loadNotifications();
  const updated = [notification, ...current];
  saveNotifications(updated);
  return updated;
};


