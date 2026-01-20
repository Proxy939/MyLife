import { useState } from 'react';
import { AlertTriangle, Download, RefreshCw, Trash2 } from 'lucide-react';

export default function VaultRecovery() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleEmergencyExport = async () => {
        setMessage('');
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/vault/emergency-export');

            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Export failed');
                return;
            }

            // Download file
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'MyLife-emergency-export.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setMessage('Emergency export downloaded successfully');

        } catch (err) {
            setError('Network error during export');
        }
    };

    const handleRecover = async () => {
        if (!confirm('This will archive the corrupted vault and allow you to create a new one. Your encrypted backup will be preserved. Continue?')) {
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/vault/recover', {
                method: 'POST'
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error?.message || 'Recovery failed');
                setLoading(false);
                return;
            }

            setMessage('Vault recovered! Redirecting to setup...');
            setTimeout(() => {
                window.location.href = '/vault/setup';
            }, 2000);

        } catch (err) {
            setError('Network error during recovery');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4">
                        <AlertTriangle size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Vault Unavailable</h1>
                    <p className="text-gray-400">Your vault appears to be corrupted or missing</p>
                </div>

                {/* Actions Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl space-y-6">

                    {/* Emergency Export */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500/20 p-3 rounded-lg">
                                <Download size={24} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">Emergency Export</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Download all encrypted vault files (database, photos, backups). You'll need your PIN to decrypt them later.
                                </p>
                                <button
                                    onClick={handleEmergencyExport}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    Download Emergency Backup
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recover Vault */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-orange-500/20 p-3 rounded-lg">
                                <RefreshCw size={24} className="text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">Recover Vault</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Archive the corrupted vault and create a fresh one. Your encrypted backups will be preserved in the vault folder.
                                </p>
                                <button
                                    onClick={handleRecover}
                                    disabled={loading}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Recovering...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Recover Vault
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-300">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                            {error}
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 p-4 bg-gray-700/50 border border-gray-600 rounded-xl">
                        <p className="text-xs text-gray-400">
                            <strong>What happened?</strong> The vault database file may be corrupted, or the runtime database is missing. Recovery will preserve your encrypted backups while allowing you to create a new vault.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
