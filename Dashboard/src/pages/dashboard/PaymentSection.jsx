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

    const userName = currentProfile?.full_name || 'Student';
    const userEmail = currentUser?.email || 'Verifying account...';

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
        </div>
    );
}
