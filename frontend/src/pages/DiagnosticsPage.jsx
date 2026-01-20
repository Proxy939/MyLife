import { useState, useEffect } from 'react';
import { Activity, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function DiagnosticsPage() {
    const [diagnostics, setDiagnostics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDiagnostics();
    }, []);

    const fetchDiagnostics = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/diagnostics');
            const data = await res.json();

            if (data.success) {
                setDiagnostics(data.data);
            } else {
                setError(data.error?.message || 'Failed to load diagnostics');
            }
        } catch (err) {
            setError('Network error - backend may be offline');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = () => {
        if (!diagnostics) return;

        const report = {
            ...diagnostics,
            exported_at: new Date().toISOString(),
            note: 'Privacy-safe diagnostics report'
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mylife_diagnostics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status) => {
        if (status === 'connected' || status === 'exists' || status === 'running') return 'text-green-400';
        if (status === 'not_created') return 'text-yellow-400';
        return 'text-red-400';
    };

    const getStatusIcon = (status) => {
        if (status === 'connected' || status === 'exists' || status === 'running') return <CheckCircle size={16} />;
        return <AlertCircle size={16} />;
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 border border-slate-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Activity size={28} className="text-slate-400" />
                            <h1 className="text-3xl font-bold text-white">System Diagnostics</h1>
                        </div>
                        <p className="text-gray-400">Privacy-safe system health information</p>
                    </div>
                    <button
                        onClick={exportReport}
                        disabled={!diagnostics}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <div className="animate-pulse text-gray-400">Loading diagnostics...</div>
                </div>
            ) : diagnostics ? (
                <div className="space-y-6">
                    {/* Version Info */}
                    <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Version Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm text-gray-400">Application</div>
                                <div className="text-white font-medium">{diagnostics.app_name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Version</div>
                                <div className="text-white font-medium">v{diagnostics.app_version}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Python</div>
                                <div className="text-white font-medium">{diagnostics.python_version}</div>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-os-bg rounded-lg">
                                <span className="text-gray-300">Vault</span>
                                <span className={`flex items-center gap-2 ${getStatusColor(diagnostics.vault_state)}`}>
                                    {getStatusIcon(diagnostics.vault_state)}
                                    {diagnostics.vault_state}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-os-bg rounded-lg">
                                <span className="text-gray-300">Database</span>
                                <span className={`flex items-center gap-2 ${getStatusColor(diagnostics.database_status)}`}>
                                    {getStatusIcon(diagnostics.database_status)}
                                    {diagnostics.database_status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-os-bg rounded-lg">
                                <span className="text-gray-300">Scheduler</span>
                                <span className={`flex items-center gap-2 ${getStatusColor(diagnostics.scheduler_status)}`}>
                                    {getStatusIcon(diagnostics.scheduler_status)}
                                    {diagnostics.scheduler_status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-os-bg rounded-lg">
                                <span className="text-gray-300">Google Drive Sync</span>
                                <span className={`flex items-center gap-2 ${diagnostics.sync_drive_connected ? 'text-green-400' : 'text-gray-400'}`}>
                                    {diagnostics.sync_drive_connected ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    {diagnostics.sync_drive_connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Performance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-400">Memory Usage</div>
                                <div className="text-2xl font-bold text-white">{diagnostics.memory_usage_mb} MB</div>
                            </div>
                        </div>
                    </div>

                    {/* Errors */}
                    {diagnostics.last_errors && diagnostics.last_errors.length > 0 && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Recent Errors</h2>
                            <div className="space-y-2">
                                {diagnostics.last_errors.map((err, idx) => (
                                    <div key={idx} className="text-sm text-orange-300 font-mono bg-os-bg p-2 rounded">
                                        {err}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                        <p className="text-sm text-gray-400">
                            This report is privacy-safe and does not include memory content, PIN codes, or personal data.
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
