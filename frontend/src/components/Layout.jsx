import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Settings, Calendar, LayoutGrid } from 'lucide-react';

export default function Layout({ children, onMonthChange, selectedMonth, rightPanel }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? "bg-os-accent text-white" : "text-gray-400 hover:text-white hover:bg-os-hover";

    return (
        <div className="flex h-screen w-full bg-os-bg overflow-hidden text-sm">
            {/* Sidebar */}
            <aside className="w-64 bg-os-panel border-r border-os-hover flex flex-col p-4 space-y-4">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 mb-6 flex items-center gap-2">
                    <LayoutGrid size={24} className="text-blue-400" />
                    MyLife
                </h1>

                <nav className="flex flex-col space-y-1 flex-1">
                    <Link to="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/')}`}>
                        <Home size={18} /> Timeline
                    </Link>
                    <Link to="/add" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/add')}`}>
                        <PlusCircle size={18} /> Add Memory
                    </Link>
                    <Link to="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/settings')}`}>
                        <Settings size={18} /> AI Settings
                    </Link>
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
