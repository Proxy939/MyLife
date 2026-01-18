import React, { useState } from 'react';
import { Lock, Unlock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Simple hash for local pin (Not crypto-grade, but sufficient for client-side lock)
// In real app, consider bcrypt-js or better
const hashPin = (pin) => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
};

export default function LockScreen({ onUnlock }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const handleUnlock = () => {
        const storedHash = localStorage.getItem('mylife_app_pin_hash');

        if (!storedHash) {
            // Should not happen if lock is enabled, but fail safe
            onUnlock();
            return;
        }

        if (hashPin(pin) === storedHash) {
            onUnlock();
        } else {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleUnlock();
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-os-bg text-white p-4">
            <div className="w-full max-w-xs text-center space-y-8">
                <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Lock size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">MyLife Locked</h1>
                    <p className="text-gray-400 text-sm">Enter you PIN to access your memories</p>
                </div>

                <div className="relative">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        onKeyDown={handleKeyPress}
                        maxLength={6}
                        placeholder="Enter PIN"
                        className={`w-full bg-os-panel border ${error ? 'border-red-500 animate-shake' : 'border-os-hover'} rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest outline-none focus:border-os-accent transition-all placeholder:text-gray-700 placeholder:text-sm placeholder:tracking-normal placeholder:font-normal`}
                        autoFocus
                    />
                </div>

                <button
                    onClick={handleUnlock}
                    className="w-full bg-os-accent hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <Unlock size={18} /> Unlock App
                </button>
            </div>
        </div>
    );
}
