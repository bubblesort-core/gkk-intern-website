import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MaintenanceGuard from './components/MaintenanceGuard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MaintenanceGuard>
      <App />
    </MaintenanceGuard>
  </StrictMode>,
)
