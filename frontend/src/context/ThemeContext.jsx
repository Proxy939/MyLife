import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
    default: {
        name: 'Midnight',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        bg: '#0f172a',
        panel: '#1e293b',
        hover: '#334155',
        text: '#f1f5f9',
    },
    ocean: {
        name: 'Ocean',
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        accent: '#6366f1',
        bg: '#082f49',
        panel: '#0c4a6e',
        hover: '#075985',
        text: '#e0f2fe',
    },
    sunset: {
        name: 'Sunset',
        primary: '#f97316',
        secondary: '#ec4899',
        accent: '#eab308',
        bg: '#451a03',
        panel: '#7c2d12',
        hover: '#9a3412',
        text: '#fff7ed',
    },
    forest: {
        name: 'Forest',
        primary: '#10b981',
        secondary: '#059669',
        accent: '#14b8a6',
        bg: '#022c22',
        panel: '#064e3b',
        hover: '#065f46',
        text: '#d1fae5',
    },
    purple: {
        name: 'Purple Dream',
        primary: '#a855f7',
        secondary: '#c026d3',
        accent: '#d946ef',
        bg: '#1e1b4b',
        panel: '#312e81',
        hover: '#3730a3',
        text: '#f3e8ff',
    },
    rose: {
        name: 'Rose',
        primary: '#f43f5e',
        secondary: '#e11d48',
        accent: '#fb7185',
        bg: '#4c0519',
        panel: '#881337',
        hover: '#9f1239',
        text: '#ffe4e6',
    },
};

export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('mylife_theme');
        return saved || 'default';
    });

    const [customTheme, setCustomTheme] = useState(() => {
        const saved = localStorage.getItem('mylife_custom_theme');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        localStorage.setItem('mylife_theme', currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        if (customTheme) {
            localStorage.setItem('mylife_custom_theme', JSON.stringify(customTheme));
        }
    }, [customTheme]);

    const theme = currentTheme === 'custom' && customTheme ? customTheme : themes[currentTheme] || themes.default;

    // Apply CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-secondary', theme.secondary);
        root.style.setProperty('--color-accent', theme.accent);
        root.style.setProperty('--color-bg', theme.bg);
        root.style.setProperty('--color-panel', theme.panel);
        root.style.setProperty('--color-hover', theme.hover);
        root.style.setProperty('--color-text', theme.text);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{
            currentTheme,
            setCurrentTheme,
            theme,
            themes,
            customTheme,
            setCustomTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
