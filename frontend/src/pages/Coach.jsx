import { useState } from 'react';
import { Brain, Send, CheckCircle, ExternalLink } from 'lucide-react';

export default function Coach() {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sendMessage = async () => {
        if (!message.trim()) return;

        const userMessage = message;
        setMessage('');
        setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/ai/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await res.json();

            if (data.success) {
                setConversation(prev => [...prev, {
                    role: 'assistant',
                    content: data.data.reply,
                    action_plan: data.data.action_plan,
                    memory_refs: data.data.memory_refs
                }]);
            } else {
                setError(data.error?.message || 'Coach unavailable');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Brain size={28} className="text-indigo-400" />
                    <h1 className="text-3xl font-bold text-white">AI Coach</h1>
                </div>
                <p className="text-gray-400">Your personal life coach powered by your memories</p>
            </div>

            {/* Conversation */}
            <div className="bg-os-panel border border-os-hover rounded-xl p-6 min-h-[400px] max-h-[600px] overflow-y-auto space-y-4">
                {conversation.length === 0 ? (
                    <div className="text-center py-20">
                        <Brain size={48} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-white font-medium mb-1">Start a conversation</p>
                        <p className="text-gray-400 text-sm">Ask me about goals, moods, or patterns</p>
                    </div>
                ) : (
                    conversation.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl p-4 ${msg.role === 'user'
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-os-bg border border-os-hover'
                                }`}>
                                <p className="text-sm">{msg.content}</p>

                                {msg.action_plan && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <p className="text-xs font-semibold mb-2 opacity-70">Action Plan:</p>
                                        <ul className="space-y-1">
                                            {msg.action_plan.map((action, i) => (
                                                <li key={i} className="text-xs flex items-start gap-2">
                                                    <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                                                    <span>{action}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {msg.memory_refs && msg.memory_refs.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <p className="text-xs font-semibold mb-2 opacity-70">Related Memories:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {msg.memory_refs.map(id => (
                                                <a
                                                    key={id}
                                                    href={`/memory/${id}`}
                                                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs flex items-center gap-1 transition-colors"
                                                >
                                                    #{id}
                                                    <ExternalLink size={10} />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-os-bg border border-os-hover rounded-xl p-4">
                            <div className="animate-pulse text-gray-400 text-sm">Thinking...</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Input */}
            <div className="flex gap-3">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask me anything about your journey..."
                    className="flex-1 px-4 py-3 bg-os-panel border border-os-hover rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Send size={18} />
                    Send
                </button>
            </div>
        </div>
    );
}
