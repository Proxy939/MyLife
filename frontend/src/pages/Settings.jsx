import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { Cpu, Server, Save, Download, Upload, AlertTriangle, Archive } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        ai_provider: 'auto',
        local_model: 'none',
        openai_enabled: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    // Backup State
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [confirmRestore, setConfirmRestore] = useState(false);
    const [backupStatus, setBackupStatus] = useState(null);

    async function fetchSettings() {
        try {
            const data = await api.get('/settings/ai');
            setSettings(data);
        } catch (err) {
            setStatus({ type: 'error', text: "Failed to load settings: " + err.message });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await api.put('/settings/ai', settings);
            setStatus({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err) {
            setStatus({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadBackup = async () => {
        setBackupStatus({ type: 'info', text: 'Preparing backup download...' });
        try {
            const blob = await api.download('/backup/export');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `MyLife-backup-${date}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setBackupStatus(null);
        } catch (err) {
            setBackupStatus({ type: 'error', text: "Backup failed: " + err.message });
        }
    };

    const handleRestoreBackup = async () => {
        if (!restoreFile || !confirmRestore) return;

        setIsRestoring(true);
        setBackupStatus({ type: 'info', text: 'Uploading and restoring backup...' });

        const formData = new FormData();
        formData.append('file', restoreFile);

        try {
            await api.post('/backup/restore', formData);
            setBackupStatus({ type: 'success', text: 'Restore successful! Please refresh the page.' });
            setRestoreFile(null);
            setConfirmRestore(false);
            // Optional: Force reload window.location.reload();
        } catch (err) {
            setBackupStatus({ type: 'error', text: "Restore failed: " + err.message });
        } finally {
            setIsRestoring(false);
        }
    };

    if (loading) return <StatusMessage loading loadingText="Loading configuration..." />;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Cpu className="text-blue-400" />
                Configuration
            </h2>

            {status && status.type === 'error' && <StatusMessage error={status.text} onRetry={fetchSettings} />}

            {status && status.type === 'success' && (
                <div className="bg-green-900/30 border border-green-500/50 text-green-200 p-3 rounded-lg mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    {status.text}
                </div>
            )}

            {/* AI SETTINGS */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">AI Settings</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">AI Provider</label>
                    <div className="grid grid-cols-1 gap-3">
                        {['auto', 'local', 'openai'].map(mode => (
                            <label key={mode} className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${settings.ai_provider === mode ? 'border-os-accent bg-blue-900/10' : 'border-os-hover hover:border-gray-500 bg-os-bg'}`}>
                                <input
                                    type="radio"
                                    name="provider"
                                    className="mr-3 accent-os-accent"
                                    checked={settings.ai_provider === mode}
                                    onChange={() => setSettings({ ...settings, ai_provider: mode })}
                                />
                                <div>
                                    <div className="font-semibold text-white capitalize">{mode} Mode</div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {mode === 'auto' && 'Best for weak hardware. Uses simple rules.'}
                                        {mode === 'local' && 'Run LLMs locally via Ollama.'}
                                        {mode === 'openai' && 'Connect to OpenAI Cloud API.'}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {settings.ai_provider === 'local' && (
                    <div className="pl-6 border-l-2 border-os-hover animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Local Model</label>
                        <select
                            className="w-full bg-os-bg border border-os-hover rounded-lg p-2.5 text-white focus:border-os-accent outline-none"
                            value={settings.local_model}
                            onChange={e => setSettings({ ...settings, local_model: e.target.value })}
                        >
                            <option value="none">Select a model...</option>
                            <option value="phi3">Phi-3 Mini (3.8GB)</option>
                            <option value="mistral">Mistral 7B (4.1GB)</option>
                            <option value="llama3">Llama 3.1 8B (4.7GB)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <Server size={12} /> Make sure Ollama is running.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="checkbox"
                        id="openai_toggle"
                        className="w-4 h-4 accent-os-accent cursor-pointer"
                        checked={settings.openai_enabled}
                        onChange={e => setSettings({ ...settings, openai_enabled: e.target.checked })}
                    />
                    <label htmlFor="openai_toggle" className="text-gray-300 text-sm cursor-pointer">Enable OpenAI Features (requires backend env key)</label>
                </div>

                <div className="pt-4 border-t border-os-hover">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-os-accent hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-lg hover:shadow-blue-500/20"
                    >
                        {saving ? <StatusMessage loading /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            {/* BACKUP & RESTORE */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Archive className="text-yellow-400" size={20} /> Backup & Restore
                </h3>

                {backupStatus && (
                    <div className={`p-3 rounded-lg text-sm ${backupStatus.type === 'error' ? 'bg-red-900/30 text-red-200 border border-red-800' : 'bg-blue-900/30 text-blue-200 border border-blue-800'}`}>
                        {backupStatus.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Export */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-300">Export Parameters</h4>
                        <p className="text-xs text-gray-500">Download a full zip archive of your memories database and all photos.</p>
                        <button
                            onClick={handleDownloadBackup}
                            className="flex items-center gap-2 bg-os-hover hover:bg-os-accent text-white px-4 py-2 rounded-lg text-sm transition-colors border border-gray-600"
                        >
                            <Download size={16} /> Download Backup (.zip)
                        </button>
                    </div>

                    {/* Import */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-os-hover md:pl-8 pt-4 md:pt-0">
                        <h4 className="font-medium text-gray-300">Restore Backup</h4>
                        <p className="text-xs text-gray-500">Restore your memories from a previous zip file.</p>

                        <div className="p-4 rounded bg-red-900/10 border border-red-900/30">
                            <div className="flex items-start gap-2 text-yellow-500 mb-3">
                                <AlertTriangle size={16} className="mt-0.5" />
                                <span className="text-xs font-semibold">Warning: This will overwrite current data.</span>
                            </div>

                            <input
                                type="file"
                                accept=".zip"
                                onChange={e => setRestoreFile(e.target.files[0])}
                                className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-os-accent file:text-white hover:file:bg-blue-600 mb-3"
                            />

                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={confirmRestore}
                                    onChange={e => setConfirmRestore(e.target.checked)}
                                    className="accent-red-500"
                                />
                                I understand this will overwrite my data
                            </label>

                            <button
                                onClick={handleRestoreBackup}
                                disabled={!restoreFile || !confirmRestore || isRestoring}
                                className="mt-4 flex items-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-100 px-4 py-2 rounded-lg text-sm transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRestoring ? <StatusMessage loading /> : <Upload size={16} />}
                                {isRestoring ? 'Restoring...' : 'Restore Backup'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
