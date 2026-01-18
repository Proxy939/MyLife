import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import StatusMessage from '../components/StatusMessage';
import { MessageSquare, Send, Bot, User, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MemoryChat() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi! I can help you recall memories or answer questions about your life. What’s on your mind?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const data = await api.post('/ai/chat', { message: userMsg.text });

            const botMsg = {
                role: 'assistant',
                text: data.reply,
                refs: data.memory_refs || []
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (err) {
            if (err.message.includes("404")) {
                setError("Memory Chat isn’t enabled yet. AI module will be added in the next step.");
                // Remove user message to "undo" send visually, or just show error? 
                // Let's leave message but show error banner.
            } else {
                // Add error as a system message
                setMessages(prev => [...prev, { role: 'error', text: "Error: " + err.message }]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="text-teal-400" />
                Memory Chat
            </h2>

            {/* Chat Area */}
            <div className="flex-1 bg-os-panel border border-os-hover rounded-xl p-4 overflow-y-auto space-y-4 mb-4 shadow-inner">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-indigo-600' : (msg.role === 'error' ? 'bg-red-900' : 'bg-gray-600')}`}>
                            {msg.role === 'assistant' && <Bot size={16} text-white />}
                            {msg.role === 'user' && <User size={16} text-white />}
                            {msg.role === 'error' && <span className="font-bold">!</span>}
                        </div>

                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-os-accent text-white' :
                                (msg.role === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-os-hover text-gray-100')
                            }`}>
                            {msg.text}

                            {/* References */}
                            {msg.refs && msg.refs.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                                    <span className="text-xs text-indigo-300 font-semibold flex items-center gap-1">
                                        <LinkIcon size={10} /> Referenced:
                                    </span>
                                    {msg.refs.map(refId => (
                                        <Link
                                            key={refId}
                                            to={`/memory/${refId}`}
                                            className="text-xs bg-black/20 hover:bg-black/40 px-2 py-1 rounded text-indigo-200 transition-colors"
                                        >
                                            #{refId}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Bot size={16} />
                        </div>
                        <div className="bg-os-hover text-gray-400 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce delay-100">●</span>
                            <span className="animate-bounce delay-200">●</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {error && (
                <div className="mb-4">
                    <StatusMessage error={error} />
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    placeholder="Ask about your memories..."
                    className="w-full bg-os-panel border border-os-hover rounded-xl pl-4 pr-12 py-3 text-white focus:border-os-accent outline-none shadow-lg"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-os-accent hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-0"
                >
                    <Send size={16} />
                </button>
            </form>

        </div>
    );
}
