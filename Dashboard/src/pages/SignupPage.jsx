import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabaseClient';
import OtpModal from '../components/OtpModal';
import UseAnimations from 'react-useanimations';
import arrowLeftCircle from 'react-useanimations/lib/arrowLeftCircle';
import activity from 'react-useanimations/lib/activity';
import lock from 'react-useanimations/lib/lock';
import '../styles/auth.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
    const navigate = useNavigate();

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [terms, setTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validation state
    const [emailStatus, setEmailStatus] = useState({ show: false, type: '', message: '' });
    const [referralStatus, setReferralStatus] = useState({ show: false, type: '', message: '' });
    const [confirmStatus, setConfirmStatus] = useState({ show: false, type: '', message: '' });
    const [showSecureFields, setShowSecureFields] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ width: 0, color: '', text: '', className: '' });

    // Referral data
    const [validReferralCode, setValidReferralCode] = useState(null);
    const [validReferralId, setValidReferralId] = useState(null);

    // Loading / OTP state
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [pendingSignupData, setPendingSignupData] = useState(null);

    // Debounce refs
    const emailTimer = useRef(null);
    const referralTimer = useRef(null);

    // Force logout on mount
    useEffect(() => {
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase.auth.signOut();
                    localStorage.clear();
                }
            } catch (e) { /* ignore */ }
        })();
    }, []);

    // Email check (debounced)
    useEffect(() => {
        if (emailTimer.current) clearTimeout(emailTimer.current);

        if (!email.trim()) {
            setEmailStatus({ show: false, type: '', message: '' });
            setShowSecureFields(false);
            return;
        }

        if (!emailRegex.test(email)) {
            setEmailStatus({ show: true, type: 'error', message: 'Invalid email format' });
            setShowSecureFields(false);
            return;
        }

        emailTimer.current = setTimeout(async () => {
            try {
                const { data: approvedApps, error } = await supabase
                    .from('applications')
                    .select('status, full_name')
                    .ilike('email', email.trim())
                    .ilike('status', 'approved')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) throw error;
                const approved = approvedApps?.[0];

                if (approved) {
                    setEmailStatus({ show: true, type: 'success', message: `Approved! Welcome, ${approved.full_name.split(' ')[0]}` });
                    setShowSecureFields(true);
                    if (!firstName && !lastName) {
                        const parts = approved.full_name.split(' ');
                        setFirstName(parts[0] || '');
                        setLastName(parts.slice(1).join(' ') || '');
                    }
                } else {
                    setShowSecureFields(false);

                    const { data: statusRows } = await supabase
                        .from('applications')
                        .select('status')
                        .ilike('email', email.trim())
                        .order('created_at', { ascending: false })
                        .limit(1);

                    const latest = statusRows?.[0];

                    if (latest) {
                        setEmailStatus({ show: true, type: 'error', message: `Status: ${latest.status} (Not Approved)` });

                        if (latest.status === 'shortlisted') {
                            Swal.fire({ title: 'Application Shortlisted', text: 'Great news! You are shortlisted. However, you need to be fully "Approved" to create an account.', icon: 'info', background: '#1e293b', color: '#f1f5f9' });
                        } else if (latest.status === 'ready_interview') {
                            Swal.fire({ title: 'Ready for Interview', text: 'You are selected for an interview! Please check your email for the schedule.', icon: 'info', background: '#1e293b', color: '#f1f5f9' });
                        } else if (latest.status === 'rejected') {
                            Swal.fire({ title: 'Application Status', text: 'Unfortunately, your application was not selected.', icon: 'error', background: '#1e293b', color: '#f1f5f9' });
                        } else {
                            Swal.fire({ title: 'Pending Approval', html: `Your application status is currently: <strong>${latest.status}</strong>. Please wait for approval.`, icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
                        }
                    } else {
                        setEmailStatus({ show: true, type: 'error', message: 'No application found' });
                        Swal.fire({
                            title: 'Application Not Found',
                            text: 'We could not find an application with this email. Please apply first.',
                            icon: 'warning',
                            confirmButtonText: 'Go to Apply',
                            showCancelButton: true,
                            cancelButtonText: 'Close',
                            background: '#1e293b',
                            color: '#f1f5f9',
                        }).then((result) => {
                            if (result.isConfirmed) window.location.href = '/apply/';
                        });
                    }
                }
            } catch (e) { /* ignore */ }
        }, 500);
    }, [email]);

    // Referral check (debounced)
    useEffect(() => {
        if (referralTimer.current) clearTimeout(referralTimer.current);

        if (!referralCode.trim()) {
            setReferralStatus({ show: false, type: '', message: '' });
            setValidReferralCode(null);
            setValidReferralId(null);
            return;
        }

        referralTimer.current = setTimeout(async () => {
            try {
                const { data, error } = await supabase.rpc('validate_referral_code', { code_input: referralCode.trim() });
                if (error) throw error;
                const result = data?.[0];
                if (result?.valid) {
                    setReferralStatus({ show: true, type: 'success', message: 'Valid! You will unlock special rewards after completing registration' });
                    setValidReferralCode(referralCode.trim());
                    setValidReferralId(result.referrer_id);
                } else {
                    setReferralStatus({ show: true, type: 'error', message: 'Invalid code' });
                    setValidReferralCode(null);
                    setValidReferralId(null);
                }
            } catch (e) {
                setReferralStatus({ show: true, type: 'error', message: 'Error verifying code' });
            }
        }, 500);
    }, [referralCode]);

    // Password strength
    useEffect(() => {
        if (!password) { setPasswordStrength({ width: 0, color: '', text: '', className: '' }); return; }

        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        if (strength <= 25) setPasswordStrength({ width: strength, color: '#ef4444', text: 'Weak', className: 'weak' });
        else if (strength <= 50) setPasswordStrength({ width: strength, color: '#f59e0b', text: 'Fair', className: 'medium' });
        else if (strength <= 75) setPasswordStrength({ width: strength, color: '#3b82f6', text: 'Good', className: '' });
        else setPasswordStrength({ width: strength, color: '#10b981', text: 'Strong', className: 'strong' });
    }, [password]);

    // Confirm password check
    useEffect(() => {
        if (!confirmPassword) { setConfirmStatus({ show: false, type: '', message: '' }); return; }
        if (password !== confirmPassword) {
            setConfirmStatus({ show: true, type: 'error', message: "Passwords don't match" });
        } else {
            setConfirmStatus({ show: true, type: 'success', message: 'Passwords match' });
        }
    }, [password, confirmPassword]);

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            Swal.fire({ title: 'Error', text: 'Please fill in all fields', icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
            return;
        }
        if (!terms) {
            Swal.fire({ title: 'Error', text: 'Please accept the Terms of Service', icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
            return;
        }
        if (!emailRegex.test(email)) {
            Swal.fire({ title: 'Error', text: 'Please enter a valid email address', icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
            return;
        }
        if (password.length < 6) {
            Swal.fire({ title: 'Error', text: 'Password must be at least 6 characters', icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
            return;
        }
        if (password !== confirmPassword) {
            Swal.fire({ title: 'Error', text: 'Passwords do not match', icon: 'error', background: '#1e293b', color: '#f1f5f9' });
            return;
        }

        // Force referral validation if entered but not validated
        if (referralCode.trim() && !validReferralId) {
            setIsLoading(true);
            setLoadingText('Checking Referral...');
            try {
                const { data } = await supabase.rpc('validate_referral_code', { code_input: referralCode.trim() });
                const result = data?.[0];
                if (result?.valid) {
                    setValidReferralCode(referralCode.trim());
                    setValidReferralId(result.referrer_id);
                } else {
                    setIsLoading(false);
                    Swal.fire({ title: 'Invalid Referral Code', text: 'The referral code is invalid. Check it or leave it empty.', icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
                    return;
                }
            } catch (err) { /* proceed without referral */ }
        }

        // Pre-flight check
        setIsLoading(true);
        setLoadingText('Checking Status...');

        try {
            const { data: approvedApps, error: approvedError } = await supabase
                .from('applications')
                .select('status')
                .ilike('email', email.trim())
                .ilike('status', 'approved')
                .order('created_at', { ascending: false })
                .limit(1);

            if (approvedError) throw approvedError;

            if (!approvedApps?.[0]) {
                const { data: statusRows } = await supabase
                    .from('applications')
                    .select('status')
                    .ilike('email', email.trim())
                    .order('created_at', { ascending: false })
                    .limit(1);

                const status = statusRows?.[0]?.status;

                if (!status) {
                    Swal.fire({
                        title: 'Application Not Found',
                        text: 'We could not find an application with this email. Please apply first.',
                        icon: 'warning',
                        confirmButtonText: 'Go to Apply',
                        showCancelButton: true,
                        background: '#1e293b', color: '#f1f5f9',
                    }).then((result) => { if (result.isConfirmed) window.location.href = '/apply/'; });
                } else if (status === 'shortlisted') {
                    Swal.fire({ title: 'Application Shortlisted', text: 'You are shortlisted but need full Approval to create an account.', icon: 'info', background: '#1e293b', color: '#f1f5f9' });
                } else if (status === 'ready_interview') {
                    Swal.fire({ title: 'Ready for Interview', text: 'Check your email for the interview schedule.', icon: 'info', background: '#1e293b', color: '#f1f5f9' });
                } else if (status === 'rejected') {
                    Swal.fire({ title: 'Application Status', text: 'Unfortunately, your application was not selected.', icon: 'error', background: '#1e293b', color: '#f1f5f9' });
                } else {
                    Swal.fire({ title: 'Pending Approval', html: `Status: <strong>${status}</strong>. Please wait for approval.`, icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
                }

                setIsLoading(false);
                return;
            }
        } catch (e) { /* proceed as fallback */ }

        // Send OTP
        setLoadingText('Sending OTP...');
        const fullName = `${firstName} ${lastName}`.trim();

        try {
            const signupData = { email: email.trim(), password, firstName, lastName, fullName };
            setPendingSignupData(signupData);

            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    shouldCreateUser: true,
                    data: {
                        full_name: fullName,
                        first_name: firstName,
                        last_name: lastName,
                        referrer_id: validReferralId,
                        signup_pending: true,
                    },
                },
            });

            if (error) throw error;

            Swal.fire({ title: 'Verification Code Sent!', text: `Check your email ${email}`, icon: 'success', timer: 2500, showConfirmButton: false, background: '#1e293b', color: '#f1f5f9' });
            setShowOtpModal(true);
        } catch (error) {
            let msg = error.message;

            if ((error.status === 422) || msg.includes('422') || msg.includes('security purposes')) {
                Swal.fire({ title: 'Please Wait', text: 'Too many OTP requests. Please wait a few minutes.', icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
            } else if (msg.includes('403') || msg.includes('hook')) {
                Swal.fire({ title: 'Access Restricted', html: 'Your application status does not allow signup at this time.<br>Only <b>Approved</b> candidates can create an account.', icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
            } else if (msg.includes('Access Denied')) {
                if (msg.includes('No application found')) {
                    Swal.fire({ title: 'Application Not Found', text: 'Please apply first.', icon: 'warning', confirmButtonText: 'Go to Apply', showCancelButton: true, background: '#1e293b', color: '#f1f5f9' }).then(r => { if (r.isConfirmed) window.location.href = '/apply/'; });
                } else {
                    Swal.fire({ title: 'Access Restricted', text: msg, icon: 'warning', background: '#1e293b', color: '#f1f5f9' });
                }
            } else {
                Swal.fire({ icon: 'error', title: 'Failed to Send OTP', text: msg, confirmButtonColor: '#ef4444', background: '#1e293b', color: '#f1f5f9' });
            }
            setPendingSignupData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // OTP Verify
    const handleOtpVerify = useCallback(async (code) => {
        if (!pendingSignupData) throw new Error('Session expired');

        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            email: pendingSignupData.email,
            token: code,
            type: 'email',
        });

        if (verifyError) throw verifyError;

        Swal.fire({ title: 'OTP Verified!', text: 'Setting up your account...', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#f1f5f9' });

        // Set password
        await supabase.auth.updateUser({
            password: pendingSignupData.password,
            data: {
                full_name: pendingSignupData.fullName,
                first_name: pendingSignupData.firstName,
                last_name: pendingSignupData.lastName,
                signup_pending: false,
            },
        });

        // Create profile
        const userId = verifyData?.user?.id || verifyData?.session?.user?.id;
        if (userId) {
            const { error: profileError, data: profileResp } = await supabase.functions.invoke('create-profile', {
                body: {
                    user_id: userId,
                    email: pendingSignupData.email,
                    full_name: pendingSignupData.fullName,
                    referrer_id: validReferralId || null,
                },
            });
            if (profileError || profileResp?.error) throw profileError || new Error(profileResp?.error || 'Profile creation failed');
        } else {
            throw new Error('Failed to resolve user after OTP verification');
        }

        // Claim referral
        if (validReferralCode) {
            try { await supabase.rpc('claim_referral', { code_used: validReferralCode }); } catch (e) { /* ignore */ }
        }

        setPendingSignupData(null);
        setShowOtpModal(false);

        await Swal.fire({ title: 'Account Created!', text: 'Welcome to GKK INTERN! Redirecting to login...', icon: 'success', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#f1f5f9' });
        navigate('/user/login');
    }, [pendingSignupData, validReferralCode, validReferralId, navigate]);

    // OTP Resend
    const handleOtpResend = useCallback(async () => {
        if (!pendingSignupData) return;
        const { error } = await supabase.auth.signInWithOtp({
            email: pendingSignupData.email,
            options: {
                shouldCreateUser: true,
                data: {
                    full_name: pendingSignupData.fullName,
                    first_name: pendingSignupData.firstName,
                    last_name: pendingSignupData.lastName,
                    signup_pending: true,
                },
            },
        });
        if (error) throw error;
        Swal.fire({ title: 'Code Resent!', text: 'Check your email for the new OTP.', icon: 'success', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#f1f5f9' });
    }, [pendingSignupData]);

    return (
        <div className="auth-page">
            <Link to="/" className="auth-back-btn" title="Back to Home">
                <UseAnimations animation={arrowLeftCircle} size={28} strokeColor="currentColor" autoplay={true} loop={true} speed={0.3} />
            </Link>

            <div className="auth-wrapper signup">
                {/* Form Panel */}
                <div className="auth-form-panel">
                    <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-body)', marginBottom: '2rem' }}>Join GKK INTERN to start your internship.</p>

                    {/* Notice */}
                    <div className="notice-box">
                        <i className="fas fa-info-circle notice-icon"></i>
                        <div>
                            <strong>Approved Interns Only</strong>
                            <p>You must have an approved application to register. Use the email you applied with.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Name Row */}
                        <div className="form-row">
                            <div className="pro-form-group">
                                <label className="pro-form-label" htmlFor="signup-firstName">First Name</label>
                                <input type="text" id="signup-firstName" className="pro-form-input" placeholder="John"
                                    value={firstName} onChange={e => setFirstName(e.target.value)} required />
                            </div>
                            <div className="pro-form-group">
                                <label className="pro-form-label" htmlFor="signup-lastName">Last Name</label>
                                <input type="text" id="signup-lastName" className="pro-form-input" placeholder="Doe"
                                    value={lastName} onChange={e => setLastName(e.target.value)} required />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="pro-form-group">
                            <label className="pro-form-label" htmlFor="signup-email">Email</label>
                            <input type="email" id="signup-email" className="pro-form-input" placeholder="john@example.com"
                                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                            {emailStatus.show && (
                                <div className={`validation-msg show ${emailStatus.type}`}>
                                    <i className={`fas fa-${emailStatus.type === 'success' ? 'check-circle' : 'times-circle'}`}></i>
                                    <span>{emailStatus.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Referral */}
                        <div className="pro-form-group">
                            <label className="pro-form-label" htmlFor="signup-referral">Referral Code (Optional)</label>
                            <input type="text" id="signup-referral" className="pro-form-input" placeholder="e.g. GKKJohn12345"
                                value={referralCode} onChange={e => setReferralCode(e.target.value)} />
                            {referralStatus.show && (
                                <div className={`validation-msg show ${referralStatus.type}`}>
                                    <i className={`fas fa-${referralStatus.type === 'success' ? 'check-circle' : 'times-circle'}`}></i>
                                    <span>{referralStatus.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Secure Fields (shown after email approval) */}
                        {showSecureFields && (
                            <div className="auth-fade-in">
                                {/* Password */}
                                <div className="pro-form-group">
                                    <label className="pro-form-label" htmlFor="signup-password">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPassword ? 'text' : 'password'} id="signup-password"
                                            className="pro-form-input" placeholder="••••••••"
                                            value={password} onChange={e => setPassword(e.target.value)} required />
                                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                            <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                                        </button>
                                    </div>
                                    {password && (
                                        <div className="password-strength">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <span>Strength</span>
                                                <span style={{ color: passwordStrength.color }}>{passwordStrength.text}</span>
                                            </div>
                                            <div className="strength-bar-container">
                                                <div className={`strength-bar ${passwordStrength.className}`}
                                                    style={{ width: `${passwordStrength.width}%`, backgroundColor: passwordStrength.color }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="pro-form-group">
                                    <label className="pro-form-label" htmlFor="signup-confirm">Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showConfirmPassword ? 'text' : 'password'} id="signup-confirm"
                                            className="pro-form-input" placeholder="••••••••"
                                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                        <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                                        </button>
                                    </div>
                                    {confirmStatus.show && (
                                        <div className={`validation-msg show ${confirmStatus.type}`}>
                                            <i className={`fas fa-${confirmStatus.type === 'success' ? 'check-circle' : 'times-circle'}`}></i>
                                            <span>{confirmStatus.message}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Terms */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <input type="checkbox" id="signup-terms" checked={terms} onChange={e => setTerms(e.target.checked)}
                                        style={{ marginTop: '0.25rem', accentColor: 'var(--primary)' }} />
                                    <label htmlFor="signup-terms" style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                                        I agree to the <a href="#" style={{ color: 'var(--primary)', fontWeight: 500 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', fontWeight: 500 }}>Privacy Policy</a>.
                                    </label>
                                </div>

                                {/* Submit */}
                                <button type="submit" className="pro-btn pro-btn-primary magnetic-btn" style={{ width: '100%' }} disabled={isLoading}>
                                    {isLoading ? (
                                        <><i className="fas fa-spinner fa-spin"></i> {loadingText}</>
                                    ) : (
                                        <><i className="fas fa-paper-plane" style={{ marginRight: '0.5rem' }}></i> Send Verification Code</>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-body)' }}>
                        Already have an account? <Link to="/user/login" style={{ color: 'var(--text-main)', fontWeight: 600 }}>Sign in</Link>
                    </div>
                </div>

                {/* Branding Panel */}
                <div className="auth-branding">
                    <div className="brand-logo">
                        <img src="/assets/gkk-intern-logo.png" alt="GKK INTERN" style={{ height: '100px', width: 'auto' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Start Your Journey</h2>
                    <p style={{ color: 'var(--text-body)', marginBottom: '2rem' }}>
                        Follow these simple steps to get started with your professional internship program.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="signup-step">
                            <div className="signup-step-number done">✓</div>
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Apply</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Submit application</p>
                            </div>
                        </div>
                        <div className="signup-step">
                            <div className="signup-step-number done">✓</div>
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Approval</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Wait for review</p>
                            </div>
                        </div>
                        <div className="signup-step">
                            <div className="signup-step-number active">3</div>
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Register</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Create your account</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* OTP Modal */}
            <OtpModal
                show={showOtpModal}
                email={pendingSignupData?.email || ''}
                onVerify={handleOtpVerify}
                onResend={handleOtpResend}
                onClose={() => { setShowOtpModal(false); setPendingSignupData(null); }}
            />
        </div>
    );
}
