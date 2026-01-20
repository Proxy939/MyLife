import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Tag, Heart, Sparkles } from 'lucide-react';

export default function WeeklyReview() {
    const [weekStart, setWeekStart] = useState('');
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Set current week start (Monday)
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        setWeekStart(monday.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (weekStart) {
            fetchReview();
        }
    }, [weekStart]);

    const fetchReview = async () => {
        if (!weekStart) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`http://127.0.0.1:8000/journal/weekly-review?week_start=${weekStart}`);
            const data = await res.json();

            if (data.success) {
                setReview(data.data);
            } else {
                if (res.status === 401) {
                    setError('Vault is locked. Please unlock to view reviews.');
                } else {
                    setError(data.error?.message || 'Failed to load review');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setLoading(false);
        }
    };

    const moodColors = {
        happy: 'text-yellow-400',
        sad: 'text-blue-400',
        neutral: 'text-gray-400',
        excited: 'text-orange-400',
        anxious: 'text-purple-400',
        grateful: 'text-green-400',
        angry: 'text-red-400'
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp size={28} className="text-green-400" />
                    <h1 className="text-3xl font-bold text-white">Weekly Review</h1>
                </div>

                {/* Week Selector */}
                <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <input
                        type="date"
                        value={weekStart}
                        onChange={(e) => setWeekStart(e.target.value)}
                        className="px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                    <span className="text-gray-400">Week starting</span>
                </div>
            </div>

            {/* Loading/Error */}
            {loading && (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <div className="animate-pulse text-gray-400">Loading review...</div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            {/* Review Content */}
            {!loading && !error && review && (
                <>
                    {/* Summary */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-500/20 p-3 rounded-full">
                                <Sparkles size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-2">Week Summary</h2>
                                <p className="text-gray-300 leading-relaxed">{review.summary}</p>
                                <div className="mt-3 text-sm text-gray-400">
                                    {review.week_start} to {review.week_end}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Stats */}
                        <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar size={20} className="text-blue-400" />
                                <h3 className="text-lg font-semibold text-white">This Week</h3>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">
                                {review.total_memories}
                            </div>
                            <div className="text-sm text-gray-400">Memories Created</div>
                        </div>

                        {/* Mood Breakdown */}
                        <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Heart size={20} className="text-pink-400" />
                                <h3 className="text-lg font-semibold text-white">Mood Breakdown</h3>
                            </div>
                            {Object.keys(review.mood_breakdown).length > 0 ? (
                                <div className="space-y-2">
                                    {Object.entries(review.mood_breakdown).map(([mood, count]) => (
                                        <div key={mood} className="flex items-center justify-between">
                                            <span className={`capitalize ${moodColors[mood] || 'text-gray-400'}`}>
                                                {mood}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-os-bg rounded-full h-2">
                                                    <div
                                                        className={`${moodColors[mood]?.replace('text', 'bg') || 'bg-gray-400'} h-2 rounded-full`}
                                                        style={{ width: `${(count / review.total_memories) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No mood data</p>
                            )}
                        </div>

                        {/* Top Tags */}
                        <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag size={20} className="text-cyan-400" />
                                <h3 className="text-lg font-semibold text-white">Top Themes</h3>
                            </div>
                            {review.top_tags && review.top_tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {review.top_tags.map((item) => (
                                        <span
                                            key={item.tag}
                                            className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm"
                                        >
                                            #{item.tag} <span className="text-xs opacity-70">({item.count})</span>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No tags</p>
                            )}
                        </div>

                        {/* Highlights */}
                        <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={20} className="text-yellow-400" />
                                <h3 className="text-lg font-semibold text-white">Highlights</h3>
                            </div>
                            {review.highlights && review.highlights.length > 0 ? (
                                <div className="space-y-2">
                                    {review.highlights.map((highlight) => (
                                        <a
                                            key={highlight.id}
                                            href={`/memory/${highlight.id}`}
                                            className="block p-3 bg-os-bg hover:bg-os-hover rounded-lg transition-colors"
                                        >
                                            <div className="font-medium text-white text-sm">{highlight.title}</div>
                                            <div className="text-xs text-gray-400">{highlight.date}</div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No highlights this week</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
