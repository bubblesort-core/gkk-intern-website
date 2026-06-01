import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AudioProvider } from './components/AudioProvider'
import MaintenanceGuard from './components/MaintenanceGuard'
// Removing MusicProvider as requested

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AudioProvider>
            <MaintenanceGuard>
                <App />
            </MaintenanceGuard>
        </AudioProvider>
    </StrictMode>,
)
