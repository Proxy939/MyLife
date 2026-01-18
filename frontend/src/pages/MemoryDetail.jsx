import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ArrowLeft, Calendar, Tag, Upload, Image as ImageIcon } from 'lucide-react';

export default function MemoryDetail() {
    const { id } = useParams();
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchMemory() {
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
            // 1. Upload
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));

            const uploadRes = await api.post('/media/upload', formData);
            const paths = uploadRes.paths;

            // 2. Attach
            await api.post(`/memories/${id}/photos`, { paths });

            // Refresh
            await fetchMemory();
        } catch (err) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!memory) return <div>Error: {error || "Not found"}</div>;

    return (
        <div>
            <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft size={16} /> Back to Timeline
            </Link>

            <div className="bg-os-panel border border-os-hover rounded-xl p-8">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold text-white">{memory.title}</h1>
                    <span className="text-sm px-3 py-1 rounded-full bg-os-hover capitalize text-blue-400">
                        {memory.mood}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-gray-400 text-sm mb-8">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(memory.created_at).toLocaleString()}
                    </div>
                    {memory.tags && (
                        <div className="flex items-center gap-2">
                            <Tag size={16} />
                            {memory.tags}
                        </div>
                    )}
                </div>

                <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap mb-10">
                    {memory.note}
                </p>

                {/* Photos Section */}
                <div className="border-t border-os-hover pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ImageIcon size={20} /> Photos
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {memory.photos && memory.photos.map((path, i) => (
                            <div key={i} className="aspect-square bg-black rounded-lg overflow-hidden border border-os-hover">
                                <img
                                    src={`http://127.0.0.1:8000/${path}`}
                                    alt="Memory"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                        {(!memory.photos || memory.photos.length === 0) && (
                            <div className="col-span-full text-gray-500 italic text-sm">No photos attached yet.</div>
                        )}
                    </div>

                    <label className={`inline-flex items-center gap-2 px-4 py-2 rounded bg-os-hover hover:bg-os-accent text-white cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={16} />
                        {uploading ? 'Uploading...' : 'Upload Photos'}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        </div>
    );
}
