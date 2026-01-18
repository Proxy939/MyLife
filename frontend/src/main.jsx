import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Auto-update service worker
const updateSW = registerSW({
    onNeedRefresh() {
        // Show user notification logic here if desired, 
        // for now we stick to autoUpdate strategy in config
    },
    onOfflineReady() {
        console.log('App ready to work offline')
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
