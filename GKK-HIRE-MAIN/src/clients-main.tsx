import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ClientsPage from './components/ClientsPage';
import MaintenanceGuard from './components/MaintenanceGuard';
// @ts-ignore
import CustomCursor from '../../CustomCursor.jsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CustomCursor label="You" color="#22c55e" />
        <MaintenanceGuard>
            <ClientsPage />
        </MaintenanceGuard>
    </StrictMode>,
);
