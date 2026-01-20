import { useState, useEffect } from 'react';
import { FileBarChart, Calendar, TrendingUp, Award } from 'lucide-react';

export default function Reports() {
    const [tab, setTab] = useState('weekly');
    const [weekStart, setWeekStart] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Set current week start
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        setWeekStart(monday.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (tab === 'weekly' && weekStart) {
            fetchWeeklyReport();
        } else if (tab === 'yearly') {
            fetchYearlyReport();
        }
    }, [tab, weekStart, year]);

    const fetchWeeklyReport = async () => {
        if (!weekStart) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`http://127.0.0.1:8000/reports/weekly?week_start=${weekStart}`);
            const data = await res.json();

            if (data.success) {
                setReport(data.data);
            } else {
                setError(data.error?.message || 'Failed to load report');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const fetchYearlyReport = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`http://127.0.0.1:8000/reports/yearly?year=${year}`);
            const data = await res.json();

            if (data.success) {
                setReport(data.data);
            } else {
                setError(data.error?.message || 'Failed to load report');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <FileBarChart size={28} className="text-blue-400" />
                    <h1 className="text-3xl font-bold text-white">Life Reports</h1>
                </div>
                <p className="text-gray-400">Insights from your journey</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-os-panel rounded-xl p-1">
                <button
                    onClick={() => setTab('weekly')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${tab === 'weekly' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Weekly Report
                </button>
                <button
                    onClick={() => setTab('yearly')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${tab === 'yearly' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Yearly Report
                </button>
            </div>

            {/* Controls */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                {tab === 'weekly' ? (
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={weekStart}
                            onChange={(e) => setWeekStart(e.target.value)}
                            className="px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-gray-400 text-sm">Week starting</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            min="2000"
                            max="2100"
                            className="px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-gray-400 text-sm">Year</span>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            {/* Report */}
            {loading ? (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <div className="animate-pulse text-gray-400">Loading report...</div>
                </div>
            ) : report ? (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-2">Summary</h2>
                        <p className="text-gray-300">{report.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Stats */}
                        <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={20} className="text-cyan-400" />
                                <h3 className="text-lg font-semibold text-white">Stats</h3>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">
                                {report.total_memories}
                            </div>
                            <div className="text-sm text-gray-400">
                                {tab === 'weekly' ? 'Memories this week' : 'Memories this year'}
                            </div>
                        </div>

                        {/* Best/Hardest Months (yearly only) */}
                        {tab === 'yearly' && (
                            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Award size={20} className="text-yellow-400" />
                                    <h3 className="text-lg font-semibold text-white">Key Months</h3>
                                </div>
                                {report.best_month && (
                                    <div className="mb-2">
                                        <div className="text-sm text-gray-400">Best Month</div>
                                        <div className="text-lg text-green-400">{report.best_month}</div>
                                    </div>
                                )}
                                {report.hardest_month && (
                                    <div>
                                        <div className="text-sm text-gray-400">Hardest Month</div>
                                        <div className="text-lg text-orange-400">{report.hardest_month}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Top Tags */}
                        {report.top_tags && report.top_tags.length > 0 && (
                            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-3">Top Themes</h3>
                                <div className="flex flex-wrap gap-2">
                                    {report.top_tags.slice(0, 8).map(item => (
                                        <span
                                            key={item.tag}
                                            className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm"
                                        >
                                            #{item.tag} ({item.count})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mood Breakdown */}
                        {report.mood_breakdown && Object.keys(report.mood_breakdown).length > 0 && (
                            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-3">Mood Breakdown</h3>
                                <div className="space-y-2">
                                    {Object.entries(report.mood_breakdown).map(([mood, count]) => (
                                        <div key={mood} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300 capitalize">{mood}</span>
                                            <span className="text-gray-400">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggestions / Growth Insights */}
                    {(report.suggestions || report.growth_insights) && (
                        <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-3">
                                {tab === 'weekly' ? 'Suggestions' : 'Growth Insights'}
                            </h3>
                            <ul className="space-y-2">
                                {(report.suggestions || report.growth_insights).map((item, idx) => (
                                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
