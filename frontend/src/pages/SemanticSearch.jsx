import { useState, useEffect } from 'react';
import { Search, Sparkles, Zap, Filter } from 'lucide-react';

export default function SemanticSearch() {
    const [query, setQuery] = useState('');
    const [searchMode, setSearchMode] = useState('keyword'); // 'keyword' or 'semantic'
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filters
    const [month, setMonth] = useState('');
    const [mood, setMood] = useState('');
    const [limit, setLimit] = useState(20);
    const [showFilters, setShowFilters] = useState(false);

    // Debounce for keyword search
    useEffect(() => {
        if (searchMode === 'keyword' && query.length >= 2) {
            const timer = setTimeout(() => {
                performSearch();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [query, month, mood, limit, searchMode]);

    const performSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (searchMode === 'keyword') {
                // Fast keyword search
                const params = new URLSearchParams({ q: query, limit: limit.toString() });
                if (month) params.append('month', month);
                if (mood) params.append('mood', mood);

                const res = await fetch(`http://127.0.0.1:8000/search?${params}`);
                const data = await res.json();

                if (data.success) {
                    setResults(data.data.results || []);
                } else {
                    if (res.status === 401) {
                        setError('Vault is locked. Please unlock to search.');
                    } else {
                        setError(data.error?.message || 'Search failed');
                    }
                }
            } else {
                // Semantic AI search
                const res = await fetch('http://127.0.0.1:8000/ai/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, top_k: limit })
                });

                const data = await res.json();

                if (data.success) {
                    setResults(data.data.results || []);
                } else {
                    if (res.status === 401) {
                        setError('Vault is locked. Please unlock to search.');
                    } else {
                        setError(data.error?.message || 'Search failed');
                    }
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch();
    };

    const moods = ['happy', 'sad', 'neutral', 'excited', 'anxious', 'grateful', 'angry'];

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Search size={28} className="text-cyan-400" />
                    <h1 className="text-3xl font-bold text-white">Search Memories</h1>
                </div>

                {/* Search Mode Toggle */}
                <div className="flex items-center gap-2 bg-os-bg rounded-lg p-1">
                    <button
                        onClick={() => setSearchMode('keyword')}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${searchMode === 'keyword'
                                ? 'bg-cyan-500 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Zap size={16} />
                        Fast Search (Keyword)
                    </button>
                    <button
                        onClick={() => setSearchMode('semantic')}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${searchMode === 'semantic'
                                ? 'bg-purple-500 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Sparkles size={16} />
                        Semantic Search (AI)
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                            searchMode === 'keyword'
                                ? 'Search by keywords...'
                                : 'Describe what you\'re looking for...'
                        }
                        className="flex-1 px-4 py-3 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 rounded-lg transition-colors ${showFilters ? 'bg-blue-500 text-white' : 'bg-os-bg text-gray-400 hover:text-white'
                            }`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Filters */}
                {showFilters && searchMode === 'keyword' && (
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-os-hover">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Month</label>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full px-3 py-2 bg-os-bg border border-os-hover rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Mood</label>
                            <select
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                className="w-full px-3 py-2 bg-os-bg border border-os-hover rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">All Moods</option>
                                {moods.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Limit</label>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-os-bg border border-os-hover rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            >
                                <option value="10">10 results</option>
                                <option value="20">20 results</option>
                                <option value="50">50 results</option>
                            </select>
                        </div>
                    </div>
                )}

                {searchMode === 'keyword' && query.length >= 2 && (
                    <p className="text-xs text-gray-400">
                        Auto-searching as you type...
                    </p>
                )}
            </form>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-white">
                        Results ({results.length})
                    </h2>

                    {results.map((result) => (
                        <a
                            key={result.id}
                            href={`/memory/${result.id}`}
                            className="block bg-os-panel border border-os-hover hover:border-cyan-500/50 rounded-xl p-5 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">
                                    {result.title}
                                </h3>
                                {searchMode === 'keyword' && result.rank !== undefined && (
                                    <span className="text-xs text-gray-500">
                                        Rank: {result.rank.toFixed(2)}
                                    </span>
                                )}
                                {searchMode === 'semantic' && result.similarity !== undefined && (
                                    <span className="text-xs text-cyan-400">
                                        {(result.similarity * 100).toFixed(0)}% match
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                {result.note}
                            </p>

                            <div className="flex items-center gap-4 text-xs">
                                {result.mood && (
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                        {result.mood}
                                    </span>
                                )}
                                {result.tags && result.tags.split(',').slice(0, 3).map(tag => (
                                    <span key={tag} className="text-gray-500">
                                        #{tag.trim()}
                                    </span>
                                ))}
                                {result.timestamp && (
                                    <span className="text-gray-500 ml-auto">
                                        {new Date(result.timestamp).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && !error && (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <Search size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No results found</p>
                    <p className="text-gray-400 text-sm">
                        Try different keywords or switch search modes
                    </p>
                </div>
            )}
        </div>
    );
}
