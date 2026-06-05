import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import NavigationMenu from '../components/NavigationMenu';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

interface Product {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    compare_at_price: number | null;
    images: string[];
    stock_status: string;
    stock_count: number | null;
    stock_refill_note: string | null;
    expected_delivery?: string | null;
}

export default function MerchandisePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const navigate = useNavigate();

    // Tracking States
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [trackOrderId, setTrackOrderId] = useState('');
    const [trackEmail, setTrackEmail] = useState('');
    const [trackResult, setTrackResult] = useState<any>(null);
    const [trackError, setTrackError] = useState('');
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch settings
                const { data: setts } = await supabase.from('merchandise_settings').select('*').eq('id', 1).single();
                setSettings(setts || { is_store_open: true });

                const fetchProducts = async () => {
                    try {
                        const { data, error } = await supabase.functions.invoke('get-merchandise-products', {
                            method: 'POST'
                        });
                        
                        if (error) throw error;
                        
                        const formattedData: Product[] = (data || []);
                        setProducts(formattedData);
                    } catch (err) {
                        setProducts([]);
                    }
                };

                await fetchProducts();
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Setup 3-second polling for live stock updates
        const pollStock = async () => {
            try {
                // Fetch effective stock directly from RPC (bypasses RLS on holds table)
                const { data: stockData, error: stockErr } = await supabase.rpc('get_all_effective_stock');
                
                if (stockErr) throw new Error('Polling fetch error');
                
                if (stockData) {
                    setProducts(currentProducts => {
                        return currentProducts.map(product => {
                            const stockUpdate = stockData.find((s: any) => s.product_id === product.id);
                            if (stockUpdate) {
                                return {
                                    ...product,
                                    stock_count: stockUpdate.effective_stock === 999999 ? null : stockUpdate.effective_stock
                                };
                            }
                            return product;
                        });
                    });
                }
            } catch (err) {
                // Silently handle polling errors
            }
        };

        const interval = setInterval(pollStock, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0e0e12', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <NavigationMenu />
                <div style={{ flex: 1, paddingTop: '100px', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '4rem 2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <div className="skeleton" style={{ height: '4rem', width: '60%', maxWidth: '600px', margin: '0 auto', marginBottom: '1rem', borderRadius: '1rem' }}></div>
                        <div className="skeleton" style={{ height: '1.5rem', width: '40%', maxWidth: '400px', margin: '0 auto', borderRadius: '0.5rem' }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                                <div className="skeleton" style={{ height: '300px', width: '100%', borderRadius: '0' }}></div>
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="skeleton" style={{ height: '1.5rem', width: '80%' }}></div>
                                    <div className="skeleton" style={{ height: '1rem', width: '100%' }}></div>
                                    <div className="skeleton" style={{ height: '1rem', width: '60%' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem' }}>
                                        <div className="skeleton" style={{ height: '2rem', width: '30%' }}></div>
                                        <div className="skeleton" style={{ height: '2rem', width: '40%', borderRadius: '2rem' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Handle Store Locked State
    const isBypassed = localStorage.getItem('maintenance_bypass') === 'true';
    if (settings && !settings.is_store_open && !isBypassed) {
        return (
            <div style={{ minHeight: '100vh', background: '#0e0e12', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <NavigationMenu />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                    <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1.5rem' }}></i>
                    <h1 style={{ fontSize: '3rem', fontFamily: 'Inter, sans-serif', fontWeight: 800, marginBottom: '1rem' }}>Store Closed</h1>
                    <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', lineHeight: 1.6 }}>
                        {settings.lock_message || 'The store is currently closed. Please check back later.'}
                    </p>
                    <button onClick={() => navigate('/')} style={{ marginTop: '2rem', padding: '1rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '2rem', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 600 }}>
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    const renderBanner = () => {
        if (settings && !settings.is_store_open && isBypassed) {
            return (
                <div style={{ background: '#ef4444', color: 'white', padding: '0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                    Store is currently CLOSED to the public. You are viewing this via Admin Bypass.
                </div>
            );
        }

        if (!settings || !settings.banner_type || settings.banner_type === 'none') return null;
        
        let bgColor = '#3b82f6';
        if (settings.banner_type === 'success') bgColor = '#10b981';
        if (settings.banner_type === 'warning') bgColor = '#f59e0b';

        return (
            <div style={{ background: bgColor, color: 'white', padding: '0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                {settings.banner_message}
            </div>
        );
    };

    const handleTrackOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setTrackError('');
        setTrackResult(null);
        setIsTracking(true);

        try {
            const orderId = trackOrderId.trim();
            const email = trackEmail.trim();

            if (!orderId || !email) {
                setTrackError('Please enter both Order ID and Email.');
                return;
            }

            const { data, error } = await supabase.rpc('get_order_tracking', {
                p_order_id: orderId,
                p_email: email
            });

            if (error) throw error;

            if (!data) {
                setTrackError('Order not found. Please check your Order ID and Email.');
            } else {
                setTrackResult(data);
            }
        } catch (err: any) {
            console.error(err);
            setTrackError('Failed to fetch tracking details. Please try again.');
        } finally {
            setIsTracking(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0e0e12', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <NavigationMenu />
            
            <div style={{ flex: 1, paddingTop: '100px' }}>
                {renderBanner()}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h1 style={{ fontSize: '3.5rem', fontFamily: 'Inter, sans-serif', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            GKK Intern Merchandise
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}>
                            Premium gear for premium interns. Wear the badge of honor.
                        </p>
                        <button onClick={() => setShowTrackModal(true)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}>
                            <i className="fas fa-truck"></i> Track My Order
                        </button>
                    </div>

                    {products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#64748b', marginBottom: '1rem' }}></i>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Coming Soon</h3>
                            <p style={{ color: '#94a3b8' }}>We are restocking our inventory. Check back soon for new arrivals!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {products.map(product => {
                                const isOutOfStock = product.stock_status === 'out_of_stock' || (product.stock_count !== null && product.stock_count <= 0);
                                return (
                                <div 
                                    key={product.id} 
                                    onClick={() => navigate(`/merchandise/${product.slug || product.id}`)}
                                    style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'transform 0.3s ease, border-color 0.3s ease', display: 'flex', flexDirection: 'column', filter: isOutOfStock ? 'grayscale(0.8)' : 'none', opacity: isOutOfStock ? 0.7 : 1 }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                                >
                                    {product.images && product.images[0] ? (
                                        <div style={{ height: '300px', overflow: 'hidden', position: 'relative' }}>
                                            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {product.compare_at_price && product.compare_at_price > product.price && (
                                                <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 2 }}>
                                                    {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                                                </div>
                                            )}
                                            {isOutOfStock && (
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239,68,68,0.9)', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 2 }}>
                                                    SOLD OUT
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ height: '300px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-image" style={{ fontSize: '3rem', color: '#334155' }}></i>
                                        </div>
                                    )}
                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white' }}>{product.name}</h3>
                                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                            {product.description}
                                        </p>
                                        {product.stock_count !== null && product.stock_count > 0 && (
                                            <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <i className="fas fa-fire"></i> Only {product.stock_count} left!
                                            </div>
                                        )}
                                        {isOutOfStock && product.stock_refill_note && (
                                            <div style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <i className="fas fa-info-circle"></i> {product.stock_refill_note}
                                            </div>
                                        )}
                                        {product.expected_delivery && (
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <i className="fas fa-truck"></i> {product.expected_delivery}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                {product.compare_at_price && (
                                                    <span style={{ textDecoration: 'line-through', color: '#64748b', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                                                        ₹{product.compare_at_price}
                                                    </span>
                                                )}
                                                <strong style={{ fontSize: '1.5rem', color: '#3b82f6' }}>₹{product.price}</strong>
                                            </div>
                                            <button style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 600, transition: 'all 0.3s ease' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3b82f6'; }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
            <Footer />

            {/* Track Order Modal */}
            {showTrackModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#1e293b', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Track Your Order</h3>
                            <button onClick={() => { setShowTrackModal(false); setTrackResult(null); setTrackError(''); setTrackOrderId(''); setTrackEmail(''); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                        </div>
                        
                        {!trackResult ? (
                            <form onSubmit={handleTrackOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter the details provided on your order success screen to check your shipping status.</p>
                                
                                {trackError && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{trackError}</div>}
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Order ID *</label>
                                    <input required value={trackOrderId} onChange={e => setTrackOrderId(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Email Address *</label>
                                    <input required value={trackEmail} onChange={e => setTrackEmail(e.target.value)} type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="Used during checkout" />
                                </div>
                                <button type="submit" disabled={isTracking} style={{ padding: '1rem', background: isTracking ? '#1d4ed8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: isTracking ? 'not-allowed' : 'pointer', marginTop: '1rem' }}>
                                    {isTracking ? 'Searching...' : 'Find Order'}
                                </button>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: '0 0 1.5rem 0', color: 'white' }}>Tracking Details</h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '0.5rem' }}>
                                        {(() => {
                                            const status = (trackResult.shipping_status || 'processing').toLowerCase();
                                            let currentStep = 0;
                                            if (status === 'processing') currentStep = 1;
                                            if (status === 'shipped') currentStep = 2;
                                            if (status === 'delivered') currentStep = 3;

                                            const renderStep = (title: string, desc: string, stepIndex: number, icon: string, timestamp: string | null, isLast: boolean = false) => {
                                                const stepState = stepIndex < currentStep ? 'completed' : stepIndex === currentStep ? 'active' : 'pending';
                                                const color = stepState === 'completed' ? '#10b981' : stepState === 'active' ? '#3b82f6' : '#475569';
                                                const formattedDate = timestamp ? new Date(timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
                                                
                                                return (
                                                    <div key={title} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                                        {!isLast && (
                                                            <div style={{ position: 'absolute', top: '24px', left: '11px', bottom: '-8px', width: '2px', background: stepState === 'completed' ? '#10b981' : '#334155', zIndex: 1 }}></div>
                                                        )}
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: stepState === 'pending' ? '#1e293b' : color, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, flexShrink: 0, marginTop: '2px' }}>
                                                            {stepState === 'completed' ? <i className="fas fa-check" style={{ fontSize: '10px', color: 'white' }}></i> : <i className={icon} style={{ fontSize: '10px', color: stepState === 'active' ? 'white' : color }}></i>}
                                                        </div>
                                                        <div style={{ paddingBottom: '1.5rem', width: '100%' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: stepState === 'pending' ? '#64748b' : 'white', fontWeight: stepState === 'active' ? 700 : 500 }}>{title}</h4>
                                                                {formattedDate && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formattedDate}</span>}
                                                            </div>
                                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{desc}</p>
                                                        </div>
                                                    </div>
                                                );
                                            };

                                            return (
                                                <>
                                                    {renderStep('Order Placed', 'We have received your order.', 0, 'fas fa-clipboard-list', trackResult.created_at)}
                                                    {renderStep('Processing', 'Your order is being prepared.', 1, 'fas fa-box', trackResult.processed_at)}
                                                    {renderStep('Shipped', 'Your order has been handed over to the courier.', 2, 'fas fa-truck', trackResult.shipped_at)}
                                                    {renderStep('Delivered', 'Your order has been delivered.', 3, 'fas fa-home', trackResult.delivered_at, true)}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    
                                    <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Delivery Address</label>
                                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem' }}>{trackResult.delivery_address}</p>
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{trackResult.city}, {trackResult.state} {trackResult.zip_code}</p>
                                    </div>
                                    
                                    {trackResult.tracking_link && (
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <a href={trackResult.tracking_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white', textAlign: 'center', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
                                                <i className="fas fa-external-link-alt" style={{ marginRight: '0.5rem' }}></i> View Courier Tracking
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setTrackResult(null)} style={{ background: 'none', border: '1px solid #334155', color: '#cbd5e1', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                    Search Another Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
