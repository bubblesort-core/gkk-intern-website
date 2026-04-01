import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabaseClient';
import UseAnimations from 'react-useanimations';
import arrowLeftCircle from 'react-useanimations/lib/arrowLeftCircle';
import lock from 'react-useanimations/lib/lock';
import activity from 'react-useanimations/lib/activity';
import '../styles/auth.css';

const NEW_USER_KEY = 'gkk_returning_user';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const hasShownNewUserPrompt = useRef(false);

    // Check existing session on mount
    useEffect(() => {
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const expiresAt = localStorage.getItem('gkk_session_expiry');
                if (expiresAt && Date.now() > parseInt(expiresAt)) {
                    await supabase.auth.signOut();
                    localStorage.removeItem('gkk_session_expiry');
                    return;
                }

                const { data: adminData } = await supabase
                    .from('admins')
                    .select('id')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (adminData) {
                    window.location.replace('/admin/index.html');
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('status')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profile && profile.status !== 'suspended') {
                        window.location.replace('/dashboard/home');
                    }
                }
            }
        }
        checkSession();

        // Load remembered email
        const savedEmail = localStorage.getItem('gkk_remember_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    // New user prompt
    const showNewUserPrompt = () => {
        if (hasShownNewUserPrompt.current || localStorage.getItem(NEW_USER_KEY)) return;
        hasShownNewUserPrompt.current = true;

        Swal.fire({
            title: '👋 New here?',
            html: `
                <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 0.5rem;">
                    Have you created an account yet?
                </p>
                <p style="color: #64748b; font-size: 0.85rem;">
                    You need to sign up first before you can log in.
                </p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, I have an account',
            cancelButtonText: 'Create Account',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6366f1',
            reverseButtons: true,
            background: '#1e293b',
            color: '#f1f5f9',
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.setItem(NEW_USER_KEY, 'true');
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                navigate('/user/signup');
            }
        });
    };

    // Forgot password
    const handleForgotPassword = (e) => {
        e.preventDefault();

        // Rate limiting check
        const lastSent = localStorage.getItem('gkk_forgot_password_last_sent');
        const COOLDOWN = 60000; // 60 seconds
        if (lastSent && Date.now() - parseInt(lastSent) < COOLDOWN) {
            const timeLeft = Math.ceil((COOLDOWN - (Date.now() - parseInt(lastSent))) / 1000);
            Swal.fire({
                icon: 'info',
                title: 'Please Wait',
                text: `You can request another reset link in ${timeLeft} seconds.`,
                confirmButtonColor: '#6366f1',
                background: '#1e293b',
                color: '#f1f5f9',
            });
            return;
        }

        Swal.fire({
            title: 'Reset Password',
            text: 'Enter your email to receive instructions',
            input: 'email',
            inputValue: email,
            confirmButtonColor: '#10b981',
            showCancelButton: true,
            confirmButtonText: 'Send Reset Link',
            showLoaderOnConfirm: true,
            background: '#1e293b',
            color: '#f1f5f9',
            preConfirm: async (inputEmail) => {
                try {
                    const { error } = await supabase.auth.resetPasswordForEmail(inputEmail.trim(), {
                        redirectTo: `${window.location.origin}/user/update-password.html`,
                    });
                    
                    if (error) {
                        if (error.message.includes('Failed to reach hook') || error.message.includes('5.000000 seconds')) {
                            return { email: inputEmail.trim(), timeout: true };
                        }
                        throw error;
                    }

                    localStorage.setItem('gkk_forgot_password_last_sent', Date.now().toString());
                    return { email: inputEmail.trim(), success: true };
                } catch (error) {
                    Swal.showValidationMessage(`Request failed: ${error.message}`);
                }
            },
            allowOutsideClick: () => !Swal.isLoading(),
        }).then((result) => {
            if (result.isConfirmed) {
                const userEmail = result.value.email || email; // Adjust based on return object
                const isTimeout = result.value.timeout;

                Swal.fire({
                    title: isTimeout ? 'Request in Progress' : 'Request Sent',
                    html: `
                        <p style="margin-bottom: 1rem;">${isTimeout 
                            ? 'The request is taking longer than expected, but your code is likely on its way.' 
                            : 'Check your email for the reset instructions.'}</p>
                        <p style="font-size: 0.85rem; color: #94a3b8;">Redirecting you to the update page...</p>
                    `,
                    icon: isTimeout ? 'info' : 'success',
                    timer: isTimeout ? 4000 : 2000,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#f1f5f9',
                }).then(() => {
                    const encodedEmail = encodeURIComponent(userEmail || '');
                    window.location.href = `/user/update-password.html?email=${encodedEmail}`;
                });
            }
        });
    };

    // Login submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            Swal.fire({ icon: 'warning', title: 'Missing Details', text: 'Please enter both email and password', confirmButtonColor: '#f59e0b', background: '#1e293b', color: '#f1f5f9' });
            return;
        }

        if (rememberMe) {
            localStorage.setItem('gkk_remember_email', email);
            localStorage.setItem('gkk_session_expiry', Date.now() + (30 * 24 * 60 * 60 * 1000));
        } else {
            localStorage.removeItem('gkk_remember_email');
            localStorage.setItem('gkk_session_expiry', Date.now() + (24 * 60 * 60 * 1000));
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (error) {
                if (error.message === 'Invalid login credentials') throw new Error("Incorrect email or password.");
                throw error;
            }

            // 1. Check if user is an admin
            const { data: adminData } = await supabase
                .from('admins')
                .select('id')
                .eq('id', data.user.id)
                .maybeSingle();

            if (adminData) {
                window.location.href = '/admin/index.html';
                return;
            }

            // 2. Otherwise check profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('status')
                .eq('id', data.user.id)
                .single();

            if (profile) {
                if (profile.status === 'suspended') throw new Error("Your account has been suspended. Please contact support.");
                window.location.href = '/dashboard/home';
            } else {
                window.location.href = '/dashboard/home';
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Login Failed', text: error.message, confirmButtonColor: '#ef4444', background: '#1e293b', color: '#f1f5f9' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Link to="/" className="auth-back-btn" title="Back to Home">
                <UseAnimations animation={arrowLeftCircle} size={28} strokeColor="currentColor" autoplay={true} loop={true} speed={0.3} />
            </Link>

            <div className="auth-wrapper">
                {/* Form Panel */}
                <div className="auth-form-panel">
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Welcome back</h1>
                    <p style={{ color: 'var(--text-body)', marginBottom: '2rem' }}>Please enter your details to sign in.</p>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="pro-form-group">
                            <label className="pro-form-label" htmlFor="login-email">Email</label>
                            <input
                                type="email"
                                id="login-email"
                                className="pro-form-input"
                                placeholder="Enter your email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={showNewUserPrompt}
                            />
                        </div>

                        <div className="pro-form-group">
                            <label className="pro-form-label" htmlFor="login-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="login-password"
                                    className="pro-form-input"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={showNewUserPrompt}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ accentColor: 'var(--primary)' }}
                                />
                                <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>Remember me</label>
                            </div>
                            <a href="#" onClick={handleForgotPassword} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>Forgot password?</a>
                        </div>

                        <button type="submit" className="pro-btn pro-btn-primary pro-btn-full magnetic-btn" style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Signing in...</>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-body)' }}>
                        Don't have an account? <Link to="/user/signup" style={{ color: 'var(--text-main)', fontWeight: 600 }}>Sign up</Link>
                    </div>
                </div>

                {/* Branding Panel */}
                <div className="auth-branding">
                    <div className="brand-logo">
                        <img src="/assets/gkk-intern-logo.png" alt="GKK INTERN" style={{ height: '100px', width: 'auto' }} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Internship Portal</h2>
                    <p style={{ color: 'var(--text-body)', marginBottom: '2rem' }}>Manage your projects, track your progress, and collaborate with your team.</p>

                    <div className="brand-feature">
                        <div className="brand-feature-icon">
                            <UseAnimations animation={activity} size={22} strokeColor="var(--primary)" autoplay={true} loop={true} speed={0.3} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Real-world Experience</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Work on live production projects</div>
                        </div>
                    </div>

                    <div className="brand-feature">
                        <div className="brand-feature-icon">
                            <UseAnimations animation={lock} size={22} strokeColor="var(--primary)" autoplay={true} loop={true} speed={0.3} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Verified Certificates</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Earn credentials for your career</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
