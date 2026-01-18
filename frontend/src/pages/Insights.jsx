import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { Lightbulb, Calendar, Brain, ThumbsUp, Target, Activity } from 'lucide-react';

export default function Insights() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/ai/insights?month=${month}`);
            setData(res);
        } catch (err) {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [month]);

    const MOOD_COLORS = {
        happy: 'bg-green-400',
        excited: 'bg-yellow-400',
        calm: 'bg-blue-400',
        neutral: 'bg-gray-400',
        sad: 'bg-indigo-400',
        stressed: 'bg-red-400'
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Brain className="text-purple-400" />
                        AI Insights
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Deep analysis of your patterns and behaviors.</p>
                </div>

                <div className="flex items-center gap-2 bg-os-panel border border-os-hover p-2 rounded-lg">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-sm"
                    />
                </div>
            </div>

            {loading && <StatusMessage loading loadingText="Analyzing your life patterns..." />}

            {!loading && data && (
                <>
                    {/* Summary Hero */}
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain size={120} />
                        </div>
                        <h3 className="text-lg font-semibold text-indigo-300 mb-2">Monthly Summary</h3>
                        <p className="text-lg text-white leading-relaxed">{data.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Patterns */}
                        <div className="bg-os-panel border border-os-hover p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity size={18} className="text-blue-400" />
                                Observed Patterns
                            </h3>
                            <ul className="space-y-3">
                                {data.patterns.map((p, i) => (
                                    <li key={i} className="flex gap-3 text-gray-300 text-sm">
                                        <span className="text-blue-500 font-bold">•</span>
                                        {p}
                                    </li>
                                ))}
                                {!data.patterns.length && <p className="text-gray-500 text-sm">No clear patterns detected yet.</p>}
                            </ul>
                        </div>

                        {/* Suggestions */}
                        <div className="bg-os-panel border border-os-hover p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Lightbulb size={18} className="text-yellow-400" />
                                Suggestions
                            </h3>
                            <ul className="space-y-3">
                                {data.suggestions.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-gray-300 text-sm">
                                        <div className="mt-0.5"><ThumbsUp size={14} className="text-yellow-500" /></div>
                                        {s}
                                    </li>
                                ))}
                                {!data.suggestions.length && <p className="text-gray-500 text-sm">No suggestions available.</p>}
                            </ul>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Focus Tags */}
                        <div className="bg-os-panel border border-os-hover p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Target size={18} className="text-red-400" />
                                Key Focus Areas
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {data.focus_tags.map((tagObj, i) => (
                                    <div key={i} className="bg-os-hover border border-gray-600 px-3 py-1 rounded-full flex items-center gap-2">
                                        <span className="text-white text-sm">{tagObj.tag}</span>
                                        <span className="bg-gray-700 text-xs px-1.5 py-0.5 rounded-full text-gray-300">{tagObj.count}</span>
                                    </div>
                                ))}
                                {!data.focus_tags.length && <p className="text-gray-500 text-sm">No tags found.</p>}
                            </div>
                        </div>

                        {/* Mood Breakdown */}
                        <div className="bg-os-panel border border-os-hover p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-4">Mood Breakdown</h3>
                            <div className="space-y-3">
                                {Object.entries(data.mood_breakdown).map(([mood, count]) => (
                                    <div key={mood} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${MOOD_COLORS[mood] || 'bg-white'}`}></div>
                                        <span className="text-gray-300 capitalize w-20 text-sm">{mood}</span>
                                        <div className="flex-1 bg-os-hover h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${MOOD_COLORS[mood] || 'bg-white'}`}
                                                style={{ width: `${(count / 30) * 100}%` }} // Rough % based on 30 days
                                            ></div>
                                        </div>
                                        <span className="text-gray-500 text-xs">{count}</span>
                                    </div>
                                ))}
                                {Object.keys(data.mood_breakdown).length === 0 && <p className="text-gray-500 text-sm">No mood data recorded.</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
