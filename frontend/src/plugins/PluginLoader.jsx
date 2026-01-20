import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class PluginErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Plugin failed to load:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-os-bg p-4">
                    <div className="max-w-md w-full bg-os-panel border border-red-500/30 rounded-2xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                            <AlertTriangle size={32} className="text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Plugin Failed to Load</h2>
                        <p className="text-gray-400 mb-4">
                            {this.props.pluginName || 'This plugin'} encountered an error and could not be loaded.
                        </p>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                            <code className="text-xs text-red-300 break-all">
                                {this.state.error?.message || 'Unknown error'}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.href = '/plugins'}
                            className="px-4 py-2 bg-os-hover hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Back to Plugins
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function PluginLoader({ plugin }) {
    const PluginComponent = plugin.component;

    return (
        <PluginErrorBoundary pluginName={plugin.name}>
            <PluginComponent />
        </PluginErrorBoundary>
    );
}
