import React from 'react';
import { useNotificationContext } from '../context/NotificationContext';
import { Bell, Trash2, Check, Info, AlertCircle, CheckCircle } from 'lucide-react';

export default function Notifications() {
    const { notifications, removeNotification, clearNotifications, markAsRead } = useNotificationContext();

    const getIcon = (type) => {
        if (type === 'success') return <CheckCircle size={18} className="text-green-400" />;
        if (type === 'error') return <AlertCircle size={18} className="text-red-400" />;
        return <Info size={18} className="text-blue-400" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell className="text-yellow-400" />
                        Notifications
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Updates on backups, restores, and system events.</p>
                </div>

                {notifications.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => notifications.forEach(n => markAsRead(n.id))}
                            className="bg-os-panel border border-os-hover text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors"
                        >
                            <Check size={14} /> Mark All Read
                        </button>
                        <button
                            onClick={clearNotifications}
                            className="bg-os-panel border border-os-hover text-red-400 hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500 border border-os-hover border-dashed rounded-xl">
                        <Bell size={48} className="mb-4 opacity-20" />
                        <p>No notifications yet.</p>
                    </div>
                )}

                {notifications.map(n => (
                    <div
                        key={n.id}
                        className={`bg-os-panel border ${n.read ? 'border-os-hover' : 'border-blue-500/50 bg-blue-900/10'} p-4 rounded-xl flex items-start gap-4 transition-all`}
                    >
                        <div className="mt-1 flex-shrink-0">
                            {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm ${n.read ? 'text-gray-300' : 'text-white font-medium'}`}>{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
