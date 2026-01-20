import { useState, useEffect } from 'react';
import { RefreshCw, Upload, Download, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';

export default function SyncPage() {
    const [status, setStatus] = useState(null);
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStatus();
        fetchConflicts();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/sync/status');
            const data = await res.json();

            if (data.success) {
                setStatus(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch status:', err);
        }
    };

    const fetchConflicts = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/sync/conflicts');
            const data = await res.json();

            if (data.success) {
                setConflicts(data.data.conflicts || []);
            }
        } catch (err) {
            console.error('Failed to fetch conflicts:', err);
        }
    };

    const handlePush = async () => {
        setPushing(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://127.0.0.1:8000/sync/push', {
                method: 'POST'
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Successfully pushed to Google Drive!');
                fetchStatus();
            } else {
                if (res.status === 401) {
                    setError('Unlock vault to sync');
                } else {
                    setError(data.error?.message || 'Push failed');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setPushing(false);
        }
    };

    const handlePull = async () => {
        setPulling(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://127.0.0.1:8000/sync/pull', {
                method: 'POST'
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Successfully pulled from Google Drive!');
                fetchStatus();
                fetchConflicts();
            } else {
                if (res.status === 401) {
                    setError('Unlock vault to sync');
                } else if (data.error?.conflict) {
                    setError('Conflict detected! Resolve conflicts before pulling.');
                    fetchConflicts();
                } else {
                    setError(data.error?.message || 'Pull failed');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setPulling(false);
        }
    };

    const handleResolveConflict = async (strategy) => {
        if (!confirm(`Resolve conflict using "${strategy}" strategy?`)) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://127.0.0.1:8000/sync/conflicts/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(`Conflict resolved using "${strategy}" strategy`);
                fetchConflicts();
            } else {
                setError(data.error?.message || 'Resolution failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <RefreshCw size={28} className="text-blue-400" />
                    <h1 className="text-3xl font-bold text-white">Encrypted Sync</h1>
                </div>
                <p className="text-gray-400">Cross-device sync with end-to-end encryption</p>
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

            {/* Conflicts */}
            {conflicts.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={24} className="text-orange-400" />
                        <h2 className="text-lg font-semibold text-white">Conflicts Detected ({conflicts.length})</h2>
                    </div>

                    {conflicts.map((conflict, idx) => (
                        <div key={idx} className="bg-os-bg rounded-lg p-4 mb-3">
                            <p className="text-white font-medium mb-2">{conflict.message}</p>
                            <p className="text-xs text-gray-400 mb-3">
                                Type: {conflict.type}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleResolveConflict('keep_local')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm disabled:opacity-50"
                                >
                                    Keep Local
                                </button>
                                <button
                                    onClick={() => handleResolveConflict('use_remote')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm disabled:opacity-50"
                                >
                                    Use Remote
                                </button>
                                <button
                                    onClick={() => handleResolveConflict('merge')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm disabled:opacity-50"
                                >
                                    Merge (Advanced)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Device Info */}
            {status && (
                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Smartphone size={20} className="text-cyan-400" />
                        <h2 className="text-lg font-semibold text-white">Device Info</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-400">Device ID</div>
                            <div className="text-white font-mono text-xs mt-1">
                                {status.device_id?.substring(0, 16)}...
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400">Drive Status</div>
                            <div className="mt-1">
                                {status.drive_connected ? (
                                    <span className="text-green-400 text-sm flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        Connected
                                    </span>
                                ) : (
                                    <span className="text-red-400 text-sm flex items-center gap-1">
                                        <AlertTriangle size={14} />
                                        Not Connected
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400">Last Push</div>
                            <div className="text-white text-sm mt-1">
                                {status.last_push_at
                                    ? new Date(status.last_push_at).toLocaleString()
                                    : 'Never'}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400">Last Pull</div>
                            <div className="text-white text-sm mt-1">
                                {status.last_pull_at
                                    ? new Date(status.last_pull_at).toLocaleString()
                                    : 'Never'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Push to Cloud</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Upload encrypted snapshot to Google Drive
                    </p>
                    <button
                        onClick={handlePush}
                        disabled={pushing}
                        className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {pushing ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Pushing...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Push Now
                            </>
                        )}
                    </button>
                </div>

                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Pull from Cloud</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Download and restore latest snapshot
                    </p>
                    <button
                        onClick={handlePull}
                        disabled={pulling}
                        className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {pulling ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Pulling...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Pull Latest
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li>• All data is encrypted before upload (end-to-end encryption)</li>
                    <li>• Sync is manual and user-controlled</li>
                    <li>• Conflict detection prevents data loss</li>
                    <li>• Works offline - sync when ready</li>
                    <li>• Google Drive integration for cross-device access</li>
                </ul>
            </div>

            {/* Warning */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <p className="text-sm text-orange-300">
                    <strong>Important:</strong> Always resolve conflicts carefully. "Use Remote" will overwrite your local data. Use "Merge" for advanced conflict resolution.
                </p>
            </div>
        </div>
    );
}
