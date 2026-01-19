import { useState } from 'react';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';
import { getVersion } from '@tauri-apps/api/app';
import { Check, Download, AlertCircle, RefreshCw } from 'lucide-react';

export default function Updates() {
    const [currentVersion, setCurrentVersion] = useState('');
    const [checking, setChecking] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useState(() => {
        getVersion().then(setCurrentVersion);
    }, []);

    const handleCheckUpdate = async () => {
        setChecking(true);
        setError('');
        setSuccess('');
        setUpdateAvailable(false);

        try {
            const { shouldUpdate, manifest } = await checkUpdate();

            if (shouldUpdate) {
                setUpdateAvailable(true);
                setUpdateInfo(manifest);
                setSuccess(`Update available: v${manifest.version}`);
            } else {
                setSuccess('You are running the latest version!');
            }
        } catch (err) {
            setError(`Failed to check for updates: ${err.message || err}`);
        } finally {
            setChecking(false);
        }
    };

    const handleInstallUpdate = async () => {
        setDownloading(true);
        setError('');

        try {
            await installUpdate();
            setSuccess('Update installed! Restarting app...');

            // Relaunch after a brief delay
            setTimeout(() => {
                relaunch();
            }, 2000);
        } catch (err) {
            setError(`Failed to install update: ${err.message || err}`);
            setDownloading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Updates
                </h1>
                <p className="text-gray-400">Keep MyLife up to date with the latest features and improvements</p>
            </div>

            {/* Current Version Card */}
            <div className="bg-os-panel border border-os-hover rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-1">Current Version</h2>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                            v{currentVersion || 'Loading...'}
                        </p>
                    </div>
                    <div className="bg-green-500/20 border border-green-500/30 rounded-full p-4">
                        <Check size={32} className="text-green-400" />
                    </div>
                </div>
            </div>

            {/* Check for Updates */}
            <div className="bg-os-panel border border-os-hover rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Check for Updates</h2>

                <button
                    onClick={handleCheckUpdate}
                    disabled={checking || downloading}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {checking ? (
                        <>
                            <RefreshCw size={20} className="animate-spin" />
                            Checking...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={20} />
                            Check for Updates
                        </>
                    )}
                </button>

                {/* Success Message */}
                {success && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                        <Check size={20} className="text-green-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-green-300 font-medium">{success}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-300 font-medium">{error}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Update Available Card */}
            {updateAvailable && updateInfo && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-full p-3">
                            <Download size={24} className="text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">
                                New Update Available!
                            </h3>
                            <p className="text-gray-300">
                                Version <span className="font-semibold text-blue-400">v{updateInfo.version}</span> is ready to install
                            </p>
                        </div>
                    </div>

                    {updateInfo.body && (
                        <div className="mb-6 p-4 bg-os-bg/50 rounded-xl">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">What's New</h4>
                            <div className="text-sm text-gray-400 whitespace-pre-wrap">
                                {updateInfo.body}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleInstallUpdate}
                        disabled={downloading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {downloading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin" />
                                Installing Update...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Download & Install
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-3">
                        The app will restart automatically after installation
                    </p>
                </div>
            )}

            {/* Info */}
            <div className="mt-8 p-6 bg-os-bg/30 border border-os-hover/30 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">About Updates</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        Updates are downloaded securely from GitHub Releases
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        All updates are cryptographically signed for security
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        Your data and settings are preserved during updates
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        Updates include new features, bug fixes, and performance improvements
                    </li>
                </ul>
            </div>
        </div>
    );
}
