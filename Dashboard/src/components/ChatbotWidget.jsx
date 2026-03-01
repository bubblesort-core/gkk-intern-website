import React, { useState, useRef, useEffect } from 'react';

const botResponses = {
    hello: "Hello! Welcome to GKK. How can I assist you today?",
    hi: "Hi there! 👋 How can I help you?",
    hey: "Hey! I'm here to help.",
    morning: "Good morning! ☀️ Hope you're having a great day.",
    evening: "Good evening! How can I help?",
    help: "I can help with: applying for internships, login issues, payment questions, team info, and more. Just ask!",
    apply: "To apply, click the 'Apply Now' button or visit the Apply page. You'll need to fill out a short form with your details.",
    internship: "Our internship program lets you work on real-world projects, collaborate with teams, and earn certificates. Apply now to get started!",
    payment: "The registration fee covers your internship assessment and platform access.",
    fee: "The registration fee is a one-time payment required to verify your commitment and unlock the dashboard.",
    login: "You can log in from the Sign In button in the navigation bar, or visit /dashboard/user/login directly.",
    signup: "Click 'Sign Up' in the navigation to create your account. You'll need an email address to get started.",
    certificate: "Certificates are awarded upon successful completion of your internship program. They are verified and can be shared on LinkedIn.",
    team: "Teams are assigned after your application is approved. You'll collaborate with other interns on real projects.",
    project: "Projects are real-world applications built with modern tech stacks. Your team lead will assign tasks and guide you.",
    duration: "The internship typically lasts 4-8 weeks depending on the program track.",
    contact: "You can reach us at noreplay.gkk26@gmail.com or call +91 9477564633.",
    thanks: "You're welcome! Happy to help. 😊",
    bye: "Goodbye! Best of luck with your journey. 🚀",
    default: "I'm not sure about that. Try asking about: applying, internships, payments, teams, projects, or certificates.",
};

function getBotResponse(message) {
    const lower = message.toLowerCase().trim();
    for (const [key, response] of Object.entries(botResponses)) {
        if (key !== 'default' && lower.includes(key)) {
            return response;
        }
    }
    return botResponses.default;
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: "Hi! 👋 I'm the GKK Assistant. How can I help you today?", time: new Date() },
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;

        const userMsg = { type: 'user', text, time: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');

        // Simulate typing delay
        setTimeout(() => {
            const botMsg = { type: 'bot', text: getBotResponse(text), time: new Date() };
            setMessages((prev) => [...prev, botMsg]);
        }, 600);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Chat Button */}
            <button
                id="gkk-chat-btn"
                onClick={() => setIsOpen(!isOpen)}
                className={isOpen ? 'open' : ''}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #13c8ec 0%, #0ea5e9 100%)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(19, 200, 236, 0.35)',
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                    {isOpen ? 'close' : 'chat'}
                </span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    id="gkk-chat-window"
                    style={{
                        position: 'fixed',
                        bottom: '110px',
                        right: '24px',
                        width: '380px',
                        height: '500px',
                        background: 'white',
                        borderRadius: '24px',
                        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.12)',
                        zIndex: 1001,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'fadeUp 0.3s ease-out',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #13c8ec 0%, #0ea5e9 100%)',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: 'white',
                        }}
                    >
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                                smart_toy
                            </span>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>GKK Assistant</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Always here to help</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            background: '#f6f8f8',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '80%',
                                        padding: '12px 16px',
                                        borderRadius: msg.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        background: msg.type === 'user'
                                            ? 'linear-gradient(135deg, #13c8ec, #0ea5e9)'
                                            : 'white',
                                        color: msg.type === 'user' ? 'white' : '#1e293b',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    }}
                                >
                                    {msg.text}
                                </div>
                                <div
                                    style={{
                                        fontSize: '10px',
                                        marginTop: '2px',
                                        color: '#64748b',
                                        fontWeight: 500,
                                    }}
                                >
                                    {formatTime(msg.time)}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div
                        style={{
                            padding: '12px 16px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            gap: '8px',
                            background: 'white',
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            style={{
                                flex: 1,
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                outline: 'none',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            style={{
                                width: '48px',
                                height: '46px',
                                background: '#13c8ec',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
