import { Link } from 'react-router-dom';
import { Calendar, Tag } from 'lucide-react';

export default function MemoryCard({ memory }) {
    const dateStr = new Date(memory.created_at).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    return (
        <Link to={`/memory/${memory.id}`} className="block group">
            <div className="bg-os-panel border border-os-hover rounded-xl p-5 hover:border-os-accent hover:shadow-lg transition-all duration-200 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-100 group-hover:text-blue-400 transition-colors">
                        {memory.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full bg-os-hover capitalize text-${getMoodColor(memory.mood)}-400`}>
                        {memory.mood}
                    </span>
                </div>

                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {memory.note}
                </p>

                <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {dateStr}
                    </div>
                    {memory.tags && (
                        <div className="flex items-center gap-1 overflow-hidden max-w-[50%]">
                            <Tag size={12} />
                            <span className="truncate">{memory.tags.split(',').slice(0, 2).join(', ')}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

function getMoodColor(mood) {
    switch (mood) {
        case 'happy': return 'green';
        case 'excited': return 'yellow';
        case 'sad': return 'blue';
        case 'stressed': return 'red';
        case 'calm': return 'teal';
        default: return 'gray';
    }
}
