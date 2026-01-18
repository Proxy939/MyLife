import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { Cpu, Server, Save, Download, Upload, AlertTriangle, Archive, Shield, Lock, Key } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

// Basic Hash Helper (Duplicate of LockScreen logic - ideally util)
const hashPin = (pin) => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
};

export default function Settings() {
    const { addNotification } = useNotifications();
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
    const [encryptBackup, setEncryptBackup] = useState(false);
    const [backupPin, setBackupPin] = useState('');
    const [restorePin, setRestorePin] = useState('');

    // Security State
    const [appLockEnabled, setAppLockEnabled] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinMode, setPinMode] = useState('set'); // 'set' or 'change'

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
        const storedLock = localStorage.getItem('mylife_app_lock_enabled') === 'true';
        setAppLockEnabled(storedLock);
        setPinMode(localStorage.getItem('mylife_app_pin_hash') ? 'change' : 'set');
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await api.put('/settings/ai', settings);
            setStatus({ type: 'success', text: 'Settings saved successfully!' });
            addNotification('AI Settings updated successfully.', 'success');
        } catch (err) {
            setStatus({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    // --- Security Handlers ---
    const handleSetPin = () => {
        if (pinInput.length < 4) {
            setStatus({ type: 'error', text: "PIN must be at least 4 digits" });
            return;
        }
        const hash = hashPin(pinInput);
        localStorage.setItem('mylife_app_pin_hash', hash);
        localStorage.setItem('mylife_app_lock_enabled', 'true');
        setAppLockEnabled(true);
        setPinMode('change');
        setPinInput('');
        setStatus({ type: 'success', text: "App Lock Initiated. PIN Set." });
        addNotification('App Lock PIN Updated.', 'info');
    };

    const handleToggleLock = (e) => {
        const enabled = e.target.checked;
        if (enabled && pinMode === 'set') {
            setStatus({ type: 'error', text: "Please set a PIN below first." });
            return;
        }
        setAppLockEnabled(enabled);
        localStorage.setItem('mylife_app_lock_enabled', enabled);
        addNotification(`App Lock ${enabled ? 'Enabled' : 'Disabled'}.`, 'info');
    };


    // --- Backup Handlers ---

    const handleDownloadBackup = async () => {
        setBackupStatus({ type: 'info', text: 'Preparing backup download...' });
        try {
            let endpoint = '/backup/export';
            if (encryptBackup) {
                if (!backupPin || backupPin.length < 4) {
                    setBackupStatus({ type: 'error', text: "Please enter a PIN (min 4 chars) for encryption." });
                    return;
                }
                endpoint += `?pin=${encodeURIComponent(backupPin)}`;
            }

            const blob = await api.download(endpoint);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            const ext = encryptBackup ? 'encrypted' : 'zip';
            a.download = `MyLife-backup-${date}.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setBackupStatus(null);
            addNotification(`Backup downloaded successfully (${ext}).`, 'success');
        } catch (err) {
            setBackupStatus({ type: 'error', text: "Backup failed: " + err.message });
            addNotification('Backup download failed.', 'error');
        }
    };

    const handleRestoreBackup = async () => {
        if (!restoreFile || !confirmRestore) return;

        setIsRestoring(true);
        setBackupStatus({ type: 'info', text: 'Uploading and restoring backup...' });

        const formData = new FormData();
        formData.append('file', restoreFile);
        if (restorePin) {
            formData.append('pin', restorePin);
        }

        try {
            await api.post('/backup/restore', formData);
            setBackupStatus({ type: 'success', text: 'Restore successful! Please refresh the page.' });
            addNotification('System Restore completed successfully.', 'success');
            setRestoreFile(null);
            setConfirmRestore(false);
            setRestorePin('');
        } catch (err) {
            setBackupStatus({ type: 'error', text: "Restore failed: " + err.message });
            addNotification(`Restore failed: ${err.message}`, 'error');
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

            {status && status.type === 'error' && <StatusMessage error={status.text} onRetry={() => setStatus(null)} />}
            {status && status.type === 'success' && (
                <div className="bg-green-900/30 border border-green-500/50 text-green-200 p-3 rounded-lg mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    {status.text}
                </div>
            )}

            {/* SECURITY */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-6 mb-8">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="text-purple-400" size={20} /> App Security
                </h3>

                <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Enable App Lock (Require PIN on start)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={appLockEnabled} onChange={handleToggleLock} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                <div className="flex items-end gap-4 p-4 bg-os-bg rounded-lg border border-os-hover">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            {pinMode === 'set' ? 'Set New PIN' : 'Change PIN'}
                        </label>
                        <div className="flex items-center gap-2">
                            <Key size={16} className="text-gray-500" />
                            <input
                                type="password"
                                value={pinInput}
                                onChange={e => setPinInput(e.target.value)}
                                placeholder="Enter 4-6 digits"
                                className="bg-transparent outline-none text-white w-full"
                                maxLength={6}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSetPin}
                        disabled={!pinInput}
                        className="text-xs bg-os-hover hover:bg-os-accent text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                    >
                        {pinMode === 'set' ? 'Set PIN' : 'Update'}
                    </button>
                </div>
            </div>


            {/* AI SETTINGS */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-6 mb-8">
                <h3 className="text-lg font-semibold text-white">AI Settings</h3>

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
                                <div className="capitalize font-medium text-white">{mode} Mode</div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-os-hover">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-os-accent hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-lg"
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
                        <h4 className="font-medium text-gray-300">Export</h4>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={encryptBackup}
                                    onChange={e => setEncryptBackup(e.target.checked)}
                                    className="accent-os-accent"
                                />
                                <Lock size={14} /> Encrypt backup with PIN
                            </label>

                            {encryptBackup && (
                                <input
                                    type="password"
                                    value={backupPin}
                                    onChange={e => setBackupPin(e.target.value)}
                                    placeholder="Enter Encryption PIN"
                                    className="w-full bg-os-bg border border-os-hover rounded p-2 text-sm text-white focus:border-os-accent outline-none"
                                />
                            )}

                            <button
                                onClick={handleDownloadBackup}
                                className="flex items-center gap-2 bg-os-hover hover:bg-os-accent text-white px-4 py-2 rounded-lg text-sm transition-colors border border-gray-600 w-full justify-center"
                            >
                                <Download size={16} /> Download Backup
                            </button>
                        </div>
                    </div>

                    {/* Import */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-os-hover md:pl-8 pt-4 md:pt-0">
                        <h4 className="font-medium text-gray-300">Restore</h4>

                        <div className="p-4 rounded bg-red-900/10 border border-red-900/30 space-y-3">
                            <input
                                type="file"
                                accept=".zip,.encrypted"
                                onChange={e => setRestoreFile(e.target.files[0])}
                                className="block w-full text-xs text-gray-400"
                            />

                            {restoreFile && restoreFile.name.endsWith('.encrypted') && (
                                <input
                                    type="password"
                                    value={restorePin}
                                    onChange={e => setRestorePin(e.target.value)}
                                    placeholder="Enter Encryption PIN"
                                    className="w-full bg-os-bg border border-red-900/50 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                                />
                            )}

                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={confirmRestore}
                                    onChange={e => setConfirmRestore(e.target.checked)}
                                    className="accent-red-500"
                                />
                                Overwrite current data
                            </label>

                            <button
                                onClick={handleRestoreBackup}
                                disabled={!restoreFile || !confirmRestore || isRestoring}
                                className="flex items-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-100 px-4 py-2 rounded-lg text-sm transition-colors w-full justify-center disabled:opacity-50"
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
