import { create } from 'zustand';
import { DbNotification } from './db-notifications';

export interface Notification extends DbNotification {
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

// Load read state from localStorage
const loadReadState = (): Set<number> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem('notifications-read');
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Failed to load read state:', error);
  }
  return new Set();
};

// Save read state to localStorage
const saveReadState = (readIds: Set<number>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('notifications-read', JSON.stringify(Array.from(readIds)));
  } catch (error) {
    console.error('Failed to save read state:', error);
  }
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });

    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.success) {
        const readIds = loadReadState();

        const notifications: Notification[] = data.notifications.map((n: DbNotification) => ({
          ...n,
          read: readIds.has(n.id),
        }));

        set({
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ loading: false });
    }
  },

  markAsRead: (id) => {
    const readIds = loadReadState();
    readIds.add(id);
    saveReadState(readIds);

    const notifications = get().notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );

    set({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  },

  markAllAsRead: () => {
    const allIds = new Set(get().notifications.map(n => n.id));
    saveReadState(allIds);

    const notifications = get().notifications.map(n => ({ ...n, read: true }));

    set({
      notifications,
      unreadCount: 0,
    });
  },
}));
