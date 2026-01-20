import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Settings, Calendar, LayoutGrid, Search, MessageSquare, Wifi, WifiOff, BarChart2, Brain, Bell, Server, Download, Lock, Puzzle, CheckSquare, Target, StickyNote, BookOpen, TrendingUp, Upload, Sparkles, Trash2, FileText, FileBarChart, RefreshCw, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNotificationContext } from '../context/NotificationContext';
import FloatingParticles from './FloatingParticles';
import ThemeSelector from './ThemeSelector';
import { getEnabledPlugins } from '../plugins/registry';

export default function Layout({ children, onMonthChange, selectedMonth, rightPanel }) {
    const location = useLocation();
    const { unreadCount } = useNotificationContext();
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
        <div className="flex h-screen w-full bg-os-bg overflow-hidden text-sm relative">
            {/* Floating Particles Background */}
            <FloatingParticles />

            {/* Sidebar */}
            <aside className="w-64 bg-os-panel border-r border-os-hover flex flex-col p-4 space-y-4 relative z-10">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <LayoutGrid size={24} className="text-blue-400" />
                        MyLife
                    </Link>
                    <ThemeSelector />
                </div>

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
                        <Link to="/coach" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/coach')}`}>
                            <Brain size={18} /> AI Coach
                        </Link>
                        <Link to="/goals" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/goals')}`}>
                            <Target size={18} /> Goals
                        </Link>
                        <Link to="/reports" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/reports')}`}>
                            <FileBarChart size={18} /> Reports
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
                        <Link to="/updates" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/updates')}`}>
                            <Download size={18} /> Updates
                        </Link>
                        <button
                            onClick={async () => {
                                if (confirm('Lock vault? You will need to unlock it again.')) {
                                    try {
                                        await fetch('http://127.0.0.1:8000/vault/lock', { method: 'POST' });
                                        window.location.href = '/';
                                    } catch (err) {
                                        alert('Failed to lock vault');
                                    }
                                }
                            }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-os-hover text-orange-400 hover:text-orange-300"
                        >
                            <Lock size={18} /> Lock Vault
                        </button>
                        <Link to="/import" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/import')}`}>
                            <Upload size={18} /> Import
                        </Link>
                        <Link to="/sync" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/sync')}`}>
                            <RefreshCw size={18} /> Sync
                        </Link>
                        <Link to="/cleanup" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/cleanup')}`}>
                            <Sparkles size={18} /> Cleanup
                        </Link>
                        <Link to="/trash" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/trash')}`}>
                            <Trash2 size={18} /> Trash
                        </Link>
                        <Link to="/audit" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/audit')}`}>
                            <FileText size={18} /> Audit Log
                        </Link>
                        <Link to="/plugins" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/plugins')}`}>
                            <Puzzle size={18} /> Plugins
                        </Link>

                        {/* Dynamic Plugin Links */}
                        {getEnabledPlugins().map(plugin => {
                            const iconMap = { CheckSquare, Target, StickyNote };
                            const PluginIcon = iconMap[plugin.icon] || Puzzle;
                            return (
                                <Link
                                    key={plugin.id}
                                    to={plugin.routePath}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive(plugin.routePath)}`}
                                >
                                    <PluginIcon size={18} /> {plugin.name}
                                </Link>
                            );
                        })}

                        <Link to="/system" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/system')}`}>
                            <Server size={18} /> System Status
                        </Link>
                        <Link to="/diagnostics" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/diagnostics')}`}>
                            <Activity size={18} /> Diagnostics
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
