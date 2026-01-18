import React from 'react';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

export default function StatusMessage({ loading, error, onRetry, loadingText = "Loading..." }) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                <Loader2 className="animate-spin mb-2 text-os-accent" size={32} />
                <span className="text-sm">{loadingText}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-red-900/10 border border-red-900/30 rounded-xl text-center">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertCircle size={20} />
                    <h3 className="font-semibold">Something went wrong</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4 max-w-md">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-os-hover hover:bg-os-accent text-white rounded-lg transition-colors text-sm"
                    >
                        <RefreshCw size={14} /> Retry
                    </button>
                )}
            </div>
        );
    }

    return null;
}
