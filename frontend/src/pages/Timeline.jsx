import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import MemoryCard from '../components/MemoryCard';
import { useOutletContext } from 'react-router-dom';

export default function Timeline() {
    const { selectedMonth } = useOutletContext();
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMemories() {
            setLoading(true);
            try {
                const data = await api.get(`/memories/?month=${selectedMonth}`);
                setMemories(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadMemories();
    }, [selectedMonth]);

    if (loading) return <div className="text-center py-10 text-gray-500">Loading timeline...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Timeline ({selectedMonth})</h2>
            {memories.length === 0 ? (
                <div className="text-gray-500 italic">No memories found for this month.</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {memories.map(m => <MemoryCard key={m.id} memory={m} />)}
                </div>
            )}
        </div>
    );
}
