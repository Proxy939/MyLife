import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { BarChart2, TrendingUp, Tag, Activity, Calendar } from 'lucide-react';

const MOOD_SCORES = {
    happy: 2,
    excited: 2,
    calm: 1,
    neutral: 0,
    sad: -1,
    stressed: -2
};

const MOOD_COLORS = {
    happy: '#4ade80', // green-400
    excited: '#facc15', // yellow-400
    calm: '#60a5fa', // blue-400
    neutral: '#9ca3af', // gray-400
    sad: '#818cf8', // indigo-400
    stressed: '#f87171' // red-400
};

export default function Analytics() {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch all memories (limit 1000 for client-side analytics perf)
            const data = await api.get('/memories?limit=1000');
            setMemories(data);
        } catch (err) {
            setError("Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    };

    // --- Calculations ---
    const stats = useMemo(() => {
        if (!memories.length) return null;

        // 1. Overview
        const total = memories.length;

        const moodCounts = {};
        const tagCounts = {};
        const dayActivity = {}; // YYYY-MM-DD -> count
        const trendData = []; // { date, score }

        memories.forEach(m => {
            // Mood
            const mood = m.mood || 'neutral';
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;

            // Trend
            const dateStr = new Date(m.created_at).toISOString().split('T')[0];
            const score = MOOD_SCORES[mood] ?? 0;
            trendData.push({ date: new Date(m.created_at), score, dateStr });

            // Tags
            if (m.tags) {
                m.tags.split(',').forEach(t => {
                    const tag = t.trim();
                    if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }

            // Activity
            dayActivity[dateStr] = (dayActivity[dateStr] || 0) + 1;
        });

        // Most Common Mood
        const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

        // Top Tags
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        // Sort Trend by Date
        trendData.sort((a, b) => a.date - b.date);

        // Smooth Trend (Last 30 entries max for chart clarity)
        const recentTrend = trendData.slice(-30);

        return { total, topMood, topTags, recentTrend, dayActivity, moodCounts };
    }, [memories]);

    // --- Heatmap Helper ---
    const renderHeatmap = () => {
        if (!stats) return null;

        const today = new Date();
        const days = [];
        // Generate last 90 days (approx 13 weeks)
        for (let i = 89; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = stats.dayActivity[dateStr] || 0;

            let colorClass = 'bg-os-hover'; // 0
            if (count === 1) colorClass = 'bg-blue-900';
            if (count === 2) colorClass = 'bg-blue-700';
            if (count > 2) colorClass = 'bg-blue-500';

            days.push({ dateStr, colorClass, title: `${dateStr}: ${count} memories` });
        }

        return (
            <div className="flex flex-wrap gap-1 max-w-full">
                {days.map(d => (
                    <div
                        key={d.dateStr}
                        className={`w-3 h-3 rounded-sm ${d.colorClass}`}
                        title={d.title}
                    />
                ))}
            </div>
        );
    };

    // --- SVG Line Chart Helper ---
    const renderTrendChart = () => {
        if (!stats || stats.recentTrend.length < 2) return <div className="text-gray-500 text-xs py-8 text-center">Not enough data for trends</div>;

        const data = stats.recentTrend;
        const width = 100;
        const height = 40;
        const maxScore = 2;
        const minScore = -2;
        const range = maxScore - minScore;

        // Map X (index) and Y (score) to SVG coords
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const normalizedScore = (d.score - minScore) / range; // 0 to 1
            const y = height - (normalizedScore * height);
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Zero Line (Neutral) */}
                <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#374151" strokeWidth="0.5" strokeDasharray="2" />

                {/* Trend Line */}
                <polyline
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="2"
                    points={points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        );
    };

    if (loading) return <StatusMessage loading loadingText="Crunching numbers..." />;
    if (error) return <StatusMessage error={error} onRetry={fetchData} />;
    if (!stats || stats.total === 0) return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <BarChart2 size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No Data Available</p>
            <p className="text-sm">Start writing memories to see your analytics!</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-pink-400" />
                Analytics Dashboard
            </h2>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-os-panel border border-os-hover p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Memories</p>
                        <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                        <BarChart2 className="text-blue-400" size={24} />
                    </div>
                </div>

                <div className="bg-os-panel border border-os-hover p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Mood Vibe</p>
                        <p className="text-2xl font-bold text-white mt-1 capitalize" style={{ color: MOOD_COLORS[stats.topMood] }}>
                            {stats.topMood}
                        </p>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-lg">
                        <Activity className="text-purple-400" size={24} />
                    </div>
                </div>

                <div className="bg-os-panel border border-os-hover p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Top Topic</p>
                        <p className="text-xl font-bold text-white mt-1 truncate max-w-[120px]">
                            {stats.topTags[0] ? stats.topTags[0][0] : 'None'}
                        </p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-lg">
                        <Tag className="text-green-400" size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mood Trend */}
                <div className="bg-os-panel border border-os-hover p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-400" />
                        Mood Trend (Last 30 Entries)
                    </h3>
                    <div className="h-40 w-full px-2">
                        {renderTrendChart()}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                        <span>Older</span>
                        <span>Newer</span>
                    </div>
                </div>

                {/* Tag Breakdown */}
                <div className="bg-os-panel border border-os-hover p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Tag size={18} className="text-green-400" />
                        Top Tags
                    </h3>
                    <div className="space-y-3">
                        {stats.topTags.map(([tag, count], idx) => (
                            <div key={tag} className="flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-500 w-4">{idx + 1}.</span>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-200 font-medium">{tag}</span>
                                        <span className="text-gray-400">{count}</span>
                                    </div>
                                    <div className="w-full bg-os-hover rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-full rounded-full"
                                            style={{ width: `${(count / stats.topTags[0][1]) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!stats.topTags.length && <p className="text-gray-500 text-sm">No tags found.</p>}
                    </div>
                </div>
            </div>

            {/* Activity Heatmap */}
            <div className="bg-os-panel border border-os-hover p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-orange-400" />
                    Activity Log (Last 90 Days)
                </h3>
                <div className="w-full overflow-x-auto pb-2">
                    {renderHeatmap()}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 justify-end">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-os-hover rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-900 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-700 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>

        </div>
    );
}
