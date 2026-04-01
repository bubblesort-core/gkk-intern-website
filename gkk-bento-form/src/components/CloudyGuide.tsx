import { useState, useEffect, useRef } from 'react';
import { useFormContext } from '@/context/FormContext';

const CloudyGuide: React.FC = () => {
    const { cloudyMessage, cloudyBounce } = useFormContext();
    const [displayMessage, setDisplayMessage] = useState(cloudyMessage);
    const [animClass, setAnimClass] = useState('speech-enter');
    const prevMsg = useRef(cloudyMessage);

    // Animate message changes
    useEffect(() => {
        if (cloudyMessage !== prevMsg.current) {
            setAnimClass('speech-exit');
            const t = setTimeout(() => {
                setDisplayMessage(cloudyMessage);
                setAnimClass('speech-enter');
                prevMsg.current = cloudyMessage;
            }, 200);
            return () => clearTimeout(t);
        }
    }, [cloudyMessage]);

    return (
        <div className={`fixed bottom-6 right-6 lg:right-auto lg:left-6 z-50 flex flex-col lg:items-start items-end gap-2 pointer-events-none
            ${cloudyBounce ? 'cloudy-bounce' : ''}
        `}>
            {/* Speech Bubble */}
            <div className={`pointer-events-auto bg-bg-card border border-border rounded-2xl px-4 py-3 shadow-lg max-w-[260px] relative ${animClass} lg:ml-4`}>
                <p className="text-sm text-text-primary leading-snug font-medium">{displayMessage}</p>
                {/* Triangle */}
                <div className="absolute -bottom-2 right-8 lg:right-auto lg:left-8 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
                <div className="absolute -bottom-[10px] right-8 lg:right-auto lg:left-8 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-border -z-10" />
            </div>

            {/* Cloudy Character */}
            <div className="cloudy-float pointer-events-auto w-20 h-20 relative">
                {/* Body */}
                <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                    <defs>
                        <radialGradient id="cg" cx="40%" cy="30%" r="60%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#e8ecf0" />
                        </radialGradient>
                    </defs>
                    <path d="M25,65 Q5,65 5,48 Q5,35 18,30 Q14,18 28,12 Q38,6 48,12 Q52,3 65,3 Q82,3 86,18 Q96,12 100,28 Q105,42 98,52 Q103,65 85,65 Z"
                        fill="url(#cg)" stroke="#d1d5db" strokeWidth="0.5" />
                </svg>

                {/* Eyes */}
                <div className="absolute top-[32%] left-1/2 -translate-x-1/2 flex gap-3">
                    <div className="w-3 h-4 bg-white rounded-full border border-gray-300 flex items-center justify-center overflow-hidden cloudy-blink">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm relative">
                            <div className="absolute top-0 left-0.5 w-1 h-1 bg-white/80 rounded-full" />
                        </div>
                    </div>
                    <div className="w-3 h-4 bg-white rounded-full border border-gray-300 flex items-center justify-center overflow-hidden cloudy-blink" style={{ animationDelay: '0.2s' }}>
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm relative">
                            <div className="absolute top-0 left-0.5 w-1 h-1 bg-white/80 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Blush */}
                <div className="absolute top-[52%] left-1/2 -translate-x-1/2 flex gap-5">
                    <div className="w-2 h-1 bg-pink-300 rounded-full opacity-50 blur-[1px]" />
                    <div className="w-2 h-1 bg-pink-300 rounded-full opacity-50 blur-[1px]" />
                </div>

                {/* Smile */}
                <div className="absolute top-[58%] left-1/2 -translate-x-1/2">
                    <svg width="10" height="5" viewBox="0 0 12 6" fill="none">
                        <path d="M1 1C1 1 3 5 6 5C9 5 11 1 11 1" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                </div>

                {/* Name tag */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        Cloudy
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CloudyGuide;
