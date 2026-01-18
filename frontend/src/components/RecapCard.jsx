import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Sparkles, TrendingUp } from 'lucide-react';
import StatusMessage from './StatusMessage';

export default function RecapCard({ month }) {
    const [recap, setRecap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchRecap() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get(`/recap/monthly?month=${month}`);
            setRecap(data);
        } catch (err) {
            console.error("Recap fetch error", err);
            // Don't show full error UI for recap sidebar, just fallback or simple message
            setError("AI Recap unavailable.");
            setRecap(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (month) fetchRecap();
    }, [month]);

    if (loading) return (
        <div className="bg-os-panel border border-os-hover rounded-2xl p-5 shadow-lg h-60 flex items-center justify-center">
            <StatusMessage loading loadingText="Generating AI Recap..." />
        </div>
    );

    if (error || !recap) return (
        <div className="bg-os-panel border border-os-hover rounded-2xl p-5 shadow-lg text-center">
            <div className="text-gray-500 mb-2">No recap available</div>
            <button onClick={fetchRecap} className="text-xs text-os-accent hover:underline">Retry</button>
        </div>
    );

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
