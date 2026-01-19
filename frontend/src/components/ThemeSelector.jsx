import { useState } from 'react';
import { Palette, X, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
    const { currentTheme, setCurrentTheme, themes, customTheme, setCustomTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [customColors, setCustomColors] = useState(customTheme || {
        name: 'Custom',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        bg: '#0f172a',
        panel: '#1e293b',
        hover: '#334155',
        text: '#f1f5f9',
    });

    const handleThemeChange = (themeKey) => {
        setCurrentTheme(themeKey);
        setIsOpen(false);
    };

    const handleSaveCustom = () => {
        setCustomTheme(customColors);
        setCurrentTheme('custom');
        setShowCustomizer(false);
        setIsOpen(false);
    };

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg bg-os-hover hover:bg-os-accent transition-all group relative overflow-hidden"
                    title="Change Theme"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <Palette size={20} className="relative z-10 group-hover:rotate-12 transition-transform" />
                </button>

                {isOpen && (
                    <div className="absolute top-12 left-0 w-72 bg-os-panel border border-os-hover rounded-2xl shadow-2xl shadow-black/50 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Palette size={16} />
                                Choose Theme
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {Object.entries(themes).map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => handleThemeChange(key)}
                                    className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${currentTheme === key
                                            ? 'border-white shadow-lg'
                                            : 'border-transparent hover:border-gray-600'
                                        }`}
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                                    }}
                                >
                                    <div className="text-white text-xs font-bold mb-1">{theme.name}</div>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-full" style={{ background: theme.primary }}></div>
                                        <div className="w-3 h-3 rounded-full" style={{ background: theme.secondary }}></div>
                                        <div className="w-3 h-3 rounded-full" style={{ background: theme.accent }}></div>
                                    </div>
                                    {currentTheme === key && (
                                        <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                                            <Check size={12} className="text-black" />
                                        </div>
                                    )}
                                </button>
                            ))}

                            {/* Custom Theme */}
                            <button
                                onClick={() => {
                                    if (currentTheme === 'custom') {
                                        setCustomColors(customTheme);
                                    }
                                    setShowCustomizer(true);
                                }}
                                className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${currentTheme === 'custom'
                                        ? 'border-white shadow-lg'
                                        : 'border-dashed border-gray-600 hover:border-gray-400'
                                    }`}
                                style={{
                                    background: currentTheme === 'custom' && customTheme
                                        ? `linear-gradient(135deg, ${customTheme.primary}, ${customTheme.secondary})`
                                        : 'linear-gradient(135deg, #374151, #4b5563)'
                                }}
                            >
                                <div className="text-white text-xs font-bold mb-1">
                                    {currentTheme === 'custom' ? 'Custom' : '+ Create'}
                                </div>
                                <Palette size={16} className="text-white opacity-80" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Theme Editor */}
            {showCustomizer && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in">
                    <div className="bg-os-panel border border-os-hover rounded-3xl p-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Create Your Theme
                            </h2>
                            <button
                                onClick={() => setShowCustomizer(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(customColors).map(([key, value]) => {
                                if (key === 'name') return null;
                                return (
                                    <div key={key}>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="color"
                                                value={value}
                                                onChange={(e) => setCustomColors({
                                                    ...customColors,
                                                    [key]: e.target.value
                                                })}
                                                className="w-16 h-10 rounded-lg border-2 border-os-hover cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => setCustomColors({
                                                    ...customColors,
                                                    [key]: e.target.value
                                                })}
                                                className="flex-1 bg-os-bg border border-os-hover rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowCustomizer(false)}
                                className="flex-1 py-3 rounded-xl border border-os-hover text-gray-300 hover:bg-os-hover transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCustom}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all shadow-lg shadow-blue-500/25"
                            >
                                Apply Theme
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
