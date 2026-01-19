import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('❌ React Error Boundary Caught:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-os-bg text-white p-8">
                    <div className="max-w-md w-full bg-os-panel border border-red-900/30 rounded-lg p-6 space-y-4">
                        <div className="flex items-center space-x-3 text-red-400">
                            <AlertCircle size={32} />
                            <h1 className="text-xl font-bold">Application Error</h1>
                        </div>

                        <p className="text-gray-300">
                            Something went wrong. The app encountered an unexpected error.
                        </p>

                        {this.state.error && (
                            <div className="bg-black/50 p-3 rounded text-xs text-red-300 font-mono overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                        >
                            <RefreshCw size={16} />
                            <span>Reload Application</span>
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Check the browser console (F12) for more details
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
