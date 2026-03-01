import { useState, useRef, useEffect } from "react";

interface Message {
    id: number;
    text: string;
    isBot: boolean;
    timestamp: Date;
}

const FloatingButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Hi! 👋 I'm GKK Assistant. How can I help you with your application today?",
            isBot: true,
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const botResponses: { [key: string]: string } = {
        "hello": "Hello! Welcome to GKK. How can I assist you today?",
        "hi": "Hi there! 👋 Ready to help with your application!",
        "help": "I can help you with:\n• Filling out the application form\n• Interview scheduling\n• Document upload questions\n• General inquiries",
        "interview": "You can schedule your interview by selecting an available date (Jan 25, 26, or 27) and a time slot (6 PM or 8 PM) in the Interview Schedule section.",
        "documents": "You can upload your CV/Resume in PDF or DOCX format. Just click the upload area or drag and drop your file!",
        "deadline": "Please complete your application as soon as possible. Available interview slots are limited!",
        "contact": "You can reach us at careers@gkk.design or through this chat!",
        "default": "Thanks for your message! If you have specific questions about the application, feel free to ask about:\n• Interview scheduling\n• Document uploads\n• Application requirements",
    };

    const getBotResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();

        for (const [keyword, response] of Object.entries(botResponses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }

        return botResponses["default"];
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: messages.length + 1,
            text: inputValue,
            isBot: false,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");

        // Show typing indicator
        setIsTyping(true);

        // Simulate bot response delay
        setTimeout(() => {
            setIsTyping(false);
            const botMessage: Message = {
                id: messages.length + 2,
                text: getBotResponse(inputValue),
                isBot: true,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
        }, 1000 + Math.random() * 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-95 h-125 bg-background-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden z-50 animate-slideUp">
                    {/* Header */}
                    <div className="bg-linear-to-r from-background-light to-background-card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#10b981]/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#10b981]">smart_toy</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-text-primary">GKK Assistant</h3>
                            <p className="text-xs text-text-secondary">Always here to help</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full bg-border flex items-center justify-center hover:bg-[#475569] transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-primary text-lg">close</span>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-light">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl ${message.isBot
                                            ? "bg-background-card text-text-primary rounded-bl-none shadow-sm"
                                            : "bg-[#10b981] text-text-primary rounded-br-none"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                                    <p className={`text-[10px] mt-1 ${message.isBot ? "text-text-muted" : "text-text-primary/70"}`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-background-card p-3 rounded-2xl rounded-bl-none shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-2 h-2 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-2 h-2 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-background-card border-t border-border">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 bg-background-light rounded-xl border border-border text-text-primary text-sm focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="w-12 h-12 bg-[#10b981] text-text-primary rounded-xl flex items-center justify-center hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 ${isOpen
                        ? "bg-background-card rotate-0"
                        : "bg-[#10b981] hover:scale-110 hover:bg-[#059669]"
                    }`}
            >
                <span className={`material-symbols-outlined text-2xl text-text-primary`}>
                    {isOpen ? "close" : "chat"}
                </span>

                {/* Notification Badge */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-text-primary text-xs rounded-full flex items-center justify-center animate-pulse">
                        1
                    </span>
                )}
            </button>
        </>
    );
};

export default FloatingButton;
