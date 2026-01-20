import { useState, useEffect } from 'react';
import { Sparkles, Copy, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

export default function Cleanup() {
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [merging, setMerging] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const scanDuplicates = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://127.0.0.1:8000/cleanup/duplicates');
            const data = await res.json();

            if (data.success) {
                setDuplicates(data.data.groups || []);
                setSuccess(`Found ${data.data.total_groups} duplicate groups`);
            } else {
                if (res.status === 401) {
                    setError('Vault is locked. Please unlock to scan duplicates.');
                } else {
                    setError(data.error?.message || 'Failed to scan duplicates');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleMerge = async (group) => {
        if (!confirm(`Merge ${group.memory_ids.length} memories? This cannot be undone.`)) {
            return;
        }

        setMerging({ [group.group_id]: true });
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://127.0.0.1:8000/cleanup/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memory_ids: group.memory_ids })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(`Merged ${data.data.merged_count} memories successfully!`);
                // Remove from duplicates list
                setDuplicates(prev => prev.filter(g => g.group_id !== group.group_id));
            } else {
                setError(data.error?.message || 'Failed to merge memories');
            }
        } catch (err) {
            setError('Network error during merge');
        } finally {
            setMerging({});
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles size={28} className="text-purple-400" />
                    <h1 className="text-3xl font-bold text-white">Smart Cleanup</h1>
                </div>
                <p className="text-gray-400">Organize your timeline by detecting duplicates and enhancing memories</p>
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

            {/* Actions */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Scan for Duplicates</h2>
                <p className="text-sm text-gray-400 mb-4">
                    Scan your timeline for duplicate memories based on title, content, and timestamp.
                </p>
                <button
                    onClick={scanDuplicates}
                    disabled={loading}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <RefreshCw size={18} className="animate-spin" />
                            Scanning...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Scan Duplicates
                        </>
                    )}
                </button>
            </div>

            {/* Duplicate Groups */}
            {duplicates.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Duplicate Groups ({duplicates.length})</h2>

                    {duplicates.map((group) => (
                        <div
                            key={group.group_id}
                            className="bg-os-panel border border-os-hover rounded-xl p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Copy size={18} className="text-yellow-400" />
                                        <h3 className="text-white font-medium">
                                            {group.memory_ids.length} Similar Memories
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-400">{group.reason}</p>
                                </div>
                                <button
                                    onClick={() => handleMerge(group)}
                                    disabled={merging[group.group_id]}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    {merging[group.group_id] ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Merging...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            Merge
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Memory IDs */}
                            <div className="flex flex-wrap gap-2">
                                {group.memory_ids.map(id => (
                                    <a
                                        key={id}
                                        href={`/memory/${id}`}
                                        className="px-3 py-1 bg-os-bg hover:bg-os-hover rounded-lg text-sm text-gray-300 transition-colors"
                                    >
                                        #{id}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Duplicates */}
            {!loading && duplicates.length === 0 && success && (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No Duplicates Found</p>
                    <p className="text-gray-400 text-sm">Your timeline is clean!</p>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">How It Works</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Detects similar titles and content</li>
                        <li>• Checks timestamp proximity</li>
                        <li>• Groups potential duplicates</li>
                        <li>• Merges into single memory</li>
                    </ul>
                </div>

                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Merge Process</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Combines all notes</li>
                        <li>• Merges tags (unique)</li>
                        <li>• Keeps all photos</li>
                        <li>• Deletes old duplicates</li>
                    </ul>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <p className="text-sm text-orange-300">
                    <strong>Warning:</strong> Merging memories is permanent and cannot be undone. Make sure to review duplicate groups before merging.
                </p>
            </div>
        </div>
    );
}
