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
import TerminalLogin from './pages/TerminalLogin';
import { useState, useEffect } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './api/client';
import { Loader2 } from 'lucide-react';

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

    if (!lockChecked) return null;

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
    const [terminalUnlocked, setTerminalUnlocked] = useState(() => {
        return sessionStorage.getItem('mylife_terminal_unlocked') === 'true';
    });
    const [backendReady, setBackendReady] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        if (!terminalUnlocked) return;

        console.log('🔍 Starting backend health check...');

        // Health Check Loop
        const checkHealth = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
                console.log(`📡 Checking health: ${url}/health`);

                const res = await fetch(`${url}/health`, {
                    method: 'GET',
                    cache: 'no-cache'
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log('✅ Backend is ready:', data);
                    setBackendReady(true);
                    return;
                } else {
                    console.warn(`⚠️ Health check failed with status: ${res.status}`);
                }
            } catch (e) {
                console.warn(`❌ Health check error (retry ${retry}):`, e.message);
            }

            // Retry after 1 second
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

    // Show terminal login first
    if (!terminalUnlocked) {
        return <TerminalLogin onUnlock={handleTerminalUnlock} />;
    }

    // Then check backend
    if (!backendReady) {
        return <LoadingSplash retryCount={retry} />;
    }

    return (
        <ThemeProvider>
            <Router>
                <NotificationProvider>
                    <AppContent />
                </NotificationProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;
