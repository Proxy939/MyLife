import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Key } from 'lucide-react';

export default function VaultSetup() {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSetup = async () => {
        setError('');

        if (pin.length < 4) {
            setError('PIN must be at least 4 characters');
            return;
        }

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        setLoading(true);

        try {
            // Setup vault
            const setupRes = await fetch('http://127.0.0.1:8000/vault/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            const setupData = await setupRes.json();

            if (!setupData.success) {
                setError(setupData.error?.message || 'Failed to create vault');
                setLoading(false);
                return;
            }

            // Unlock vault
            const unlockRes = await fetch('http://127.0.0.1:8000/vault/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            const unlockData = await unlockRes.json();

            if (!unlockData.success) {
                setError(unlockData.error?.message || 'Failed to unlock vault');
                setLoading(false);
                return;
            }

            // Success - go to main app
            navigate('/');
            window.location.reload();

        } catch (err) {
            setError('Network error - is backend running?');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                        <Lock size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Your Vault</h1>
                    <p className="text-gray-400">Secure your memories with a PIN</p>
                </div>

                {/* Form Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-6">
                        {/* PIN Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Create PIN
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter PIN (min 4 characters)"
                                disabled={loading}
                            />
                        </div>

                        {/* Confirm PIN Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm PIN
                            </label>
                            <input
                                type="password"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSetup()}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Confirm your PIN"
                                disabled={loading}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSetup}
                            disabled={loading || !pin || !confirmPin}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>Creating Vault...</>
                            ) : (
                                <>
                                    <Key size={20} />
                                    Create Vault
                                </>
                            )}
                        </button>

                        {/* Info */}
                        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-xs text-blue-300">
                                <strong>Important:</strong> Your PIN encrypts all your data. Make sure to remember it - there is no recovery without your PIN.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
