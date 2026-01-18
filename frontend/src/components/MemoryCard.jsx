import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export default function MemoryCard({ memory }) {
    const dateStr = new Date(memory.created_at).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    const tags = memory.tags ? memory.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    return (
        <Link to={`/memory/${memory.id}`} className="block group">
            <div className="bg-os-panel border border-os-hover rounded-xl p-5 hover:border-os-accent hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-100 group-hover:text-blue-400 transition-colors">
                        {memory.title}
                    </h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-opacity-30 ${getMoodStyles(memory.mood)}`}>
                        {memory.mood}
                    </span>
                </div>

                <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">
                    {memory.note}
                </p>

                <div className="flex justify-between items-end border-t border-os-hover pt-3 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} />
                        {dateStr}
                    </div>

                    <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs bg-os-hover text-gray-300 px-2 py-0.5 rounded-full">
                                #{tag}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{tags.length - 3}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function getMoodStyles(mood) {
    switch (mood) {
        case 'happy': return 'bg-green-900 text-green-300 border-green-500';
        case 'excited': return 'bg-yellow-900 text-yellow-300 border-yellow-500';
        case 'sad': return 'bg-blue-900 text-blue-300 border-blue-500';
        case 'stressed': return 'bg-red-900 text-red-300 border-red-500';
        case 'calm': return 'bg-teal-900 text-teal-300 border-teal-500';
        default: return 'bg-gray-700 text-gray-300 border-gray-500';
    }
}
