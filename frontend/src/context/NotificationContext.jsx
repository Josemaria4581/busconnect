import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data } = await api.get(`/notificaciones?usuario=${user.id}`);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.leido).length);
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll every 30s
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    const addNotification = async (title, body, type = 'info') => {
        if (!user) return;
        try {
            await api.post('/notificaciones', {
                usuario: user.id,
                titulo: title,
                cuerpo: body,
                tipo
            });
            fetchNotifications(); // Refresh immediately
        } catch (e) {
            console.error("Failed to create notification", e);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notificaciones/${id}/leido`, { leido: 1 });
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
            fetchNotifications(); // Revert on error
        }
    };

    const markAllAsRead = async () => {
        // Naive implementation: loop. Better: backend/batch endpoint.
        // For now, just mark local and fetch.
        const unread = notifications.filter(n => !n.leido);
        if (unread.length === 0) return;

        try {
            await Promise.all(unread.map(n => api.patch(`/notificaciones/${n.id}/leido`, { leido: 1 })));
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, addNotification, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
