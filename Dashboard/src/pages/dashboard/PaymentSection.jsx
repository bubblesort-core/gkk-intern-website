import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardContext';

// 3D Tilt Component
const TiltCard = ({ children, className, style }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                ...style
            }}
            className={className}
        >
            <div style={{ transform: "translateZ(20px)" }}>
                {children}
            </div>
        </motion.div>
    );
};

// Slot Machine Rolling Number
const RollingNumber = ({ value }) => {
    const digits = value.toString().split('');
    return (
        <span className="rolling-number">
            {digits.map((d, i) => (
                <span key={i} className="digit-container">
                    <motion.span
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 100, 
                            damping: 15,
                            delay: 0.5 + i * 0.05 
                        }}
                    >
                        {d}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

export default function PaymentSection() {
    const { currentUser, currentProfile, isLocked, setIsLocked, setCurrentProfile, getProxiedUrl, supabase } = useDashboard();
    const [paying, setPaying] = useState(false);
    const [isPaymentLocked, setIsPaymentLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');

    const userName = currentProfile?.full_name || 'Student';
    const userEmail = currentUser?.email || 'Verifying account...';

    // Check if user is locked from payment
    useEffect(() => {
        if (!currentUser?.id || !currentUser?.email) return;

        // Initial check
        const checkPaymentLock = async () => {
            try {
                const { data, error } = await supabase
                    .from('access_controls')
                    .select('*')
                    .eq('page_identifier', '/payment')
                    .eq('is_locked', true)
                    .or(`and(target_type.eq.email,target_email.eq.${currentUser.email}),and(target_type.eq.intern,target_intern_id.eq.${currentUser.id})`);

                if (error) {
                    console.warn('Error checking payment lock:', error);
                    setIsPaymentLocked(false);
                    return;
                }

                if (data && data.length > 0) {
                    setIsPaymentLocked(true);
                    setLockReason(data[0].reason || 'Payment access locked');
                } else {
                    setIsPaymentLocked(false);
                }
            } catch (err) {
                console.error('Payment lock check error:', err);
                setIsPaymentLocked(false);
            }
        };

        checkPaymentLock();

        // Subscribe to real-time changes on access_controls table
        const subscription = supabase
            .channel('payment_locks')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'access_controls',
                    filter: `page_identifier=eq./payment AND is_locked=eq.true`
                },
                async (payload) => {
                    // Check if this lock applies to current user
                    if (payload.new.target_type === 'email' && payload.new.target_email === currentUser.email) {
                        setIsPaymentLocked(true);
                        setLockReason(payload.new.reason || 'Payment access locked');
                    } else if (payload.new.target_type === 'intern' && payload.new.target_intern_id === currentUser.id) {
                        setIsPaymentLocked(true);
                        setLockReason(payload.new.reason || 'Payment access locked');
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUser?.id, currentUser?.email, supabase]);

    useEffect(() => {
        const handler = () => {
            window.location.reload(); // fallback: reload page to refresh payment status
        };
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, []);

    const initiatePayment = useCallback(async () => {
        if (paying) return;
        setPaying(true);

        try {
            // Ensure Razorpay SDK is loaded
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
                    document.head.appendChild(script);
                });
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            // Create order via edge function — must include all required fields
            const orderRes = await fetch(window.location.origin + '/supabase-main/functions/v1/razorpay-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    email: currentUser.email || currentProfile?.email || '',
                    phone: currentProfile?.phone || '',
                    full_name: currentProfile?.full_name || '',
                    application_id: 'training_fee_unlock',
                    amount: 50929 // ₹509.29 (in paise)
                })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to create order');
            }
            const orderData = await orderRes.json();

            // Open Razorpay checkout
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: 'GKK INTERN',
                description: 'Training Fee (₹499) + Gateway Charges',
                order_id: orderData.order_id,
                handler: async (response) => {
                    // Verify payment — this activates profile, which triggers
                    // the gear animation via DashboardLayout's isLocked transition
                    try {
                        await fetch(window.location.origin + '/supabase-main/functions/v1/razorpay-verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        // Set justPaid flag for unlock animation
                        localStorage.setItem('gkk_just_paid', 'true');
                    } catch (err) {
                        // Webhook will handle activation as fallback — no alert needed
                        console.error('Payment verification error:', err);
                    }
                },
                prefill: orderData.prefill || {
                    name: userName,
                    email: userEmail
                },
                theme: { color: '#10b981' },
                modal: {
                    ondismiss: () => setPaying(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', async (response) => {
                const Swal = (await import('sweetalert2')).default;
                Swal.fire({ icon: 'error', title: 'Payment Failed', text: response.error.description || 'Please try again.' });
                setPaying(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Payment initiation error:', err);
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not initiate payment.' });
            setPaying(false);
        }
    }, [paying, supabase, userName, userEmail]);

    return (
        <div className="dash-checkout">
            {isPaymentLocked ? (
                // Locked Payment Message
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="dash-card"
                        style={{
                            maxWidth: '500px',
                            padding: '60px 40px',
                            textAlign: 'center',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ marginBottom: '20px' }}
                        >
                            <i className="fas fa-lock" style={{ fontSize: '64px', color: '#ef4444' }} />
                        </motion.div>
                        
                        <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#fff' }}>
                            Payment Access Locked
                        </h2>
                        
                        <p style={{ fontSize: '16px', color: '#9ca3af', marginBottom: '24px', lineHeight: '1.6' }}>
                            You did not complete your payment within the required timeframe. Your payment access has been temporarily locked.
                        </p>

                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '32px',
                            textAlign: 'left'
                        }}>
                            <p style={{ fontSize: '14px', color: '#fca5a5', margin: '0' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '8px' }} />
                                <strong>What happened:</strong> Payment deadline has passed. To unlock your access, please contact the admin.
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                window.location.href = 'mailto:noreplay.gkk26@gmail.com?subject=Payment Access Unlock Request';
                            }}
                            style={{
                                width: '100%',
                                padding: '12px 24px',
                                fontSize: '16px',
                                fontWeight: '600',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '12px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <i className="fas fa-envelope" style={{ marginRight: '8px' }} />
                            Contact Admin
                        </motion.button>

                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                            Email: <strong>noreplay.gkk26@gmail.com</strong>
                        </p>
                    </motion.div>
                </div>
            ) : (
                // Normal Payment Form
                <>
            {/* Left: Plan Details (40% split) */}
            <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="payment-split-left"
            >
                <TiltCard className="dash-card payment-plan-card">
                    <div className="plan-card-stripes" />
                    <div className="payment-logo-header">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: 0.5 }}
                            className="payment-logo-icon"
                        >
                            <img src="/assets/gkk-intern-logo.png" alt="GKK" />
                        </motion.div>
                        <h2 className="payment-brand-title">GKK INTERN</h2>
                    </div>

                    <div className="payment-plan-panel">
                        <div className="plan-header-row">
                            <span className="plan-label">Internship Program</span>
                            <span className="plan-price">₹499</span>
                        </div>
                        <div className="plan-badge">
                            <i className="fas fa-bolt" /> Standard Plan
                        </div>

                        <div className="plan-features timeline-style">
                            <div className="timeline-line" />
                            {[
                                'Live Project Experience',
                                'Team Collaboration Tools',
                                'Senior Mentorship',
                                'Completion Certificate'
                            ].map((feature, idx) => (
                                <motion.div 
                                    key={feature} 
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + idx * 0.1 }}
                                    className="plan-feature-row"
                                >
                                    <div className="timeline-dot" />
                                    <i className="fas fa-check-circle check-animate" /> 
                                    <span>{feature}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="plan-divider" />
                        
                        <div className="plan-total-row">
                            <span className="total-label">Total Payable</span>
                            <span className="total-amount">₹<RollingNumber value="509.29" /></span>
                        </div>
                        <div className="plan-fine-print">
                            *Includes GST & Platform Fees
                        </div>
                    </div>
                </TiltCard>
            </motion.div>

            {/* Right: Payment Details (60% split) */}
            <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="payment-split-right"
            >
                <div className="payment-radial-glow" />
                <TiltCard className="dash-card payment-action-card">
                    <div className="security-tag">
                        <i className="fas fa-lock" /> Secure 256-bit SSL Encrypted
                    </div>

                    <div className="payment-user-chip">
                        <div className="user-avatar-square">
                            <img src="/assets/gkk-intern-logo.png" alt="GKK" />
                        </div>
                        <div className="user-text">
                            <h4 className="user-name">{userName}</h4>
                            <p className="user-email">{userEmail}</p>
                        </div>
                    </div>

                    <h3 className="payment-heading">Complete Payment</h3>
                    <p className="payment-subtext">
                        Securely pay via Razorpay to instantiate your workspace and unlock full access.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="payment-cta-btn"
                        onClick={initiatePayment}
                        disabled={paying}
                    >
                        <span className="shimmer-sweep" />
                        {paying ? (
                            <><i className="fas fa-spinner fa-spin" /> Processing...</>
                        ) : (
                            <><i className="fas fa-lock" /> Pay ₹509.29 Securely</>
                        )}
                    </motion.button>

                    <div className="payment-footer">
                        <div className="powered-by">
                            <motion.i 
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="fas fa-shield-alt" 
                            /> Powered by Razorpay & SSL Security
                        </div>
                        <div className="safe-checkout-note">
                            Guaranteed safe & secure checkout
                        </div>
                        <div className="payment-icons">
                            <motion.i whileHover={{ y: -3, filter: "brightness(1.5)" }} className="fab fa-cc-visa" title="Visa" />
                            <motion.i whileHover={{ y: -3, filter: "brightness(1.5)" }} className="fab fa-cc-mastercard" title="Mastercard" />
                            <motion.i whileHover={{ y: -3, filter: "brightness(1.5)" }} className="fab fa-google-pay" title="Google Pay" />
                            <motion.i whileHover={{ y: -3, filter: "brightness(1.5)" }} className="fas fa-shield-check" title="Secure" />
                        </div>
                    </div>
                </TiltCard>
            </motion.div>
                </>
            )}
        </div>
    );
}
