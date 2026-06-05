import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NavigationMenu from '../components/NavigationMenu';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProductDetailsPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    
    const [product, setProduct] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [paying, setPaying] = useState(false);

    // Hold & Stock State
    const [effectiveStock, setEffectiveStock] = useState<number | null>(null);
    const [holdId, setHoldId] = useState<string | null>(null);
    const [holdTimeLeft, setHoldTimeLeft] = useState<number>(0);
    const [isHolding, setIsHolding] = useState(false);

    // Review Form State
    const [reviewName, setReviewName] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');

    // Checkout Form State
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutName, setCheckoutName] = useState('');
    const [checkoutEmail, setCheckoutEmail] = useState('');
    const [checkoutPhone, setCheckoutPhone] = useState('');
    const [checkoutAddress, setCheckoutAddress] = useState('');
    const [checkoutCity, setCheckoutCity] = useState('');
    const [checkoutState, setCheckoutState] = useState('');
    const [checkoutZip, setCheckoutZip] = useState('');

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState('');
    const [copiedId, setCopiedId] = useState(false);

    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const getSessionId = () => {
        let sid = sessionStorage.getItem('merch_session_id');
        if (!sid) {
            sid = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('merch_session_id', sid);
        }
        return sid;
    };

    const releaseHold = async (hId: string) => {
        const sid = getSessionId();
        try {
            await supabase.functions.invoke('merchandise-release-hold', { body: { hold_id: hId, session_id: sid } });
        } catch (err) {
            console.error('Failed to release hold', err);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (holdId) {
                const sid = getSessionId();
                const blob = new Blob([JSON.stringify({ hold_id: holdId, session_id: sid })], { type: 'application/json' });
                navigator.sendBeacon(window.location.origin + '/supabase-main/functions/v1/merchandise-release-hold', blob);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [holdId]);

    useEffect(() => {
        if (holdTimeLeft > 0) {
            const timer = setTimeout(() => setHoldTimeLeft(holdTimeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (holdTimeLeft === 0 && holdId) {
            setShowCheckoutModal(false);
            setIsHolding(false);
            Swal.fire({ title: 'Time Expired', text: 'Your reservation time has expired. Please try checking out again.', icon: 'warning', background: '#1e293b', color: '#fff' });
            setHoldId(null);
        }
    }, [holdTimeLeft, holdId]);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const { data: setts } = await supabase.from('merchandise_settings').select('*').eq('id', 1).single();
                setSettings(setts || { is_store_open: true, layout_config: { sections: ['gallery', 'details', 'reviews'] } });

                const { data: prods, error: prodErr } = await supabase.functions.invoke('get-merchandise-products', { method: 'POST' });
                
                if (prodErr || !prods || prods.length === 0) {
                    throw new Error('Product not found');
                }

                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');
                const matchedProduct = prods.find((p: any) => isUuid ? p.id === slug : p.slug === slug);

                if (!matchedProduct) {
                    throw new Error('Product not found');
                }
                
                setProduct(matchedProduct);

                const { data: estock } = await supabase.rpc('get_effective_stock', { p_product_id: matchedProduct.id });
                if (estock !== null) {
                    setEffectiveStock(estock);
                }
            } catch (err) {
                navigate('/merchandise');
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchProductData();
    }, [slug, navigate]);

    const fetchReviews = async () => {
        if (!product?.id) return;
        const { data: revs } = await supabase
            .from('merchandise_reviews')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
        
        setReviews(revs || []);
    };

    useEffect(() => {
        fetchReviews();
    }, [product?.id]);

    useEffect(() => {
        if (!product) return;
        const fetchStock = async () => {
            const { data: pData, error: pErr } = await supabase.from('merchandise_products').select('stock_status').eq('id', product.id).single();
            const { data: effectiveStockVal, error: stockErr } = await supabase.rpc('get_effective_stock', { p_product_id: product.id });
            
            if (!pErr && !stockErr) {
                setProduct((prev: any) => ({ ...prev, stock_status: pData.stock_status }));
                setEffectiveStock(effectiveStockVal === 999999 ? null : effectiveStockVal);
            }
        };
        const interval = setInterval(fetchStock, 3000);
        return () => clearInterval(interval);
    }, [product]);

    const handleBuyNow = async () => {
        if (!product) return;

        if (effectiveStock !== null && effectiveStock <= 0) {
            Swal.fire({ title: 'Out of Stock', text: 'Sorry, this item is currently out of stock or reserved by others.', icon: 'error', background: '#1e293b', color: '#fff' });
            return;
        }

        if (product.payment_service === 'custom_link' && product.payment_link) {
            window.location.href = product.payment_link;
            return;
        }

        if (product.payment_service === 'razorpay') {
            try {
                setIsHolding(true);
                const sid = getSessionId();
                const { data, error } = await supabase.functions.invoke('merchandise-hold-stock', {
                    body: { product_id: product.id, session_id: sid }
                });

                if (error || !data?.hold_id) {
                    Swal.fire({ title: 'Item Reserved', text: 'Item is currently reserved by another customer. Please try again in a few minutes.', icon: 'warning', background: '#1e293b', color: '#fff' });
                    return;
                }

                setHoldId(data.hold_id);
                setHoldTimeLeft(300);

                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        setCheckoutEmail(session.user.email || '');
                        setCheckoutName(session.user.user_metadata?.full_name || '');
                    }
                });
                setShowCheckoutModal(true);
            } catch (err) {
                Swal.fire({ title: 'Hold Failed', text: 'Failed to reserve stock. Please try again.', icon: 'error', background: '#1e293b', color: '#fff' });
            } finally {
                setIsHolding(false);
            }
        }
    };

    const processPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;
        
        try {
            setPaying(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!(window as any).Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const orderRes = await fetch(window.location.origin + '/supabase-main/functions/v1/razorpay-merch-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session ? session.access_token : import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    product_id: product.id,
                    hold_id: holdId,
                    user_email: checkoutEmail,
                    user_name: checkoutName,
                    user_phone: checkoutPhone,
                    delivery_address: checkoutAddress,
                    city: checkoutCity,
                    state: checkoutState,
                    zip_code: checkoutZip
                })
            });

            if (!orderRes.ok) {
                const err = await orderRes.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create order');
            }

            const orderData = await orderRes.json();
            setShowCheckoutModal(false);

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'GKK Merchandise',
                description: product.name,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch(window.location.origin + '/supabase-main/functions/v1/razorpay-merch-verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session ? session.access_token : import.meta.env.VITE_SUPABASE_ANON_KEY}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (!verifyRes.ok) throw new Error('Verification failed');
                        setSuccessOrderId(response.razorpay_order_id);
                        setShowSuccessModal(true);
                    } catch (err) {
                        Swal.fire({ title: 'Verification Failed', text: 'Payment successful, but verification failed. Please contact support.', icon: 'error', background: '#1e293b', color: '#fff' });
                    } finally {
                        setPaying(false);
                    }
                },
                prefill: orderData.prefill,
                theme: { color: '#3b82f6' },
                modal: {
                    ondismiss: async function() {
                        setPaying(false);
                        Swal.fire({ title: 'Payment Cancelled', text: 'Payment was cancelled or failed.', icon: 'error', background: '#1e293b', color: '#fff' });
                        if (holdId) {
                           await releaseHold(holdId);
                           setHoldId(null);
                        }
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                Swal.fire({ title: 'Payment Failed', text: response.error.description, icon: 'error', background: '#1e293b', color: '#fff' });
                setPaying(false);
            });
            rzp.open();

        } catch (err: any) {
            setPaying(false);
            Swal.fire({ title: 'Error', text: `Error initiating payment: ${err.message}`, icon: 'error', background: '#1e293b', color: '#fff' });
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewName || !reviewComment) return;

        try {
            const { error } = await supabase.from('merchandise_reviews').insert([{
                product_id: product.id,
                user_name: reviewName,
                rating: reviewRating,
                comment: reviewComment,
                is_approved: false
            }]);

            if (error) throw error;
            
            Swal.fire({ title: 'Review Submitted', text: 'Your review has been submitted and is awaiting approval by an admin.', icon: 'success', background: '#1e293b', color: '#fff' });
            setReviewName('');
            setReviewComment('');
            setReviewRating(5);
            fetchReviews();
        } catch (err) {
            Swal.fire({ title: 'Submission Failed', text: 'Failed to submit review. Please try again.', icon: 'error', background: '#1e293b', color: '#fff' });
        }
    };

    const generateInvoicePDF = async () => {
        if (!product) return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const orderDate = new Date();

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 14, 22);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('GKK Intern Team', 14, 30);
        doc.text(`Invoice Date: ${orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 22, { align: 'right' });
        doc.text(`Time: ${orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 14, 30, { align: 'right' });

        // Order ID bar
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 40, pageWidth, 12, 'F');
        doc.setTextColor(96, 165, 250);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Order ID: ${successOrderId}`, 14, 48);

        let y = 62;
        doc.setTextColor(30, 41, 59);

        // Customer Details Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Details', 14, y);
        y += 2;
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.line(14, y, 90, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const customerDetails = [
            ['Name', checkoutName],
            ['Email', checkoutEmail],
            ['Phone', checkoutPhone],
            ['Address', checkoutAddress],
            ['City', checkoutCity],
            ['State', checkoutState],
            ['ZIP Code', checkoutZip],
        ];
        customerDetails.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 14, y);
            doc.setFont('helvetica', 'normal');
            doc.text(value || 'N/A', 55, y);
            y += 6;
        });

        y += 6;

        // Product Details Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Details', 14, y);
        y += 2;
        doc.setDrawColor(59, 130, 246);
        doc.line(14, y, 90, y);
        y += 8;

        const basePrice = product.price;
        const deliveryCharge = product.delivery_charge || 0;
        const totalAmount = basePrice + deliveryCharge;
        const deliveryLabel = product.delivery_charge_type === 'included' || !deliveryCharge ? 'Free (Included)' : `₹${deliveryCharge}`;

        autoTable(doc, {
            startY: y,
            head: [['Item', 'Base Price', 'Delivery', 'Total']],
            body: [[product.name, `₹${basePrice}`, deliveryLabel, `₹${totalAmount}`]],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10, textColor: [30, 41, 59] },
            columnStyles: { 0: { cellWidth: 70 } },
            margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 12;

        // Amount Summary
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Base Price:', 20, y + 9);
        doc.text(`₹${basePrice}`, pageWidth - 20, y + 9, { align: 'right' });
        doc.text('Delivery Charge:', 20, y + 17);
        doc.text(deliveryLabel, pageWidth - 20, y + 17, { align: 'right' });
        y += 28;
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(14, y, pageWidth - 28, 14, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL PAID', 20, y + 10);
        doc.text(`₹${totalAmount}`, pageWidth - 20, y + 10, { align: 'right' });

        y += 24;

        let splitY = y;
        
        // --- Left Side: Payment Information ---
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Information', 14, splitY);
        let leftY = splitY + 2;
        doc.setDrawColor(59, 130, 246);
        doc.line(14, leftY, 100, leftY);
        leftY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const paymentDetails = [
            ['Gateway', 'Razorpay'],
            ['Order ID', successOrderId],
            ['Currency', 'INR'],
            ['Status', 'Paid'],
        ];
        paymentDetails.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 14, leftY);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 55, leftY);
            leftY += 6;
        });

        // --- Right Side: Company Details ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Company Details', 110, splitY);
        let rightY = splitY + 2;
        doc.setDrawColor(59, 130, 246);
        doc.line(110, rightY, 196, rightY);
        rightY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const companyDetails = [
            'GKK Intern Team',
            'Sector V, Salt Lake, Kolkata,',
            'West Bengal, 700091, India',
            'Web: https://gkkintern.in',
            'Email: support@gkkintern.in',
            'Phone: +91 8910894306'
        ];
        companyDetails.forEach(text => {
            doc.text(text, 110, rightY);
            rightY += 6;
        });

        // Continue rendering below the longer column
        y = Math.max(leftY, rightY) + 6;

        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // Footer
            doc.setFillColor(241, 245, 249);
            doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            doc.text('This is a computer-generated invoice. No signature is required.', pageWidth / 2, pageHeight - 16, { align: 'center' });
            doc.text(`© ${new Date().getFullYear()} GKK Intern Team. All rights reserved.`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text('For refunds, exchanges, or order tracking, please keep this invoice safe.', pageWidth / 2, pageHeight - 4, { align: 'center' });

            // Watermark - load logo and draw with low opacity
            try {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                await new Promise<void>((resolve) => {
                    logoImg.onload = () => resolve();
                    logoImg.onerror = () => resolve(); // continue even if logo fails
                    logoImg.src = '/gkk-intern-logo.png';
                });
                if (logoImg.complete && logoImg.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = logoImg.naturalWidth;
                    canvas.height = logoImg.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.globalAlpha = 0.12; // Deeper opacity
                        ctx.drawImage(logoImg, 0, 0);
                        const watermarkData = canvas.toDataURL('image/png');
                        const wmWidth = 190; // Bigger watermark
                        const wmHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * wmWidth;
                        doc.addImage(watermarkData, 'PNG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
                    }
                }
            } catch { /* continue without watermark */ }
        }

        doc.save(`GKK-Invoice-${successOrderId.substring(0, 12)}.pdf`);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0e0e12', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <NavigationMenu />
                <div style={{ flex: 1, paddingTop: '120px', paddingBottom: '4rem', maxWidth: '1200px', margin: '0 auto', width: '100%', paddingLeft: '2rem', paddingRight: '2rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '1rem', marginBottom: '1rem' }}></div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '0.5rem' }}></div>)}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="skeleton" style={{ height: '3rem', width: '80%', borderRadius: '0.5rem' }}></div>
                            <div className="skeleton" style={{ height: '2rem', width: '40%', borderRadius: '0.5rem' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div className="skeleton" style={{ height: '1rem', width: '100%', borderRadius: '0.25rem' }}></div>
                                <div className="skeleton" style={{ height: '1rem', width: '90%', borderRadius: '0.25rem' }}></div>
                                <div className="skeleton" style={{ height: '1rem', width: '95%', borderRadius: '0.25rem' }}></div>
                                <div className="skeleton" style={{ height: '1rem', width: '60%', borderRadius: '0.25rem' }}></div>
                            </div>
                            <div className="skeleton" style={{ height: '4rem', width: '100%', borderRadius: '0.75rem', marginTop: 'auto' }}></div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const isBypassed = localStorage.getItem('maintenance_bypass') === 'true';
    if (!product || (settings && !settings.is_store_open && !isBypassed)) {
        return (
            <div style={{ minHeight: '100vh', background: '#0e0e12', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <NavigationMenu />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <i className="fas fa-lock" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }}></i>
                    <h2>{settings?.lock_message || 'Store is closed or product unavailable'}</h2>
                    <button onClick={() => navigate('/merchandise')} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '1rem', cursor: 'pointer' }}>Back to Store</button>
                </div>
            </div>
        );
    }

    const layoutSections = settings?.layout_config?.sections || ['gallery', 'details', 'reviews'];

    const galleryBlock = (
        <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
                {product.images && product.images[activeImage] ? (
                    <img 
                        src={product.images[activeImage]} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in', transition: 'transform 0.2s' }} 
                        onClick={() => { setZoomedImage(product.images[activeImage]); setZoomLevel(1); }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-image" style={{ fontSize: '4rem', color: '#334155' }}></i></div>
                )}
            </div>
            {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {product.images.map((img: string, idx: number) => (
                        <div 
                            key={idx} 
                            onClick={() => setActiveImage(idx)}
                            style={{ width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer', border: activeImage === idx ? '2px solid #3b82f6' : '2px solid transparent', opacity: activeImage === idx ? 1 : 0.6, transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)' }}
                        >
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const isOutOfStock = product.stock_status === 'out_of_stock' || (effectiveStock !== null && effectiveStock <= 0);

    const detailsBlock = (
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => navigate('/merchandise')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
                <i className="fas fa-arrow-left"></i> Back to Store
            </button>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>{product.name}</h1>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>
                    ₹{product.delivery_charge_type === 'included' ? product.price + (product.delivery_charge || 0) : product.price}
                </span>
                {product.compare_at_price && (
                    <span style={{ fontSize: '1.25rem', color: '#64748b', textDecoration: 'line-through' }}>₹{product.compare_at_price}</span>
                )}
                {product.compare_at_price && product.compare_at_price > product.price && (
                    <span style={{ padding: '0.25rem 0.75rem', background: '#10b981', color: 'white', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                    </span>
                )}
                {isOutOfStock && (
                    <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>OUT OF STOCK</span>
                )}
            </div>

            {product.delivery_charge_type === 'included' && product.delivery_charge > 0 && (
                <div style={{ marginBottom: '1.5rem', color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    <i className="fas fa-truck"></i> Free Delivery
                </div>
            )}
            {product.delivery_charge_type === 'extra' && product.delivery_charge > 0 && (
                <div style={{ marginBottom: '1.5rem', color: '#f59e0b', fontSize: '1.1rem' }}>
                    <i className="fas fa-plus"></i> ₹{product.delivery_charge} Delivery Charge
                </div>
            )}
            {(product.delivery_charge === 0 || !product.delivery_charge) && (
                <div style={{ marginBottom: '1.5rem', color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    <i className="fas fa-truck"></i> Free Delivery
                </div>
            )}

            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>{product.description}</p>

            {product.custom_fields && product.custom_fields.length > 0 && (
                <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {product.custom_fields.map((cf: any, idx: number) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{cf.label}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{cf.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {product.features && product.features.length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#e2e8f0' }}>Highlights</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {product.features.map((feat: string, idx: number) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#cbd5e1' }}>
                                <i className="fas fa-check" style={{ color: '#38bdf8', marginTop: '4px' }}></i> {feat}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {effectiveStock !== null && effectiveStock > 0 && (
                <div style={{ marginBottom: '1.5rem', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-fire"></i> Only {effectiveStock} left in stock!
                </div>
            )}
            
            {isOutOfStock && product.stock_refill_note && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', color: '#fca5a5' }}>
                    <i className="fas fa-info-circle"></i> {product.stock_refill_note}
                </div>
            )}

            {product.expected_delivery && (
                <div style={{ marginBottom: '1.5rem', color: '#94a3b8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-truck"></i> Expected Delivery: <strong style={{ color: 'white' }}>{product.expected_delivery}</strong>
                </div>
            )}

            <button 
                onClick={handleBuyNow} 
                disabled={paying || isHolding || isOutOfStock}
                style={{
                    marginTop: 'auto',
                    width: '100%',
                    padding: '1.25rem',
                    background: isOutOfStock ? '#475569' : 'linear-gradient(to right, #2563eb, #3b82f6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: isOutOfStock || paying || isHolding ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: isOutOfStock ? 'none' : '0 10px 25px rgba(59,130,246,0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
            >
                {paying || isHolding ? <i className="fas fa-spinner fa-spin"></i> : (isOutOfStock ? 'Out of Stock' : <><i className="fas fa-shopping-cart"></i> Buy Now - ₹{product.price + (product.delivery_charge || 0)}</>)}
            </button>
        </div>
    );

    const policiesBlock = (
        <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-shield-alt" style={{ color: '#38bdf8' }}></i> Store Policies
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <i className="fas fa-ban" style={{ color: '#ef4444', fontSize: '1.25rem', marginTop: '4px' }}></i>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>Non-Refundable</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>All merchandise purchases are final and non-refundable.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <i className="fas fa-box-open" style={{ color: '#10b981', fontSize: '1.25rem', marginTop: '4px' }}></i>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>Defective Items</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>Exchanges are only permitted if the product arrives damaged or defective. Contact us within 48 hours.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <i className="fas fa-truck-fast" style={{ color: '#f59e0b', fontSize: '1.25rem', marginTop: '4px' }}></i>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>Delivery Time</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>Maximum estimated delivery time is up to 2 weeks from order confirmation.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <i className="fas fa-pen-to-square" style={{ color: '#8b5cf6', fontSize: '1.25rem', marginTop: '4px' }}></i>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>Order Modifications</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>Orders can be cancelled or modified before shipping. Once shipped, changes are not possible.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <i className="fas fa-map-location-dot" style={{ color: '#ec4899', fontSize: '1.25rem', marginTop: '4px' }}></i>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>Address Accuracy</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>Please ensure your address is correct. We are not responsible for misdelivered packages due to incorrect addresses.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const reviewsBlock = (
        <div style={{ marginTop: '4rem', paddingTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Customer Reviews</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    {reviews.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No reviews yet. Be the first to review this product!</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {reviews.map(rev => (
                                <div key={rev.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {rev.user_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{rev.user_name}</div>
                                            <div style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                                        </div>
                                        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.8rem' }}>
                                            {new Date(rev.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p style={{ color: '#cbd5e1', lineHeight: 1.5, margin: 0, marginTop: '1rem' }}>{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Write a Review</h3>
                    <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Your Name</label>
                            <input required type="text" value={reviewName} onChange={e => setReviewName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Rating (1-5)</label>
                            <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }}>
                                <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                                <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                                <option value={3}>⭐⭐⭐ (3/5)</option>
                                <option value={2}>⭐⭐ (2/5)</option>
                                <option value={1}>⭐ (1/5)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Review</label>
                            <textarea required value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white', resize: 'vertical' }} />
                        </div>
                        <button type="submit" style={{ padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                            Submit Review
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0e0e12', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <NavigationMenu />
            
            <div style={{ flex: 1, paddingTop: '120px', paddingBottom: '4rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
                        {layoutSections.includes('gallery') && layoutSections.indexOf('gallery') < layoutSections.indexOf('details') ? (
                            <>
                                {galleryBlock}
                                {detailsBlock}
                            </>
                        ) : (
                            <>
                                {detailsBlock}
                                {galleryBlock}
                            </>
                        )}
                    </div>

                    {policiesBlock}

                    {layoutSections.includes('reviews') && reviewsBlock}

                </div>
            </div>
            
            <Footer />

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#1e293b', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Checkout Details</h3>
                                {holdId && (
                                    <div style={{ color: '#fbbf24', fontSize: '0.9rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <i className="fas fa-clock"></i> Time remaining: {Math.floor(holdTimeLeft / 60)}:{(holdTimeLeft % 60).toString().padStart(2, '0')}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => {
                                setShowCheckoutModal(false);
                                if (holdId) {
                                    releaseHold(holdId);
                                    setHoldId(null);
                                    setHoldTimeLeft(0);
                                }
                            }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                        </div>
                        {paying ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                                <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '0.5rem' }}></div>
                                <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '0.5rem' }}></div>
                                <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '0.5rem' }}></div>
                                <div className="skeleton" style={{ height: '6rem', width: '100%', borderRadius: '0.5rem' }}></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '0.5rem' }}></div>
                                    <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '0.5rem' }}></div>
                                </div>
                                <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '0.5rem' }}></div>
                                <div className="skeleton" style={{ height: '3.5rem', width: '100%', borderRadius: '0.5rem', marginTop: '1rem' }}></div>
                            </div>
                        ) : (
                            <form onSubmit={processPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Full Name *</label>
                                    <input required value={checkoutName} onChange={e => setCheckoutName(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="John Doe" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Email Address *</label>
                                    <input required value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)} type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Phone Number *</label>
                                    <input required value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} type="tel" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="+91 9876543210" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Delivery Address *</label>
                                    <textarea required value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white', resize: 'vertical' }} placeholder="123 Main Street, Apt 4B" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>City *</label>
                                        <input required value={checkoutCity} onChange={e => setCheckoutCity(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="Mumbai" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>State *</label>
                                        <input required value={checkoutState} onChange={e => setCheckoutState(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="Maharashtra" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#cbd5e1' }}>ZIP / Postal Code *</label>
                                    <input required value={checkoutZip} onChange={e => setCheckoutZip(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="400001" />
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0', fontSize: '1rem' }}>Billing Details</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#cbd5e1' }}>
                                        <span>Base Price</span>
                                        <span>₹{product.price}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                                        <span>Delivery Charge</span>
                                        <span>{product.delivery_charge_type === 'included' || !product.delivery_charge ? 'Free' : `₹${product.delivery_charge}`}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', fontWeight: 'bold', color: 'white', fontSize: '1.1rem' }}>
                                        <span>Total</span>
                                        <span>₹{product.price + (product.delivery_charge || 0)}</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={paying} style={{ padding: '1rem', background: paying ? '#1d4ed8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', marginTop: '1rem', fontSize: '1.1rem' }}>
                                    {paying ? 'Processing...' : `Proceed to Payment (₹${product.price + (product.delivery_charge || 0)})`}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#1e293b', borderRadius: '1rem', width: '100%', maxWidth: '520px', padding: '3rem 2rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1rem' }}></i>
                        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>Order Placed!</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Your payment was successful and your order is now being processed.</p>
                        
                        <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px dashed #334155' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1', fontSize: '0.9rem' }}>YOUR ORDER ID (SAVE THIS!)</p>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700, wordBreak: 'break-all', color: '#60a5fa' }}>{successOrderId}</p>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(successOrderId);
                                        setCopiedId(true);
                                        setTimeout(() => setCopiedId(false), 2000);
                                    }}
                                    style={{ padding: '0.5rem 1rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <i className={copiedId ? "fas fa-check" : "fas fa-copy"} style={{ color: copiedId ? '#10b981' : 'inherit' }}></i> 
                                    {copiedId ? 'Copied!' : 'Copy'}
                                </button>
                                <button 
                                    onClick={() => {
                                        const blob = new Blob([`GKK Intern Merchandise Order\n\nOrder ID: ${successOrderId}\nKeep this safe for tracking your order at https://gkkintern.in/merchandise.`], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `GKK-Order-${successOrderId.substring(0,8)}.txt`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    }}
                                    style={{ padding: '0.5rem 1rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <i className="fas fa-download"></i> Download ID
                                </button>
                            </div>
                        </div>

                        {/* Download Invoice Button */}
                        <button 
                            onClick={generateInvoicePDF}
                            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
                            onMouseOver={(e) => { (e.target as HTMLElement).style.transform = 'translateY(-1px)'; (e.target as HTMLElement).style.boxShadow = '0 4px 15px rgba(16,185,129,0.4)'; }}
                            onMouseOut={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; (e.target as HTMLElement).style.boxShadow = 'none'; }}
                        >
                            <i className="fas fa-file-invoice"></i> Download Invoice (PDF)
                        </button>

                        {/* Warning before leaving */}
                        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#f59e0b', lineHeight: 1.5 }}>
                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.4rem' }}></i>
                                Please copy or download your Order ID and Invoice before leaving. These details are needed for order tracking, refunds, or exchanges.
                            </p>
                        </div>

                        <button onClick={async () => {
                            try {
                                const result = await Swal.fire({
                                    title: 'Are you sure?',
                                    html: '<p style="color:#cbd5e1;font-size:0.95rem;">Please make sure you have <b>copied your Order ID</b> or <b>downloaded the Invoice</b>.<br><br>These details are essential for:<br>• Order tracking<br>• Defective product claims<br>• Refunds & exchanges</p>',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, I have saved my details',
                                    cancelButtonText: 'Go back',
                                    background: '#1e293b',
                                    color: '#fff',
                                    confirmButtonColor: '#3b82f6',
                                    cancelButtonColor: '#475569',
                                });
                                if (result.isConfirmed) {
                                    setShowSuccessModal(false);
                                    window.location.href = '/merchandise';
                                }
                            } catch (e) {
                                setShowSuccessModal(false);
                                window.location.href = '/merchandise';
                            }
                        }} style={{ width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem' }}>
                            Back to Store
                        </button>
                    </div>
                </div>
            )}
            {/* Zoomed Image Modal */}
            {zoomedImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Controls overlay */}
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', zIndex: 10001, background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <button onClick={() => setZoomLevel(z => z + 0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', fontSize: '1.2rem' }} title="Zoom In"><i className="fas fa-search-plus"></i></button>
                        <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.5))} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', fontSize: '1.2rem' }} title="Zoom Out"><i className="fas fa-search-minus"></i></button>
                        <button onClick={() => { setZoomLevel(1); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', fontSize: '1.2rem' }} title="Reset Zoom"><i className="fas fa-compress"></i></button>
                        <button onClick={() => { setZoomedImage(null); setZoomLevel(1); }} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', fontSize: '1.2rem', marginLeft: '1rem' }} title="Close"><i className="fas fa-times"></i></button>
                    </div>

                    <div 
                        ref={scrollContainerRef}
                        style={{ 
                            flex: 1,
                            overflow: 'auto',
                            textAlign: 'center',
                            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                            userSelect: 'none'
                        }}
                        onMouseDown={(e) => {
                            if (zoomLevel > 1) {
                                setIsDragging(true);
                                setHasDragged(false);
                                setDragStart({ x: e.clientX, y: e.clientY });
                                if (scrollContainerRef.current) {
                                    setScrollStart({
                                        x: scrollContainerRef.current.scrollLeft,
                                        y: scrollContainerRef.current.scrollTop
                                    });
                                }
                            }
                        }}
                        onMouseMove={(e) => {
                            if (isDragging && scrollContainerRef.current && zoomLevel > 1) {
                                const dx = e.clientX - dragStart.x;
                                const dy = e.clientY - dragStart.y;
                                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                                    setHasDragged(true);
                                }
                                scrollContainerRef.current.scrollLeft = scrollStart.x - dx;
                                scrollContainerRef.current.scrollTop = scrollStart.y - dy;
                            }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                        onClick={() => {
                            if (!hasDragged) {
                                setZoomedImage(null);
                            }
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '2rem' }}>
                            <img 
                                src={zoomedImage} 
                                alt="Zoomed Product" 
                                draggable={false}
                                style={{ 
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: 'center center',
                                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                    maxWidth: '90vw',
                                    maxHeight: '80vh',
                                    objectFit: 'contain'
                                }} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasDragged) return;
                                    setZoomLevel(z => z === 1 ? 2.5 : 1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
