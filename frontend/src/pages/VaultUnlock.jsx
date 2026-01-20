import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Unlock, AlertCircle, RefreshCw } from 'lucide-react';

export default function VaultUnlock() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUnlock = async () => {
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://127.0.0.1:8000/vault/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error?.message || 'Failed to unlock vault');
                setLoading(false);
                return;
            }

            // Success - reload to main app
            window.location.href = '/';

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
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 animate-pulse">
                        <Unlock size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Unlock Vault</h1>
                    <p className="text-gray-400">Enter your PIN to access your memories</p>
                </div>

                {/* Form Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-6">
                        {/* PIN Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                PIN
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white text-lg tracking-widest focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="••••••"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2 text-red-300 text-sm">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleUnlock}
                            disabled={loading || !pin}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" />
                                    Unlocking...
                                </>
                            ) : (
                                <>
                                    <Unlock size={20} />
                                    Unlock Vault
                                </>
                            )}
                        </button>

                        {/* Help */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500">
                                Forgot your PIN? Contact support for recovery options.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
