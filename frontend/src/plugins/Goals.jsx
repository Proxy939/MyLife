import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Check } from 'lucide-react';

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState('personal');

    useEffect(() => {
        const stored = localStorage.getItem('mylife_goals');
        if (stored) {
            try {
                setGoals(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading goals:', e);
            }
        }
    }, []);

    const saveGoals = (newGoals) => {
        localStorage.setItem('mylife_goals', JSON.stringify(newGoals));
        setGoals(newGoals);
    };

    const addGoal = () => {
        if (!newGoal.trim()) return;
        const goal = {
            id: Date.now().toString(),
            title: newGoal.trim(),
            category: newGoalCategory,
            completed: false,
            createdAt: new Date().toISOString()
        };
        saveGoals([...goals, goal]);
        setNewGoal('');
    };

    const toggleGoal = (id) => {
        saveGoals(goals.map(g =>
            g.id === id ? { ...g, completed: !g.completed } : g
        ));
    };

    const deleteGoal = (id) => {
        saveGoals(goals.filter(g => g.id !== id));
    };

    const categories = ['personal', 'health', 'career', 'financial', 'learning'];
    const categoryColors = {
        personal: 'from-blue-500 to-purple-500',
        health: 'from-green-500 to-emerald-500',
        career: 'from-orange-500 to-red-500',
        financial: 'from-yellow-500 to-orange-500',
        learning: 'from-cyan-500 to-blue-500'
    };

    const activeGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Target size={28} className="text-purple-400" />
                    <h1 className="text-3xl font-bold text-white">Goals</h1>
                </div>
                <p className="text-gray-400">Track your personal and professional goals</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">{activeGoals.length}</div>
                    <div className="text-sm text-gray-400">Active Goals</div>
                </div>
                <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">{completedGoals.length}</div>
                    <div className="text-sm text-gray-400">Completed</div>
                </div>
            </div>

            {/* Add Goal */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                <h2 className="text-lg font-semibold text-white mb-3">Add New Goal</h2>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                        placeholder="e.g., Learn a new language"
                        className="w-full px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setNewGoalCategory(cat)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${newGoalCategory === cat
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-os-bg text-gray-400 hover:bg-os-hover'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={addGoal}
                        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Add Goal
                    </button>
                </div>
            </div>

            {/* Active Goals */}
            {activeGoals.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-white mb-2">Active Goals</h2>
                    {activeGoals.map(goal => (
                        <div
                            key={goal.id}
                            className="bg-os-panel border border-os-hover rounded-xl p-4 hover:border-purple-500/30 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => toggleGoal(goal.id)}
                                    className="mt-1 w-5 h-5 rounded border-2 border-gray-600 hover:border-green-500 transition-colors"
                                />
                                <div className="flex-1">
                                    <h3 className="text-white font-medium">{goal.title}</h3>
                                    <div className="mt-2">
                                        <span className={`inline-block px-2 py-1 rounded text-xs bg-gradient-to-r ${categoryColors[goal.category]} text-white`}>
                                            {goal.category}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteGoal(goal.id)}
                                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-400 mb-2">Completed Goals</h2>
                    {completedGoals.map(goal => (
                        <div
                            key={goal.id}
                            className="bg-os-panel/50 border border-os-hover rounded-xl p-4"
                        >
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => toggleGoal(goal.id)}
                                    className="mt-1 w-5 h-5 rounded bg-green-500 flex items-center justify-center"
                                >
                                    <Check size={14} className="text-white" />
                                </button>
                                <div className="flex-1">
                                    <h3 className="text-gray-500 line-through">{goal.title}</h3>
                                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs bg-gradient-to-r ${categoryColors[goal.category]}/50 text-gray-400`}>
                                        {goal.category}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteGoal(goal.id)}
                                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {goals.length === 0 && (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <Target size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No goals yet. Set your first goal above!</p>
                </div>
            )}
        </div>
    );
}
