import { useState, useEffect } from 'react';
import { FileText, Clock, RotateCcw, AlertCircle } from 'lucide-react';

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/versions/audit');
            const data = await res.json();

            if (data.success) {
                setLogs(data.data.logs || []);
            } else {
                setError(data.error?.message || 'Failed to load audit log');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const actionColors = {
        create: 'text-green-400',
        update: 'text-blue-400',
        delete: 'text-red-400',
        restore: 'text-purple-400',
        restore_version: 'text-cyan-400',
        permanent_delete: 'text-red-600'
    };

    const actionIcons = {
        create: '+',
        update: '✎',
        delete: '×',
        restore: '↻',
        restore_version: '⟲',
        permanent_delete: '⚠'
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <FileText size={28} className="text-gray-400" />
                    <h1 className="text-3xl font-bold text-white">Audit Log</h1>
                </div>
                <p className="text-gray-400">Complete activity history</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            {/* Logs */}
            {loading ? (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <div className="animate-pulse text-gray-400">Loading audit log...</div>
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                    <FileText size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No Activity Yet</p>
                    <p className="text-gray-400 text-sm">Actions will appear here</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log, idx) => (
                        <div
                            key={log.id}
                            className="bg-os-panel border border-os-hover rounded-xl p-4 hover:border-gray-500/30 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                {/* Action Icon */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-os-bg flex items-center justify-center ${actionColors[log.action_type] || 'text-gray-400'}`}>
                                    <span className="font-bold text-sm">
                                        {actionIcons[log.action_type] || '•'}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-semibold uppercase ${actionColors[log.action_type] || 'text-gray-400'}`}>
                                            {log.action_type.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-600">•</span>
                                        <span className="text-xs text-gray-500">
                                            {log.entity_type}
                                        </span>
                                        {log.entity_id && (
                                            <>
                                                <span className="text-xs text-gray-600">•</span>
                                                <span className="text-xs text-gray-500">
                                                    #{log.entity_id}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-white text-sm">{log.message}</p>
                                </div>

                                {/* Timestamp */}
                                <div className="flex-shrink-0 text-xs text-gray-500">
                                    <Clock size={12} className="inline mr-1" />
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
