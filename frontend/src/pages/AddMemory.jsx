import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Save } from 'lucide-react';

export default function AddMemory() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        note: '',
        tags: '',
        mood: 'neutral'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/memories/', form);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Log New Memory</h2>

            {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-os-panel border border-os-hover rounded p-2 text-white focus:border-os-accent outline-none"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Note</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full bg-os-panel border border-os-hover rounded p-2 text-white focus:border-os-accent outline-none"
                        value={form.note}
                        onChange={e => setForm({ ...form, note: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mood</label>
                        <select
                            className="w-full bg-os-panel border border-os-hover rounded p-2 text-white focus:border-os-accent outline-none"
                            value={form.mood}
                            onChange={e => setForm({ ...form, mood: e.target.value })}
                        >
                            <option value="neutral">Neutral</option>
                            <option value="happy">Happy</option>
                            <option value="sad">Sad</option>
                            <option value="excited">Excited</option>
                            <option value="stressed">Stressed</option>
                            <option value="calm">Calm</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            className="w-full bg-os-panel border border-os-hover rounded p-2 text-white focus:border-os-accent outline-none"
                            placeholder="work, life"
                            value={form.tags}
                            onChange={e => setForm({ ...form, tags: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-os-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Memory'}
                    </button>
                </div>
            </form>
        </div>
    );
}
