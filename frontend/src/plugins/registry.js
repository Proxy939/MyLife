import HabitTracker from './HabitTracker';
import Goals from './Goals';
import QuickNotes from './QuickNotes';

export const PLUGINS = [
    {
        id: 'habit-tracker',
        name: 'Habit Tracker',
        description: 'Track daily habits with a simple checklist',
        routePath: '/plugins/habits',
        component: HabitTracker,
        icon: 'CheckSquare',
        enabledByDefault: true
    },
    {
        id: 'goals',
        name: 'Goals',
        description: 'Set and track your personal goals',
        routePath: '/plugins/goals',
        component: Goals,
        icon: 'Target',
        enabledByDefault: true
    },
    {
        id: 'quick-notes',
        name: 'Quick Notes',
        description: 'Scratchpad for quick notes and thoughts',
        routePath: '/plugins/notes',
        component: QuickNotes,
        icon: 'StickyNote',
        enabledByDefault: false
    }
];

// Get enabled plugins from localStorage
export function getEnabledPlugins() {
    try {
        const stored = localStorage.getItem('mylife_enabled_plugins');
        if (stored) {
            const enabled = JSON.parse(stored);
            return PLUGINS.filter(p => enabled.includes(p.id));
        }
        // Default: return plugins enabled by default
        return PLUGINS.filter(p => p.enabledByDefault);
    } catch (e) {
        console.error('Error loading enabled plugins:', e);
        return PLUGINS.filter(p => p.enabledByDefault);
    }
}

// Check if plugin is enabled
export function isPluginEnabled(pluginId) {
    try {
        const stored = localStorage.getItem('mylife_enabled_plugins');
        if (stored) {
            const enabled = JSON.parse(stored);
            return enabled.includes(pluginId);
        }
        // Check default
        const plugin = PLUGINS.find(p => p.id === pluginId);
        return plugin ? plugin.enabledByDefault : false;
    } catch (e) {
        console.error('Error checking plugin status:', e);
        return false;
    }
}

// Toggle plugin enabled state
export function togglePlugin(pluginId) {
    try {
        const stored = localStorage.getItem('mylife_enabled_plugins');
        let enabled = [];

        if (stored) {
            enabled = JSON.parse(stored);
        } else {
            // Initialize with defaults
            enabled = PLUGINS.filter(p => p.enabledByDefault).map(p => p.id);
        }

        if (enabled.includes(pluginId)) {
            enabled = enabled.filter(id => id !== pluginId);
        } else {
            enabled.push(pluginId);
        }

        localStorage.setItem('mylife_enabled_plugins', JSON.stringify(enabled));
        return true;
    } catch (e) {
        console.error('Error toggling plugin:', e);
        return false;
    }
}
