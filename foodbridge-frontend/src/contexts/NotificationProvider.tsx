import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
interface Notification {
  message: string;
  type: string;
  data: any;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const token = useAuthStore(state => state.token);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (!token) {
      console.log('No token, not attempting WebSocket connection.');
      return;
    }

    // Connect to WebSocket with token in query param (for simplicity)
    // IMPORTANT: For production, consider sending token in headers or via cookie after initial HTTP auth.
    // e.g., `new WebSocket(`ws://localhost:8003/ws/notifications/?token=${token}`);`
    ws.current = new WebSocket(`ws://localhost:8003/ws/notifications/?token=${token}`);

    ws.current.onopen = () => {
      console.log('WebSocket connection established.');
    };

    ws.current.onmessage = (event) => {
      // ensuring toast notifications not seen when logged out
      if (!useAuthStore.getState().token) {
        console.warn('User logged out, ignoring notification');
        return;
      }

      const data = JSON.parse(event.data);
      console.log('Received notification:', data);
      addNotification(data);
      // You might also want to display a toast here
      // For example: toast.success(data.message);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      // Optional: Attempt to reconnect after a delay
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [token]); 

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};