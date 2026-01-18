import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import MemoryCard from '../components/MemoryCard';
import StatusMessage from '../components/StatusMessage';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';

export default function Timeline() {
    const { selectedMonth } = useOutletContext();
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
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">Timeline ({selectedMonth})</h2>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-os-panel border border-os-hover rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-os-accent outline-none w-full"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                className="bg-os-panel border border-os-hover rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:border-os-accent outline-none appearance-none cursor-pointer"
                                value={moodFilter}
                                onChange={e => setMoodFilter(e.target.value)}
                            >
                                <option value="all">All Moods</option>
                                <option value="neutral">Neutral</option>
                                <option value="happy">Happy</option>
                                <option value="sad">Sad</option>
                                <option value="excited">Excited</option>
                                <option value="stressed">Stressed</option>
                                <option value="calm">Calm</option>
                            </select>
                        </div>

                        {(searchQuery || moodFilter !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-3 py-2 bg-os-hover hover:bg-red-900/50 text-gray-300 hover:text-red-200 rounded-lg text-xs transition-colors"
                            >
                                <X size={14} /> Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading && <StatusMessage loading />}

            {error && <StatusMessage error={error} onRetry={loadMemories} />}

            {!loading && !error && (
                <>
                    {filteredMemories.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            {memories.length === 0 ? "No memories found for this month." : "No matches found."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredMemories.map(m => <MemoryCard key={m.id} memory={m} />)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
