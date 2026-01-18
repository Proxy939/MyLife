import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Timeline from './pages/Timeline';
import AddMemory from './pages/AddMemory';
import MemoryDetail from './pages/MemoryDetail';
import Settings from './pages/Settings';
import RecapCard from './components/RecapCard';

function AppLayout() {
    // Persistence for Month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        return localStorage.getItem('mylife_month') || currentMonth;
    });

    useEffect(() => {
        localStorage.setItem('mylife_month', selectedMonth);
    }, [selectedMonth]);

    return (
        <Layout
            onMonthChange={setSelectedMonth}
            selectedMonth={selectedMonth}
            rightPanel={<RecapCard month={selectedMonth} />}
        >
            <Outlet context={{ selectedMonth }} />
        </Layout>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Timeline />} />
                    <Route path="/add" element={<AddMemory />} />
                    <Route path="/memory/:id" element={<MemoryDetail />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
