import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const commands = [
        { name: 'Timeline', path: '/', keys: ['timeline', 'home'] },
        { name: 'Add Memory', path: '/add', keys: ['add', 'new', 'create'] },
        { name: 'Search', path: '/search', keys: ['search', 'find'] },
        { name: 'Memory Chat', path: '/chat', keys: ['chat', 'ai'] },
        { name: 'Analytics', path: '/analytics', keys: ['analytics', 'stats'] },
        { name: 'AI Insights', path: '/insights', keys: ['insights'] },
        { name: 'AI Coach', path: '/coach', keys: ['coach'] },
        { name: 'Goals', path: '/goals', keys: ['goals'] },
        { name: 'Reports', path: '/reports', keys: ['reports'] },
        { name: 'Settings', path: '/settings', keys: ['settings', 'preferences'] },
        { name: 'Backup', path: '/backup', keys: ['backup'] },
        { name: 'Sync', path: '/sync', keys: ['sync'] },
        { name: 'Import', path: '/import', keys: ['import'] },
        { name: 'Cleanup', path: '/cleanup', keys: ['cleanup'] },
        { name: 'Trash', path: '/trash', keys: ['trash', 'deleted'] },
        { name: 'Audit Log', path: '/audit', keys: ['audit', 'log'] },
        { name: 'Diagnostics', path: '/diagnostics', keys: ['diagnostics', 'health'] },
    ];

    const filteredCommands = query
        ? commands.filter(cmd =>
            cmd.name.toLowerCase().includes(query.toLowerCase()) ||
            cmd.keys.some(k => k.includes(query.toLowerCase()))
        )
        : commands;

    const handleSelect = useCallback((path) => {
        navigate(path);
        setOpen(false);
        setQuery('');
    }, [navigate]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20">
            <div className="bg-os-panel border border-os-hover rounded-2xl w-full max-w-2xl shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-os-hover">
                    <Search size={20} className="text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search commands..."
                        className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                        autoFocus
                    />
                    <button
                        onClick={() => setOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Commands List */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No commands found</div>
                    ) : (
                        filteredCommands.map((cmd, idx) => (
                            <button
                                key={cmd.path}
                                onClick={() => handleSelect(cmd.path)}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-os-hover transition-colors text-white"
                            >
                                {cmd.name}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-os-hover text-xs text-gray-500 flex items-center justify-between">
                    <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
                    <kbd className="px-2 py-1 bg-os-bg rounded border border-os-hover">Ctrl+K</kbd>
                </div>
            </div>
        </div>
    );
}
