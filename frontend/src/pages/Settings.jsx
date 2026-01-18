import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Cpu, Server, Save } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        ai_provider: 'auto',
        local_model: 'none',
        openai_enabled: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const data = await api.get('/settings/ai');
                setSettings(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put('/settings/ai', settings);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Cpu className="text-blue-400" />
                AI Configuration
            </h2>

            {message && (
                <div className={`p-3 rounded mb-6 ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-6">

                {/* Provider Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">AI Provider</label>
                    <div className="grid grid-cols-1 gap-3">
                        {['auto', 'local', 'openai'].map(mode => (
                            <label key={mode} className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${settings.ai_provider === mode ? 'border-os-accent bg-blue-900/20' : 'border-os-hover hover:border-gray-500'}`}>
                                <input
                                    type="radio"
                                    name="provider"
                                    className="mr-3"
                                    checked={settings.ai_provider === mode}
                                    onChange={() => setSettings({ ...settings, ai_provider: mode })}
                                />
                                <div>
                                    <div className="font-semibold text-white capitalize">{mode} Mode</div>
                                    <div className="text-xs text-gray-400">
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
                    <div className="pl-6 border-l-2 border-os-hover">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Local Model</label>
                        <select
                            className="w-full bg-os-bg border border-os-hover rounded p-2 text-white focus:border-os-accent outline-none"
                            value={settings.local_model}
                            onChange={e => setSettings({ ...settings, local_model: e.target.value })}
                        >
                            <option value="none">Select a model...</option>
                            <option value="phi3">Phi-3 Mini (3.8GB)</option>
                            <option value="mistral">Mistral 7B (4.1GB)</option>
                            <option value="llama3">Llama 3.1 8B (4.7GB)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Make sure Ollama is running.</p>
                    </div>
                )}

                {/* OpenAI Toggle */}
                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="checkbox"
                        id="openai_toggle"
                        checked={settings.openai_enabled}
                        onChange={e => setSettings({ ...settings, openai_enabled: e.target.checked })}
                    />
                    <label htmlFor="openai_toggle" className="text-gray-300">Enable OpenAI Features (requires key in backend env)</label>
                </div>

                <div className="pt-4 border-t border-os-hover">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-os-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>

            </div>
        </div>
    );
}
