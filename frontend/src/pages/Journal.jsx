import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Calendar, PlusCircle } from 'lucide-react';

export default function Journal() {
    const [prompt, setPrompt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPrompt();
    }, []);

    const fetchPrompt = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/journal/prompt');
            const data = await res.json();

            if (data.success) {
                setPrompt(data.data);
            }
        } catch (err) {
            console.error('Error fetching prompt:', err);
        } finally {
            setLoading(false);
        }
    };

    const createDailyLog = async () => {
        setCreating(true);
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/journal/auto-draft', {
                method: 'POST'
            });

            const data = await res.json();

            if (data.success) {
                // Redirect to edit the memory
                navigate(`/memory/${data.data.id}`);
            } else {
                if (res.status === 401) {
                    setError('Vault is locked. Please unlock to create journal entries.');
                } else {
                    setError(data.error?.message || 'Failed to create daily log');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setCreating(false);
        }
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen size={28} className="text-indigo-400" />
                    <h1 className="text-3xl font-bold text-white">Daily Journal</h1>
                </div>
                <p className="text-gray-400 flex items-center gap-2">
                    <Calendar size={16} />
                    {today}
                </p>
            </div>

            {/* Daily Prompt Card */}
            {loading ? (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <div className="animate-pulse text-gray-400">Loading prompt...</div>
                </div>
            ) : prompt ? (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-purple-500/20 p-3 rounded-full">
                            <Sparkles size={24} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-2">
                                Today's Reflection Prompt
                            </h2>
                            <p className="text-2xl text-white font-medium leading-relaxed">
                                {prompt.prompt}
                            </p>
                        </div>
                    </div>

                    {/* Suggested Tags */}
                    <div className="flex gap-2 mb-6">
                        {prompt.suggested_tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={createDailyLog}
                        disabled={creating}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {creating ? (
                            <>Creating...</>
                        ) : (
                            <>
                                <PlusCircle size={20} />
                                Create Daily Log
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            ) : null}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">What is Daily Journaling?</h3>
                    <p className="text-sm text-gray-400">
                        A simple way to capture your thoughts, feelings, and experiences each day. Use the prompt as inspiration or write freely.
                    </p>
                </div>

                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Auto-Generated Template</h3>
                    <p className="text-sm text-gray-400">
                        Each daily log includes a template with checklists, reflection prompts, and sections for highlights and tomorrow's plans.
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/weekly')}
                        className="px-4 py-3 bg-os-bg hover:bg-os-hover border border-os-hover rounded-lg text-white transition-colors text-left"
                    >
                        <div className="font-medium">Weekly Review</div>
                        <div className="text-xs text-gray-400">See your week summary</div>
                    </button>
                    <button
                        onClick={() => navigate('/timeline')}
                        className="px-4 py-3 bg-os-bg hover:bg-os-hover border border-os-hover rounded-lg text-white transition-colors text-left"
                    >
                        <div className="font-medium">All Memories</div>
                        <div className="text-xs text-gray-400">View your timeline</div>
                    </button>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300">
                    <strong>Tip:</strong> A daily log is automatically created at 10 PM each day. You can also create one manually anytime!
                </p>
            </div>
        </div>
    );
}
