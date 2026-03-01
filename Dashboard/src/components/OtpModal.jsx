import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function OtpModal({ show, email, onVerify, onResend, onClose }) {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600);
    const inputRefs = useRef([]);

    // Timer
    useEffect(() => {
        if (!show) return;
        setTimeLeft(600);
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [show]);

    // Focus first input when shown
    useEffect(() => {
        if (show) {
            setDigits(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 300);
        }
    }, [show]);

    const formatTime = (seconds) => {
        if (seconds <= 0) return 'Expired';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleInput = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);

        if (value && index < 5) inputRefs.current[index + 1]?.focus();

        // Auto-verify when all 6 filled
        if (newDigits.every(d => d.length === 1)) {
            handleVerify(newDigits.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();
        const pastedDigits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
        const newDigits = [...digits];
        pastedDigits.forEach((d, i) => { newDigits[i] = d; });
        setDigits(newDigits);

        const lastIndex = Math.min(pastedDigits.length, 5);
        inputRefs.current[lastIndex]?.focus();

        if (pastedDigits.length === 6) {
            setTimeout(() => handleVerify(pastedDigits.join('')), 100);
        }
    };

    const handleVerify = useCallback(async (code) => {
        if (code.length !== 6 || isVerifying) return;
        setIsVerifying(true);
        try {
            await onVerify(code);
        } finally {
            setIsVerifying(false);
        }
    }, [onVerify, isVerifying]);

    const handleResend = async () => {
        if (timeLeft > 0 && timeLeft < 590) return; // Allow resend only near expiry
        setIsResending(true);
        try {
            await onResend();
            setTimeLeft(600);
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsResending(false);
        }
    };

    if (!show) return null;

    return (
        <div className={`otp-modal-overlay ${show ? 'show' : ''}`}>
            <div className="otp-modal">
                <div style={{
                    width: 60, height: 60, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', margin: '0 auto 1.5rem'
                }}>
                    <i className="fas fa-shield-alt"></i>
                </div>

                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Verify Email</h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Enter the code sent to <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
                </p>

                <div className="otp-inputs">
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={el => inputRefs.current[i] = el}
                            type="text"
                            maxLength={1}
                            className="otp-input"
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleInput(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={i === 0 ? handlePaste : undefined}
                        />
                    ))}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Resend in <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatTime(timeLeft)}</span>
                </div>

                <button
                    className="pro-btn pro-btn-primary"
                    style={{ width: '100%' }}
                    disabled={isVerifying || digits.some(d => !d)}
                    onClick={() => handleVerify(digits.join(''))}
                >
                    {isVerifying ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 'Verify & Create'}
                </button>

                <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }}
                    style={{ display: 'block', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isResending ? 'Sending...' : 'Resend Code'}
                </a>

                <button onClick={onClose}
                    style={{ marginTop: '1rem', background: 'none', border: 'none', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
