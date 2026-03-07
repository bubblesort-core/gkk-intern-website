import React, { useState, useCallback, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

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
                    amount: 100 // TEST: 1 INR (100 paise)
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
            {/* Left: Order Summary */}
            <div className="dash-card">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: 60, height: 60, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/assets/gkk-intern-logo.png" alt="GKK" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>GKK INTERN</div>
                </div>

                <div className="dash-card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Internship Program</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>₹499</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '0.25rem 0.75rem', borderRadius: 50, fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>
                            <i className="fas fa-bolt" style={{ fontSize: '0.7rem', marginRight: 4 }} /> Standard Plan
                        </span>
                    </div>

                    {['Live Project Experience', 'Team Collaboration Tools', 'Senior Mentorship', 'Completion Certificate'].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', color: 'var(--dash-text-secondary)', fontSize: '0.9rem' }}>
                            <i className="fas fa-check-circle" style={{ color: '#10b981' }} /> <span>{f}</span>
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--dash-border)' }}>
                        <span style={{ fontWeight: 600 }}>Total Payable</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>₹509.29</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--dash-text-muted)', opacity: 0.7, fontFamily: "'JetBrains Mono', monospace" }}>
                        *Includes GST & Platform Fees
                    </div>
                </div>
            </div>

            {/* Right: Payment Details */}
            <div className="dash-card">
                <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--dash-text-secondary)' }}>
                    <i className="fas fa-lock" style={{ marginRight: 4 }} /> Secure 256-bit SSL Encrypted
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--dash-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-muted)', overflow: 'hidden' }}>
                        {currentProfile?.avatar_url
                            ? <img src={getProxiedUrl(currentProfile.avatar_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <i className="fas fa-user" />}
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: 'white' }}>{userName}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dash-text-secondary)' }}>{userEmail}</p>
                    </div>
                </div>

                <h3 style={{ marginBottom: '0.5rem' }}>Complete Payment</h3>
                <p style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Securely pay via Razorpay to instantiate your workspace and unlock full access.
                </p>

                <button
                    className="dash-btn dash-btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '1rem 2rem' }}
                    onClick={initiatePayment}
                    disabled={paying}
                >
                    {paying ? (
                        <><i className="fas fa-spinner fa-spin" /> Processing...</>
                    ) : (
                        <><i className="fas fa-lock" /> Pay ₹509.29 Securely</>
                    )}
                </button>
                <p style={{ fontSize: '0.78rem', color: 'var(--dash-text-muted)', marginTop: '0.75rem', textAlign: 'center', opacity: 0.8 }}>
                    <i className="fas fa-shield-alt" style={{ marginRight: 4 }} />
                    Powered by Razorpay &bull; 256-bit SSL Encrypted
                </p>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>
                    Guaranteed safe & secure checkout
                </div>

                <div className="dash-trust-badges">
                    <i className="fab fa-cc-visa" />
                    <i className="fab fa-cc-mastercard" />
                    <i className="fab fa-google-pay" />
                    <i className="fas fa-shield-alt" />
                </div>
            </div>
        </div>
    );
}
