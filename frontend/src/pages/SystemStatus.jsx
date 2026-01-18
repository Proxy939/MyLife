import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { Server, Activity, Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function SystemStatus() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get('/system/status');
            setStatus(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const formatTime = (iso) => {
        if (!iso) return "Not Scheduled";
        return new Date(iso).toLocaleString();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Server className="text-blue-400" />
                    System Status
                </h2>
                <button
                    onClick={fetchStatus}
                    className="p-2 bg-os-panel border border-os-hover rounded-lg text-gray-400 hover:text-white hover:border-os-accent transition-colors"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {error && <StatusMessage error={error} onRetry={fetchStatus} />}
            {loading && !status && <StatusMessage loading loadingText="Checking system health..." />}

            {status && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Main Status Card */}
                    <div className="bg-os-panel border border-os-hover p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Backend Scheduler</h3>
                            <p className="text-sm text-gray-400">Background task manager for recaps & maintenance.</p>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${status.scheduler_running ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'}`}>
                            {status.scheduler_running ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="font-bold">{status.scheduler_running ? "RUNNING" : "STOPPED"}</span>
                        </div>
                    </div>

                    {/* Job Details */}
                    <h3 className="text-lg font-semibold text-white mt-4 flex items-center gap-2">
                        <Activity size={18} className="text-purple-400" />
                        Active Jobs
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {status.jobs.map(job => (
                            <div key={job.id} className="bg-os-panel border border-os-hover p-4 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-xs bg-os-hover px-2 py-1 rounded text-gray-300">{job.id}</span>
                                    <Clock size={16} className="text-gray-500" />
                                </div>
                                <h4 className="font-medium text-white mb-1">
                                    {job.id === 'job_recap' && 'Daily Auto-Recap'}
                                    {job.id === 'job_embeddings' && 'Embedding Refresh'}
                                    {!['job_recap', 'job_embeddings'].includes(job.id) && 'Unknown Job'}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Next Run: <span className="text-blue-300">{formatTime(job.next_run)}</span>
                                </p>
                            </div>
                        ))}
                        {status.jobs.length === 0 && (
                            <p className="text-gray-500 text-sm italic">No active jobs found.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
