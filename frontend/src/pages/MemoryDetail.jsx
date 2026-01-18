import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { ArrowLeft, Calendar, Tag, Upload, Image as ImageIcon } from 'lucide-react';

export default function MemoryDetail() {
    const { id } = useParams();
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchMemory() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get(`/memories/${id}`);
            setMemory(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMemory();
    }, [id]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));

            const uploadRes = await api.post('/media/upload', formData);
            const paths = uploadRes.paths;

            await api.post(`/memories/${id}/photos`, { paths });

            // Gentle refresh without full loading state
            const refreshed = await api.get(`/memories/${id}`);
            setMemory(refreshed);
        } catch (err) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <StatusMessage loading loadingText="Loading memory..." />;
    if (error) return <StatusMessage error={error} onRetry={fetchMemory} />;
    if (!memory) return <StatusMessage error="Memory not found" />;

    return (
        <div>
            <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 w-fit transition-colors">
                <ArrowLeft size={16} /> Back to Timeline
            </Link>

            <div className="bg-os-panel border border-os-hover rounded-xl p-8">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{memory.title}</h1>
                    <span className={`text-sm px-3 py-1 rounded-full border capitalize ${getMoodBadge(memory.mood)}`}>
                        {memory.mood}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-gray-400 text-sm mb-8 border-b border-os-hover pb-6">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-os-accent" />
                        {new Date(memory.created_at).toLocaleString()}
                    </div>
                    {memory.tags && (
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-os-accent" />
                            <span className="bg-os-hover px-2 py-0.5 rounded text-gray-300">{memory.tags}</span>
                        </div>
                    )}
                </div>

                <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap mb-10 font-light">
                    {memory.note}
                </p>

                {/* Photos Section */}
                <div className="pt-2">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-purple-400" /> Photos
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {memory.photos && memory.photos.map((path, i) => (
                            <div key={i} className="aspect-square bg-black rounded-lg overflow-hidden border border-os-hover group relative">
                                <img
                                    src={`http://127.0.0.1:8000/${path}`}
                                    alt="Memory"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                        ))}
                        {(!memory.photos || memory.photos.length === 0) && (
                            <div className="col-span-full py-8 text-center bg-os-hover/30 rounded-lg border border-dashed border-os-hover text-gray-500 italic text-sm">
                                No photos attached yet.
                            </div>
                        )}
                    </div>

                    <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-os-accent hover:bg-blue-600 text-white cursor-pointer transition-all shadow-lg hover:shadow-blue-500/20 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? <StatusMessage loading /> : <Upload size={18} />}
                        {uploading ? 'Uploading...' : 'Upload Photos'}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        </div>
    );
}

function getMoodBadge(mood) {
    switch (mood) {
        case 'happy': return 'bg-green-900/30 text-green-300 border-green-500/30';
        case 'excited': return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
        case 'sad': return 'bg-blue-900/30 text-blue-300 border-blue-500/30';
        case 'stressed': return 'bg-red-900/30 text-red-300 border-red-500/30';
        case 'calm': return 'bg-teal-900/30 text-teal-300 border-teal-500/30';
        default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
}
