import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

console.log('🚀 MyLife Starting... | Environment:', import.meta.env.MODE);
console.log('🔌 API URL:', import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000');

// Auto-update service worker
const updateSW = registerSW({
    onNeedRefresh() {
        console.log('🔄 PWA: New version available');
    },
    onOfflineReady() {
        console.log('✅ PWA: App ready to work offline');
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
)
