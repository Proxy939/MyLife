import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { useState, useEffect } from 'react';

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

    // Lock State
    const [isLocked, setIsLocked] = useState(false);
    const [lockChecked, setLockChecked] = useState(false);

    useEffect(() => {
        // Init Lock
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

    if (!lockChecked) return null; // Prevent flash

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

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
