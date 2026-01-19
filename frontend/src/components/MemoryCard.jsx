import { Link } from 'react-router-dom';
import { Calendar, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function MemoryCard({ memory }) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const dateStr = new Date(memory.created_at).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    const tags = memory.tags ? memory.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const moodEmoji = getMoodEmoji(memory.mood);

    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
    };

    return (
        <Link to={`/memory/${memory.id}`} className="block group perspective-1000">
            <div
                className="relative bg-gradient-to-br from-os-panel via-os-panel to-os-bg border border-os-hover rounded-2xl p-6 hover:border-transparent transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                style={{
                    transform: isHovering
                        ? `rotateX(${(mousePosition.y - 50) / 20}deg) rotateY(${(mousePosition.x - 50) / 20}deg) translateZ(10px)`
                        : 'none',
                }}
            >
                {/* Shimmer effect */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15), transparent 50%)`
                    }}
                />

                {/* Animated gradient border */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: `linear-gradient(${mousePosition.x}deg, ${getMoodGradient(memory.mood)})`,
                        padding: '2px',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-xl text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all flex items-center gap-2">
                            {memory.title}
                            <Sparkles size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400" />
                        </h3>
                        <span className={`text-2xl transform group-hover:scale-125 transition-transform duration-300`}>
                            {moodEmoji}
                        </span>
                    </div>

                    <p className="text-sm text-gray-300 mb-4 line-clamp-2 flex-grow group-hover:text-gray-200 transition-colors">
                        {memory.note}
                    </p>

                    <div className="flex justify-between items-end border-t border-os-hover/50 group-hover:border-blue-500/30 pt-4 mt-auto transition-colors">
                        <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-blue-400 transition-colors">
                            <Calendar size={14} className="group-hover:animate-pulse" />
                            {dateStr}
                        </div>

                        <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                            {tags.slice(0, 3).map((tag, i) => (
                                <span
                                    key={i}
                                    className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-full transform group-hover:scale-110 transition-transform"
                                    style={{ transitionDelay: `${i * 50}ms` }}
                                >
                                    #{tag}
                                </span>
                            ))}
                            {tags.length > 3 && (
                                <span className="text-xs text-gray-400 px-2 py-1">+{tags.length - 3}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
        </Link>
    );
}

function getMoodEmoji(mood) {
    switch (mood) {
        case 'happy': return '😊';
        case 'excited': return '🤩';
        case 'sad': return '😢';
        case 'stressed': return '😰';
        case 'calm': return '😌';
        case 'neutral': return '😐';
        default: return '💭';
    }
}

function getMoodGradient(mood) {
    switch (mood) {
        case 'happy': return '#10b981, #34d399';
        case 'excited': return '#f59e0b, #fbbf24';
        case 'sad': return '#3b82f6, #60a5fa';
        case 'stressed': return '#ef4444, #f87171';
        case 'calm': return '#14b8a6, #2dd4bf';
        default: return '#6b7280, #9ca3af';
    }
}
