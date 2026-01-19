import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context with default empty value (prevents null errors)
const NotificationContext = createContext({
    notifications: [],
    addNotification: () => { },
    removeNotification: () => { },
    clearNotifications: () => { },
    markAsRead: () => { },
    unreadCount: 0
});

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState(() => {
        try {
            const stored = localStorage.getItem('mylife_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load notifications from localStorage:', e);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('mylife_notifications', JSON.stringify(notifications));
        } catch (e) {
            console.error('Failed to save notifications to localStorage:', e);
        }
    }, [notifications]);

    const addNotification = (message, type = 'info') => {
        const newNotification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const value = {
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        markAsRead,
        unreadCount
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);

    // Safety check: if context is null/undefined, throw descriptive error
    if (!context) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }

    return context;
}
