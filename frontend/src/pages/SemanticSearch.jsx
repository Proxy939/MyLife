import React, { useState } from 'react';
import { api } from '../api/client';
import MemoryCard from '../components/MemoryCard';
import StatusMessage from '../components/StatusMessage';
import { Search, Sparkles } from 'lucide-react';

export default function SemanticSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const data = await api.post('/ai/search', { query, top_k: 5 });
            setResults(data.results || []);
        } catch (err) {
            if (err.message.includes("404")) {
                setError("Semantic search engine not enabled yet. Please enable Auto Mode or AI module.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="text-purple-400" />
                Semantic Search
            </h2>

            <form onSubmit={handleSearch} className="mb-8">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find memories by meaning (e.g. 'Times I felt productive')..."
                            className="w-full bg-os-panel border border-os-hover rounded-xl pl-10 pr-4 py-3 text-white focus:border-os-accent outline-none transition-colors shadow-sm"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="bg-os-accent hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {error && <StatusMessage error={error} />}

            {loading && <StatusMessage loading loadingText="Analyzing your memories..." />}

            {results && (
                <div className="space-y-4">
                    <div className="text-sm text-gray-400 uppercase font-semibold tracking-wider mb-2">
                        Found {results.length} matches
                    </div>
                    {results.length === 0 ? (
                        <div className="text-center py-10 bg-os-panel rounded-xl border border-os-hover border-dashed text-gray-500">
                            No matching memories found. Try a different query.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {results.map((m) => (
                                <div key={m.id} className="relative">
                                    {/* Optional Score Badge if backend returns it */}
                                    {m.score && (
                                        <div className="absolute top-3 right-3 z-10 bg-os-accent/90 text-white text-[10px] px-2 py-0.5 rounded-full shadow backdrop-blur-sm">
                                            {(m.score * 100).toFixed(0)}% Match
                                        </div>
                                    )}
                                    <MemoryCard memory={m} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
