import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Trash2 } from 'lucide-react';

export default function HabitTracker() {
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [completions, setCompletions] = useState({});

    useEffect(() => {
        // Load habits
        const stored = localStorage.getItem('mylife_habits');
        if (stored) {
            try {
                setHabits(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading habits:', e);
            }
        }

        // Load today's completions
        const today = new Date().toISOString().split('T')[0];
        const storedCompletions = localStorage.getItem(`mylife_habit_completions_${today}`);
        if (storedCompletions) {
            try {
                setCompletions(JSON.parse(storedCompletions));
            } catch (e) {
                console.error('Error loading completions:', e);
            }
        }
    }, []);

    const saveHabits = (newHabits) => {
        localStorage.setItem('mylife_habits', JSON.stringify(newHabits));
        setHabits(newHabits);
    };

    const saveCompletions = (newCompletions) => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`mylife_habit_completions_${today}`, JSON.stringify(newCompletions));
        setCompletions(newCompletions);
    };

    const addHabit = () => {
        if (!newHabit.trim()) return;
        const habit = {
            id: Date.now().toString(),
            name: newHabit.trim(),
            createdAt: new Date().toISOString()
        };
        saveHabits([...habits, habit]);
        setNewHabit('');
    };

    const deleteHabit = (id) => {
        saveHabits(habits.filter(h => h.id !== id));
    };

    const toggleCompletion = (habitId) => {
        const newCompletions = { ...completions };
        newCompletions[habitId] = !newCompletions[habitId];
        saveCompletions(newCompletions);
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const completedCount = Object.values(completions).filter(Boolean).length;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <CheckSquare size={28} className="text-blue-400" />
                    <h1 className="text-3xl font-bold text-white">Habit Tracker</h1>
                </div>
                <p className="text-gray-400 flex items-center gap-2">
                    <Calendar size={16} />
                    {today}
                </p>
            </div>

            {/* Progress */}
            {habits.length > 0 && (
                <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Today's Progress</span>
                        <span className="text-lg font-bold text-white">
                            {completedCount} / {habits.length}
                        </span>
                    </div>
                    <div className="w-full bg-os-bg rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${habits.length > 0 ? (completedCount / habits.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Add Habit */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                <h2 className="text-lg font-semibold text-white mb-3">Add New Habit</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newHabit}
                        onChange={(e) => setNewHabit(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                        placeholder="e.g., Drink 8 glasses of water"
                        className="flex-1 px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={addHabit}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Habits List */}
            <div className="space-y-2">
                {habits.length === 0 ? (
                    <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                        <CheckSquare size={48} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No habits yet. Add your first habit above!</p>
                    </div>
                ) : (
                    habits.map(habit => (
                        <div
                            key={habit.id}
                            className="bg-os-panel border border-os-hover rounded-xl p-4 flex items-center gap-4 hover:border-blue-500/30 transition-colors"
                        >
                            <button
                                onClick={() => toggleCompletion(habit.id)}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${completions[habit.id]
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-600 hover:border-green-500'
                                    }`}
                            >
                                {completions[habit.id] && (
                                    <CheckSquare size={16} className="text-white" />
                                )}
                            </button>
                            <span
                                className={`flex-1 ${completions[habit.id]
                                        ? 'text-gray-500 line-through'
                                        : 'text-white'
                                    }`}
                            >
                                {habit.name}
                            </span>
                            <button
                                onClick={() => deleteHabit(habit.id)}
                                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
