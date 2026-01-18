import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Sparkles, TrendingUp, Hash } from 'lucide-react';

export default function RecapCard({ month }) {
    const [recap, setRecap] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchRecap() {
            setLoading(true);
            try {
                const data = await api.get(`/recap/monthly?month=${month}`);
                setRecap(data);
            } catch (err) {
                console.error("Recap fetch error", err);
                setRecap(null);
            } finally {
                setLoading(false);
            }
        }
        if (month) fetchRecap();
    }, [month]);

    if (loading) return <div className="animate-pulse h-40 bg-os-hover rounded-xl"></div>;
    if (!recap) return <div className="text-gray-500 text-center py-10">No recap available via Auto Mode.</div>;

    return (
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-yellow-400" size={20} />
                <h2 className="font-bold text-lg text-white">Monthly Recap</h2>
            </div>

            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                {recap.summary}
            </p>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-blue-300">
                    <TrendingUp size={14} />
                    <span>Mood: <span className="capitalize font-semibold text-white">{recap.mood_hint}</span></span>
                </div>

                {recap.highlights.length > 0 && (
                    <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase">Highlights</h3>
                        <ul className="text-sm space-y-1">
                            {recap.highlights.map((h, i) => (
                                <li key={i} className="flex items-center gap-2 truncate text-gray-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                                    {h}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
