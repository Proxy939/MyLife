import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function TrashPage() {
    const [trash, setTrash] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTrash();
    }, []);

    const fetchTrash = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/trash');
            const data = await res.json();

            if (data.success) {
                setTrash(data.data.trash || []);
            } else {
                setError(data.error?.message || 'Failed to load trash');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/trash/restore/${id}`, {
                method: 'POST'
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Memory restored successfully!');
                setTrash(trash.filter(m => m.id !== id));
            } else {
                setError(data.error?.message || 'Restore failed');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!confirm('Permanently delete this memory? This CANNOT be undone!')) {
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/trash/permanent-delete/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Memory permanently deleted');
                setTrash(trash.filter(m => m.id !== id));
            } else {
                setError(data.error?.message || 'Delete failed');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Trash2 size={28} className="text-red-400" />
                    <h1 className="text-3xl font-bold text-white">Trash</h1>
                </div>
                <p className="text-gray-400">Deleted memories • Can be restored or permanently deleted</p>
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

            {/* Trash List */}
            {loading ? (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <div className="animate-pulse text-gray-400">Loading trash...</div>
                </div>
            ) : trash.length === 0 ? (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <Trash2 size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Trash is Empty</p>
                    <p className="text-gray-400 text-sm">Deleted memories will appear here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {trash.map(memory => (
                        <div
                            key={memory.id}
                            className="bg-os-panel border border-os-hover rounded-xl p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-400 line-through mb-1">
                                        {memory.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {memory.note}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-os-hover">
                                <div className="text-xs text-gray-500">
                                    Deleted: {new Date(memory.deleted_at).toLocaleString()}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRestore(memory.id)}
                                        className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm flex items-center gap-2"
                                    >
                                        <RotateCcw size={14} />
                                        Restore
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(memory.id)}
                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm flex items-center gap-2"
                                    >
                                        <AlertTriangle size={14} />
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Warning */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <p className="text-sm text-orange-300">
                    <strong>Note:</strong> Memories can be restored from trash. Use "Delete Forever" when you're absolutely certain.
                </p>
            </div>
        </div>
    );
}
