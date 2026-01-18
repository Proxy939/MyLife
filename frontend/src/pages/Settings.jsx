import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { Cpu, Server, Save } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        ai_provider: 'auto',
        local_model: 'none',
        openai_enabled: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', text: '' }

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

    if (loading) return <StatusMessage loading loadingText="Loading configuration..." />;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Cpu className="text-blue-400" />
                AI Configuration
            </h2>

            {status && status.type === 'error' && <StatusMessage error={status.text} onRetry={fetchSettings} />}

            {status && status.type === 'success' && (
                <div className="bg-green-900/30 border border-green-500/50 text-green-200 p-3 rounded-lg mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    {status.text}
                </div>
            )}

            <div className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-6">

                {/* Provider Selection */}
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

                {/* Local Model Dropdown (Only if Local) */}
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

                {/* OpenAI Toggle */}
                <div className="flex items-center gap-3 pt-2">
                    <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                        <input
                            type="checkbox"
                            name="toggle"
                            id="openai_toggle"
                            className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1 checked:translate-x-5 transition-transform"
                            checked={settings.openai_enabled}
                            onChange={e => setSettings({ ...settings, openai_enabled: e.target.checked })}
                        />
                        <label htmlFor="openai_toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer border border-os-hover ${settings.openai_enabled ? 'bg-os-accent' : 'bg-os-bg'}`}></label>
                    </div>
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
        </div>
    );
}
