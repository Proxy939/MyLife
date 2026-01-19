import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import MemoryCard from '../components/MemoryCard';
import StatusMessage from '../components/StatusMessage';
import { Search, Filter, X } from 'lucide-react';

export default function Timeline({ month }) {
    const selectedMonth = month;
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter States (Persisted)
    const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('mylife_search') || '');
    const [moodFilter, setMoodFilter] = useState(() => localStorage.getItem('mylife_mood') || 'all');

    // Persistence Effects
    useEffect(() => { localStorage.setItem('mylife_search', searchQuery); }, [searchQuery]);
    useEffect(() => { localStorage.setItem('mylife_mood', moodFilter); }, [moodFilter]);

    async function loadMemories() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get(`/memories/?month=${selectedMonth}`);
            setMemories(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMemories();
    }, [selectedMonth]);

    // Client-side Filtering
    const filteredMemories = useMemo(() => {
        if (!memories) return [];
        return memories.filter(m => {
            // Mood Filter
            if (moodFilter !== 'all' && m.mood !== moodFilter) return false;

            // Search Query
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                m.title.toLowerCase().includes(q) ||
                m.note.toLowerCase().includes(q) ||
                (m.tags && m.tags.toLowerCase().includes(q))
            );
        });
    }, [memories, moodFilter, searchQuery]);

    const clearFilters = () => {
        setSearchQuery('');
        setMoodFilter('all');
    };

    return (
        <div className="space-y-6">
            {/* Header with Gradient */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-xl"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-os-panel/80 backdrop-blur-sm rounded-2xl border border-os-hover">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                            Timeline
                        </h2>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            {selectedMonth} • {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'}
                        </p>
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search memories..."
                                className="bg-os-bg/50 border border-os-hover rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none w-full transition-all placeholder-gray-500"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Mood Filter */}
                        <div className="relative group">
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                            <select
                                className="bg-os-bg/50 border border-os-hover rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none appearance-none cursor-pointer transition-all"
                                value={moodFilter}
                                onChange={e => setMoodFilter(e.target.value)}
                            >
                                <option value="all">🎭 All Moods</option>
                                <option value="neutral">😐 Neutral</option>
                                <option value="happy">😊 Happy</option>
                                <option value="sad">😢 Sad</option>
                                <option value="excited">🤩 Excited</option>
                                <option value="stressed">😰 Stressed</option>
                                <option value="calm">😌 Calm</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        {(searchQuery || moodFilter !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm transition-all font-medium"
                            >
                                <X size={16} />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full animate-pulse"></div>
                        <div className="relative w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">⚠️</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-400 mb-2">Oops! Something went wrong</h3>
                            <p className="text-gray-300 mb-4">{error}</p>
                            <button
                                onClick={loadMemories}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition-all font-medium"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredMemories.length === 0 && (
                <div className="text-center py-20">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-2xl opacity-20 rounded-full"></div>
                        <div className="relative text-8xl">
                            {memories.length === 0 ? '📝' : '🔍'}
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {memories.length === 0 ? 'No memories yet' : 'No matches found'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {memories.length === 0
                            ? 'Start capturing your moments!'
                            : 'Try different search terms or filters'}
                    </p>
                    {searchQuery || moodFilter !== 'all' ? (
                        <button
                            onClick={clearFilters}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25"
                        >
                            Clear Filters
                        </button>
                    ) : null}
                </div>
            )}

            {/* Memory Cards Grid */}
            {!loading && !error && filteredMemories.length > 0 && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4">
                    {filteredMemories.map((m, index) => (
                        <div
                            key={m.id}
                            className="group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <MemoryCard memory={m} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
