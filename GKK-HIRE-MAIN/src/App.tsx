import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Home from './Home';
import SkeletonLoader from './components/SkeletonLoader';

const MerchandisePage = lazy(() => import('./pages/MerchandisePage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route 
                path="/merchandise" 
                element={
                    <Suspense fallback={<SkeletonLoader />}>
                        <MerchandisePage />
                    </Suspense>
                } 
            />
            <Route 
                path="/merchandise/:slug" 
                element={
                    <Suspense fallback={<SkeletonLoader />}>
                        <ProductDetailsPage />
                    </Suspense>
                } 
            />
        </Routes>
    );
}
