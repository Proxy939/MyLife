import { useState, useEffect } from 'react';
import { Target, PlusCircle, CheckCircle, Trash2, Sparkles } from 'lucide-react';

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newGoal, setNewGoal] = useState({ title: '', description: '' });
    const [extracting, setExtracting] = useState(false);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/goals');
            const data = await res.json();

            if (data.success) {
                setGoals(data.data.goals || []);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const createGoal = async () => {
        if (!newGoal.title.trim()) return;

        try {
            const res = await fetch('http://127.0.0.1:8000/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGoal)
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Goal created!');
                setNewGoal({ title: '', description: '' });
                fetchGoals();
            } else {
                setError(data.error?.message || 'Failed to create goal');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const toggleGoal = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'completed' : 'active';

        try {
            const res = await fetch(`http://127.0.0.1:8000/goals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();

            if (data.success) {
                fetchGoals();
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const deleteGoal = async (id) => {
        if (!confirm('Delete this goal?')) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/goals/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                fetchGoals();
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const extractGoals = async () => {
        setExtracting(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://127.0.0.1:8000/goals/extract', {
                method: 'POST'
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(`Extracted ${data.data.extracted_count} goals from your memories!`);
                fetchGoals();
            } else {
                setError(data.error?.message || 'Extraction failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setExtracting(false);
        }
    };

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Target size={28} className="text-green-400" />
                            <h1 className="text-3xl font-bold text-white">Goals</h1>
                        </div>
                        <p className="text-gray-400">Track your aspirations and achievements</p>
                    </div>
                    <button
                        onClick={extractGoals}
                        disabled={extracting}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        {extracting ? (
                            <>Extracting...</>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Extract from Memories
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-300">
                    {success}
                </div>
            )}

            {/* New Goal */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Create New Goal</h2>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        placeholder="Goal title..."
                        className="w-full px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                    <textarea
                        value={newGoal.description}
                        onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                        placeholder="Description (optional)..."
                        className="w-full px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
                        rows="2"
                    />
                    <button
                        onClick={createGoal}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <PlusCircle size={18} />
                        Add Goal
                    </button>
                </div>
            </div>

            {/* Active Goals */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">Active Goals ({activeGoals.length})</h2>
                {activeGoals.length === 0 ? (
                    <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                        <Target size={48} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No active goals yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activeGoals.map(goal => (
                            <div key={goal.id} className="bg-os-panel border border-os-hover rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium">{goal.title}</h3>
                                        {goal.description && (
                                            <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => toggleGoal(goal.id, goal.status)}
                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                            title="Mark as completed"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteGoal(goal.id)}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-3">Completed ({completedGoals.length})</h2>
                    <div className="space-y-2">
                        {completedGoals.map(goal => (
                            <div key={goal.id} className="bg-os-bg border border-os-hover rounded-xl p-4 opacity-60">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-gray-400 font-medium line-through">{goal.title}</h3>
                                        {goal.completed_at && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Completed: {new Date(goal.completed_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteGoal(goal.id)}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
