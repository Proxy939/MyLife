import { useState } from 'react';
import { Puzzle, CheckSquare, Target, StickyNote } from 'lucide-react';
import { PLUGINS, togglePlugin, isPluginEnabled } from '../plugins/registry';

export default function Plugins() {
    const [enabledPlugins, setEnabledPlugins] = useState(
        PLUGINS.reduce((acc, p) => ({ ...acc, [p.id]: isPluginEnabled(p.id) }), {})
    );

    const handleToggle = (pluginId) => {
        togglePlugin(pluginId);
        setEnabledPlugins(prev => ({ ...prev, [pluginId]: !prev[pluginId] }));

        // Reload to update sidebar
        setTimeout(() => {
            window.location.reload();
        }, 300);
    };

    const iconMap = {
        CheckSquare,
        Target,
        StickyNote
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Puzzle size={28} className="text-cyan-400" />
                    <h1 className="text-3xl font-bold text-white">Plugins</h1>
                </div>
                <p className="text-gray-400">Enable or disable feature modules</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">{PLUGINS.length}</div>
                    <div className="text-sm text-gray-400">Total Plugins</div>
                </div>
                <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">
                        {Object.values(enabledPlugins).filter(Boolean).length}
                    </div>
                    <div className="text-sm text-gray-400">Enabled</div>
                </div>
            </div>

            {/* Plugins List */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Available Plugins</h2>

                {PLUGINS.map(plugin => {
                    const IconComponent = iconMap[plugin.icon] || Puzzle;
                    const enabled = enabledPlugins[plugin.id];

                    return (
                        <div
                            key={plugin.id}
                            className={`bg-os-panel border rounded-xl p-4 transition-all ${enabled
                                    ? 'border-blue-500/50 bg-blue-500/5'
                                    : 'border-os-hover'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${enabled ? 'bg-blue-500/20' : 'bg-os-bg'
                                    }`}>
                                    <IconComponent
                                        size={24}
                                        className={enabled ? 'text-blue-400' : 'text-gray-500'}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {plugin.name}
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                        {plugin.description}
                                    </p>
                                    {enabled && (
                                        <div className="text-xs text-blue-400">
                                            Route: {plugin.routePath}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleToggle(plugin.id)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300">
                    <strong>Note:</strong> Enabling or disabling plugins will reload the app to update the sidebar navigation.
                </p>
            </div>
        </div>
    );
}
