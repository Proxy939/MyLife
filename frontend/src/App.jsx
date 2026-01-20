import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Timeline from './pages/Timeline';
import AddMemory from './pages/AddMemory';
import MemoryDetail from './pages/MemoryDetail';
import Settings from './pages/Settings';
import RecapCard from './components/RecapCard';
import SemanticSearch from './pages/SemanticSearch';
import MemoryChat from './pages/MemoryChat';
import LockScreen from './pages/LockScreen';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';
import SystemStatus from './pages/SystemStatus';
import Notifications from './pages/Notifications';
import Updates from './pages/Updates';
import Plugins from './pages/Plugins';
import Journal from './pages/Journal';
import WeeklyReview from './pages/WeeklyReview';
import Import from './pages/Import';
import Cleanup from './pages/Cleanup';
import Trash from './pages/Trash';
import AuditLog from './pages/AuditLog';
import Coach from './pages/Coach';
import GoalsDashboard from './pages/GoalsDashboard';
import ReportsDashboard from './pages/ReportsDashboard';
import SyncPage from './pages/SyncPage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import TerminalLogin from './pages/TerminalLogin';
import VaultSetup from './pages/VaultSetup';
import VaultUnlock from './pages/VaultUnlock';
import VaultRecovery from './pages/VaultRecovery';
import { useState, useEffect } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import CommandPalette from './components/CommandPalette';
import { api } from './api/client';
import { Loader2 } from 'lucide-react';
import { getEnabledPlugins } from './plugins/registry';
import PluginLoader from './plugins/PluginLoader';

function ProtectedRoute({ children, isLocked }) {
    if (isLocked) {
        return <Navigate to="/lock" replace />;
    }
    return children;
}

function AppContent() {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        return localStorage.getItem('mylife_selected_month') || new Date().toISOString().slice(0, 7);
    });

    const [isLocked, setIsLocked] = useState(false);
    const [lockChecked, setLockChecked] = useState(false);

    // Vault state
    const [vaultStatus, setVaultStatus] = useState(null);
    const [vaultChecked, setVaultChecked] = useState(false);

    // Check vault status on mount
    useEffect(() => {
        const checkVault = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/vault/status');
                const data = await res.json();

                if (data.success) {
                    setVaultStatus(data.data);
                }
            } catch (err) {
                console.error('Failed to check vault status', err);
            } finally {
                setVaultChecked(true);
            }
        };

        checkVault();
    }, []);

    useEffect(() => {
        const enabled = localStorage.getItem('mylife_app_lock_enabled') === 'true';
        const sessionUnlocked = sessionStorage.getItem('mylife_session_unlocked');

        if (enabled && !sessionUnlocked) {
            setIsLocked(true);
        }
        setLockChecked(true);
    }, []);

    useEffect(() => {
        localStorage.setItem('mylife_selected_month', selectedMonth);
    }, [selectedMonth]);

    const handleUnlock = () => {
        sessionStorage.setItem('mylife_session_unlocked', 'true');
        setIsLocked(false);
    };

    // Wait for both checks
    if (!lockChecked || !vaultChecked) {
        return <LoadingSplash retryCount={0} />;
    }

    // Vault routing priority
    if (vaultStatus) {
        // Vault unavailable - show recovery
        if (vaultStatus.state === 'UNAVAILABLE') {
            return <VaultRecovery />;
        }

        // No vault - setup required
        if (!vaultStatus.vault_exists) {
            return (
                <Routes>
                    <Route path="*" element={<VaultSetup />} />
                </Routes>
            );
        }

        // Vault locked - unlock required
        if (!vaultStatus.is_unlocked && vaultStatus.state === 'LOCKED') {
            return (
                <Routes>
                    <Route path="*" element={<VaultUnlock />} />
                </Routes>
            );
        }
    }

    // Normal app flow
    return (
        <Routes>
            <Route path="/lock" element={
                isLocked ? <LockScreen onUnlock={handleUnlock} /> : <Navigate to="/" replace />
            } />

            <Route path="/*" element={
                <ProtectedRoute isLocked={isLocked}>
                    <Layout
                        onMonthChange={setSelectedMonth}
                        selectedMonth={selectedMonth}
                        rightPanel={<RecapCard month={selectedMonth} />}
                    >
                        <Routes>
                            <Route path="/" element={<Timeline month={selectedMonth} />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/insights" element={<Insights />} />
                            <Route path="/system" element={<SystemStatus />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/updates" element={<Updates />} />
                            <Route path="/add" element={<AddMemory />} />
                            <Route path="/memory/:id" element={<MemoryDetail />} />
                            <Route path="/search" element={<SemanticSearch />} />
                            <Route path="/chat" element={<MemoryChat />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/plugins" element={<Plugins />} />
                            <Route path="/coach" element={<Coach />} />
                            <Route path="/goals" element={<GoalsDashboard />} />
                            <Route path="/reports" element={<ReportsDashboard />} />
                            <Route path="/sync" element={<SyncPage />} />
                            <Route path="/diagnostics" element={<DiagnosticsPage />} />

                            {/* Dynamic Plugin Routes */}
                            {getEnabledPlugins().map(plugin => (
                                <Route
                                    key={plugin.id}
                                    path={plugin.routePath}
                                    element={<PluginLoader plugin={plugin} />}
                                />
                            ))}
                        </Routes>
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

function LoadingSplash({ retryCount }) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-os-bg text-white space-y-4 animate-in fade-in pb-20">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
                <Loader2 size={64} className="text-blue-400 animate-spin relative z-10" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
                Starting MyLife Engine...
            </h1>
            <p className="text-gray-500 text-sm">Organizing your digital brain ({retryCount}s)</p>
        </div>
    );
}

function App() {
    const [terminalUnlocked, setTerminalUnlocked] = useState(false);
    const [backendReady, setBackendReady] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const unlocked = sessionStorage.getItem('mylife_terminal_unlocked') === 'true';
        setTerminalUnlocked(unlocked);
    }, []);

    useEffect(() => {
        if (!terminalUnlocked) return;

        const checkHealth = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
                const res = await fetch(`${url}/health`, {
                    method: 'GET',
                    cache: 'no-cache'
                });

                if (res.ok) {
                    setBackendReady(true);
                    return;
                }
            } catch (e) {
                console.warn(`Health check failed (retry ${retry}):`, e.message);
            }

            setTimeout(() => {
                setRetry(r => r + 1);
            }, 1000);
        };

        checkHealth();
    }, [retry, terminalUnlocked]);

    const handleTerminalUnlock = () => {
        sessionStorage.setItem('mylife_terminal_unlocked', 'true');
        setTerminalUnlocked(true);
    };

    if (!terminalUnlocked) {
        return <TerminalLogin onUnlock={handleTerminalUnlock} />;
    }

    if (!backendReady) {
        return <LoadingSplash retryCount={retry} />;
    }

    return (
        <ThemeProvider>
            <NotificationProvider>
                <Router>
                    <AppContent />
                </Router>
            </NotificationProvider>
        </ThemeProvider>
    );
}

export default App;
