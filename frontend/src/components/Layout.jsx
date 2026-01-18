import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Settings, Calendar, LayoutGrid, Search, MessageSquare, Wifi, WifiOff, BarChart2, Brain, Bell, Server } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

export default function Layout({ children, onMonthChange, selectedMonth, rightPanel }) {
    const location = useLocation();
    const { unreadCount } = useNotifications();
    const isActive = (path) => location.pathname === path ? "bg-os-accent text-white" : "text-gray-400 hover:text-white hover:bg-os-hover";

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="flex h-screen w-full bg-os-bg overflow-hidden text-sm">
            {/* Sidebar */}
            <aside className="w-64 bg-os-panel border-r border-os-hover flex flex-col p-4 space-y-4">
                <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 mb-2 flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <LayoutGrid size={24} className="text-blue-400" />
                    MyLife
                </Link>

                {/* Offline Indicator */}
                {!isOnline && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-800 rounded text-xs text-red-200">
                        <WifiOff size={14} /> Offline Mode
                    </div>
                )}

                {isOnline && (
                    <div className="flex items-center gap-2 px-3 py-1 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                        Online
                    </div>
                )}

                <nav className="flex flex-col space-y-1 flex-1 mt-4">
                    <Link to="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/')}`}>
                        <Home size={18} /> Timeline
                    </Link>
                    <Link to="/analytics" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/analytics')}`}>
                        <BarChart2 size={18} /> Analytics
                    </Link>
                    <Link to="/insights" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/insights')}`}>
                        <Brain size={18} /> Insights
                    </Link>

                    <div className="my-2 border-t border-os-hover"></div>

                    <Link to="/add" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/add')}`}>
                        <PlusCircle size={18} /> Add Memory
                    </Link>

                    <div className="pt-4 pb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">AI Tools</div>
                        <Link to="/search" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/search')}`}>
                            <Search size={18} /> Semantic Search
                        </Link>
                        <Link to="/chat" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/chat')}`}>
                            <MessageSquare size={18} /> Memory Chat
                        </Link>
                    </div>

                    <div className="pt-2 pb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">System</div>
                        <Link to="/notifications" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/notifications')}`}>
                            <div className="relative">
                                <Bell size={18} />
                                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-os-panel"></span>}
                            </div>
                            Notifications
                        </Link>
                        <Link to="/system" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/system')}`}>
                            <Server size={18} /> System Status
                        </Link>
                        <Link to="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/settings')}`}>
                            <Settings size={18} /> Configuration
                        </Link>
                    </div>
                </nav>

                {/* Month Filter */}
                <div className="pt-4 border-t border-os-hover">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                        Time Travel
                    </label>
                    <div className="flex items-center gap-2 bg-os-bg p-2 rounded border border-os-hover">
                        <Calendar size={16} className="text-gray-400" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => onMonthChange(e.target.value)}
                            className="bg-transparent border-none outline-none text-gray-200 w-full text-xs"
                        />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-3xl mx-auto pb-20">
                    {!isOnline && (
                        <div className="mb-4 text-center text-xs text-gray-400 animate-pulse">
                            You’re offline. Using cached data. Sync will resume when online.
                        </div>
                    )}
                    {children}
                </div>
            </main>

            {/* Right Panel (Recap) */}
            <aside className="w-80 bg-os-panel border-l border-os-hover p-6 overflow-y-auto hidden xl:block">
                {rightPanel}
            </aside>
        </div>
    );
}
