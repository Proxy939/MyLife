import { useState, useEffect } from 'react';
import { StickyNote, Save, Trash2 } from 'lucide-react';

export default function QuickNotes() {
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState('');
    const [currentTitle, setCurrentTitle] = useState('');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('mylife_quick_notes');
        if (stored) {
            try {
                setNotes(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading notes:', e);
            }
        }
    }, []);

    const saveNotes = (newNotes) => {
        localStorage.setItem('mylife_quick_notes', JSON.stringify(newNotes));
        setNotes(newNotes);
    };

    const saveNote = () => {
        if (!currentNote.trim()) return;

        if (editingId) {
            // Update existing note
            saveNotes(notes.map(n =>
                n.id === editingId
                    ? { ...n, title: currentTitle || 'Untitled', content: currentNote, updatedAt: new Date().toISOString() }
                    : n
            ));
            setEditingId(null);
        } else {
            // Create new note
            const note = {
                id: Date.now().toString(),
                title: currentTitle || 'Untitled',
                content: currentNote,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            saveNotes([note, ...notes]);
        }

        setCurrentNote('');
        setCurrentTitle('');
    };

    const editNote = (note) => {
        setCurrentTitle(note.title);
        setCurrentNote(note.content);
        setEditingId(note.id);
    };

    const deleteNote = (id) => {
        saveNotes(notes.filter(n => n.id !== id));
        if (editingId === id) {
            setCurrentNote('');
            setCurrentTitle('');
            setEditingId(null);
        }
    };

    const cancelEdit = () => {
        setCurrentNote('');
        setCurrentTitle('');
        setEditingId(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <StickyNote size={28} className="text-yellow-400" />
                            <h1 className="text-3xl font-bold text-white">Quick Notes</h1>
                        </div>
                        <p className="text-gray-400">Scratchpad for quick thoughts</p>
                    </div>

                    <div className="bg-os-panel border border-os-hover rounded-xl p-6 space-y-4">
                        <input
                            type="text"
                            value={currentTitle}
                            onChange={(e) => setCurrentTitle(e.target.value)}
                            placeholder="Note Title (optional)"
                            className="w-full px-4 py-2 bg-os-bg border border-os-hover rounded-lg text-white font-medium focus:outline-none focus:border-yellow-500"
                        />

                        <textarea
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            placeholder="Start typing your note..."
                            className="w-full px-4 py-3 bg-os-bg border border-os-hover rounded-lg text-white resize-none focus:outline-none focus:border-yellow-500"
                            rows={12}
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={saveNote}
                                disabled={!currentNote.trim()}
                                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {editingId ? 'Update Note' : 'Save Note'}
                            </button>
                            {editingId && (
                                <button
                                    onClick={cancelEdit}
                                    className="px-4 py-2 bg-os-hover hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                    <div className="bg-os-panel border border-os-hover rounded-xl p-4">
                        <h2 className="text-lg font-semibold text-white mb-1">Saved Notes</h2>
                        <p className="text-sm text-gray-400">{notes.length} notes</p>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {notes.length === 0 ? (
                            <div className="bg-os-panel border border-os-hover rounded-xl p-8 text-center">
                                <StickyNote size={48} className="text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No notes yet. Create your first note!</p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    className={`bg-os-panel border rounded-xl p-4 hover:border-yellow-500/30 transition-colors cursor-pointer ${editingId === note.id ? 'border-yellow-500' : 'border-os-hover'
                                        }`}
                                    onClick={() => editNote(note)}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h3 className="text-white font-medium">{note.title}</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNote(note.id);
                                            }}
                                            className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-3 mb-2">
                                        {note.content}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        {new Date(note.updatedAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
