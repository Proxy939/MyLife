import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            showToast: () => { },
            success: () => { },
            error: () => { },
            info: () => { },
            warning: () => { }
        };
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const success = useCallback((message) => showToast(message, 'success'), [showToast]);
    const error = useCallback((message) => showToast(message, 'error', 5000), [showToast]);
    const info = useCallback((message) => showToast(message, 'info'), [showToast]);
    const warning = useCallback((message) => showToast(message, 'warning'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts }) {
    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} />;
            case 'error': return <XCircle size={18} />;
            case 'warning': return <AlertCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    const getColors = (type) => {
        switch (type) {
            case 'success': return 'bg-green-500/10 border-green-500/30 text-green-300';
            case 'error': return 'bg-red-500/10 border-red-500/30 text-red-300';
            case 'warning': return 'bg-orange-500/10 border-orange-500/30 text-orange-300';
            default: return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`border rounded-xl p-4 shadow-lg backdrop-blur-sm animate-slide-up flex items-center gap-3 min-w-[300px] ${getColors(toast.type)}`}
                >
                    {getIcon(toast.type)}
                    <span className="text-sm">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
