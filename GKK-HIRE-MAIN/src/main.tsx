import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AudioProvider } from './components/AudioProvider'
import MaintenanceGuard from './components/MaintenanceGuard'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AudioProvider>
            <MaintenanceGuard>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </MaintenanceGuard>
        </AudioProvider>
    </StrictMode>,
)
