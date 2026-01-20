import { useState, useEffect } from 'react';
import { Upload, FolderOpen, FileText, MessageSquare, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Import() {
    const [folderPath, setFolderPath] = useState('');
    const [whatsappFile, setWhatsappFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [loading, setLoading] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/import/jobs');
            const data = await res.json();
            if (data.success) {
                setJobs(data.data);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
        }
    };

    const handlePhotosImport = async () => {
        if (!folderPath.trim()) {
            setError('Please enter a folder path');
            return;
        }

        setLoading({ photos: true });
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://127.0.0.1:8000/import/photos-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder_path: folderPath })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(`Imported ${data.data.imported} photos! (Skipped: ${data.data.skipped}, Failed: ${data.data.failed})`);
                setFolderPath('');
                fetchJobs();
            } else {
                if (res.status === 401) {
                    setError('Vault is locked. Please unlock to import data.');
                } else {
                    setError(data.error?.message || 'Import failed');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setLoading({});
        }
    };

    const handleWhatsAppImport = async () => {
        if (!whatsappFile) {
            setError('Please select a WhatsApp export file');
            return;
        }

        setLoading({ whatsapp: true });
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('file', whatsappFile);

            const res = await fetch('http://127.0.0.1:8000/import/whatsapp', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(`Imported ${data.data.imported} daily summaries from WhatsApp!`);
                setWhatsappFile(null);
                fetchJobs();
            } else {
                if (res.status === 401) {
                    setError('Vault is locked. Please unlock to import data.');
                } else {
                    setError(data.error?.message || 'Import failed');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setLoading({});
        }
    };

    const handlePDFImport = async () => {
        if (!pdfFile) {
            setError('Please select a PDF file');
            return;
        }

        setLoading({ pdf: true });
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('file', pdfFile);

            const res = await fetch('http://127.0.0.1:8000/import/pdf', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(`Imported PDF: ${data.data.filename}`);
                setPdfFile(null);
                fetchJobs();
            } else {
                if (res.status === 401) {
                    setError('Vault is locked. Please unlock to import data.');
                } else {
                    setError(data.error?.message || 'Import failed');
                }
            }
        } catch (err) {
            setError('Network error - is backend running?');
        } finally {
            setLoading({});
        }
    };

    const statusIcons = {
        success: <CheckCircle size={16} className="text-green-400" />,
        failed: <XCircle size={16} className="text-red-400" />,
        running: <RefreshCw size={16} className="text-blue-400 animate-spin" />,
        queued: <Clock size={16} className="text-yellow-400" />
    };

    const typeLabels = {
        photos_folder: 'Photos Folder',
        whatsapp: 'WhatsApp',
        pdf: 'PDF'
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Upload size={28} className="text-orange-400" />
                    <h1 className="text-3xl font-bold text-white">Import Data</h1>
                </div>
                <p className="text-gray-400">Import memories from external sources</p>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-300">
                    {success}
                </div>
            )}

            {/* Import Options */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Photos Folder */}
                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-500/20 p-3 rounded-lg">
                            <FolderOpen size={24} className="text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Photos Folder</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        Import all photos from a local folder
                    </p>
                    <input
                        type="text"
                        value={folderPath}
                        onChange={(e) => setFolderPath(e.target.value)}
                        placeholder="C:\Users\...\Pictures"
                        className="w-full px-3 py-2 bg-os-bg border border-os-hover rounded-lg text-white text-sm mb-3 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handlePhotosImport}
                        disabled={loading.photos}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                        {loading.photos ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Import Photos
                            </>
                        )}
                    </button>
                </div>

                {/* WhatsApp */}
                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-500/20 p-3 rounded-lg">
                            <MessageSquare size={24} className="text-green-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">WhatsApp</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        Import WhatsApp chat export (.txt)
                    </p>
                    <input
                        type="file"
                        accept=".txt"
                        onChange={(e) => setWhatsappFile(e.target.files[0])}
                        className="w-full px-3 py-2 bg-os-bg border border-os-hover rounded-lg text-white text-sm mb-3 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-green-500/20 file:text-green-300 file:cursor-pointer"
                    />
                    <button
                        onClick={handleWhatsAppImport}
                        disabled={loading.whatsapp}
                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                        {loading.whatsapp ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Import WhatsApp
                            </>
                        )}
                    </button>
                </div>

                {/* PDF */}
                <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-500/20 p-3 rounded-lg">
                            <FileText size={24} className="text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">PDF</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        Import PDF file with text extraction
                    </p>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPdfFile(e.target.files[0])}
                        className="w-full px-3 py-2 bg-os-bg border border-os-hover rounded-lg text-white text-sm mb-3 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-red-500/20 file:text-red-300 file:cursor-pointer"
                    />
                    <button
                        onClick={handlePDFImport}
                        disabled={loading.pdf}
                        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                        {loading.pdf ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Import PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Import History */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Import History</h2>
                    <button
                        onClick={fetchJobs}
                        className="p-2 hover:bg-os-hover rounded-lg transition-colors"
                    >
                        <RefreshCw size={18} className="text-gray-400" />
                    </button>
                </div>

                {jobs.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No imports yet</p>
                ) : (
                    <div className="space-y-2">
                        {jobs.map(job => (
                            <div
                                key={job.id}
                                className="flex items-center justify-between p-3 bg-os-bg rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    {statusIcons[job.status]}
                                    <div>
                                        <div className="text-sm font-medium text-white">
                                            {typeLabels[job.type] || job.type}
                                        </div>
                                        {job.details && (
                                            <div className="text-xs text-gray-400">{job.details}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(job.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300">
                    <strong>Note:</strong> Imported data is stored in your encrypted vault. Make sure your vault is unlocked before importing.
                </p>
            </div>
        </div>
    );
}
