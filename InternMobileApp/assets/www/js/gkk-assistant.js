/* GKK Assistant - Floating Chatbot Widget */

// Material Symbols Font should be added in the HTML head for better performance

/* Styles */
const gkkChatStyles = `
<style id="gkk-assistant-styles">
    #gkk-chat-widget * {
        box-sizing: border-box;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Force Material Symbols Font for icons */
    #gkk-chat-widget .material-symbols-outlined {
        font-family: 'Material Symbols Outlined' !important;
        font-weight: normal;
        font-style: normal;
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
    }
    
    /* Floating Button - Enhanced Bubble Design */
    #gkk-chat-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        cursor: grab;
        background: linear-gradient(135deg, #13c8ec 0%, #0ea5c7 100%);
        box-shadow: 0 12px 40px rgba(19, 200, 236, 0.35), 
                    0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: box-shadow 0.3s, background 0.3s;
        color: white;
        touch-action: none;
        user-select: none;
    }
    #gkk-chat-btn.dragging {
        cursor: grabbing;
        transition: none;
    }
    
    #gkk-chat-btn .material-symbols-outlined {
        font-size: 28px;
        transition: transform 0.3s ease;
    }
    
    #gkk-chat-btn:hover {
        transform: scale(1.15) rotate(5deg);
        box-shadow: 0 16px 48px rgba(19, 200, 236, 0.45), 
                    0 8px 16px rgba(0, 0, 0, 0.15);
    }
    
    #gkk-chat-btn:active {
        transform: scale(1.05);
    }
    
    #gkk-chat-btn.open {
        background: #0d191b;
        transform: rotate(0deg);
    }
    
    #gkk-chat-btn.open .material-symbols-outlined {
        transform: rotate(90deg); /* Optional effect */
    }
    
    #gkk-chat-badge {
        position: absolute;
        top: 0px;
        right: 0px;
        min-width: 24px;
        height: 24px;
        padding: 0 6px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        font-size: 12px;
        font-weight: 700;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: gkk-pulse 2s infinite;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        border: 3px solid white;
    }
    
    @keyframes gkk-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
    }
    
    /* Chat Window - Modern Card Design */
    #gkk-chat-window {
        position: fixed;
        bottom: 110px;
        right: 24px;
        width: 380px;
        height: 500px;
        background: white;
        border-radius: 24px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.12), 
                    0 10px 32px rgba(0, 0, 0, 0.08),
                    0 0 1px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(231, 241, 243, 0.8);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9998;
        touch-action: none;
    }
    #gkk-chat-window.dragging-window {
        transition: none !important;
    }
    
    #gkk-chat-window.open {
        display: flex;
    }
    
    @keyframes gkk-slideUp {
        from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
        }
    }
    
    /* Header - Gradient with Glass Effect */
    #gkk-chat-header {
        background: linear-gradient(135deg, #13c8ec 0%, #0ea5c7 100%);
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        overflow: hidden;
        cursor: grab;
        user-select: none;
        touch-action: none;
    }
    #gkk-chat-header.dragging {
        cursor: grabbing;
    }
    
    #gkk-chat-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }
    
    #gkk-chat-avatar .material-symbols-outlined {
        font-size: 24px;
    }
    
    #gkk-chat-title {
        flex: 1;
    }
    
    #gkk-chat-title h3 {
        color: white;
        font-size: 16px;
        font-weight: 700;
        margin: 0;
    }
    
    #gkk-chat-title p {
        color: rgba(255,255,255,0.8);
        font-size: 12px;
        margin: 2px 0 0;
    }
    
    .gkk-header-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: white;
    }
    
    .gkk-header-btn:hover {
        background: rgba(255,255,255,0.3);
    }
    
    .gkk-header-btn .material-symbols-outlined {
        font-size: 18px;
    }
    
    /* Messages Area */
    #gkk-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f6f8f8;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    /* Scrollbar Styling */
    #gkk-chat-messages::-webkit-scrollbar {
        width: 6px;
    }
    #gkk-chat-messages::-webkit-scrollbar-track {
        background: transparent;
    }
    #gkk-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(19, 200, 236, 0.2);
        border-radius: 3px;
    }
    
    /* Message Bubbles */
    .gkk-message {
        display: flex;
        animation: gkk-messageIn 0.3s ease;
    }
    
    @keyframes gkk-messageIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .gkk-message.bot { justify-content: flex-start; }
    .gkk-message.user { justify-content: flex-end; }
    
    .gkk-message-content {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 14px;
        font-size: 14px;
        line-height: 1.4;
        white-space: pre-line;
        display: flex;
        flex-direction: column;
    }
    
    .gkk-message.bot .gkk-message-content {
        background: white;
        color: #0d191b;
        border-bottom-left-radius: 2px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    
    .gkk-message.user .gkk-message-content {
        background: #13c8ec;
        color: white;
        border-bottom-right-radius: 2px;
    }
    
    .gkk-message-time {
        font-size: 10px;
        margin-top: 2px;
        opacity: 0.9;
        align-self: flex-end;
        font-weight: 500;
    }
    
    .gkk-message.bot .gkk-message-time { color: #64748b; }
    .gkk-message.user .gkk-message-time { color: rgba(255,255,255, 0.95); }
    
    /* Typing Indicator */
    .gkk-typing {
        display: flex;
        padding: 12px;
        background: white;
        border-radius: 16px;
        border-bottom-left-radius: 0;
        width: fit-content;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .gkk-typing span {
        width: 8px;
        height: 8px;
        background: #13c8ec;
        border-radius: 50%;
        margin: 0 2px;
        animation: gkk-bounce 1.4s infinite ease-in-out;
    }
    
    .gkk-typing span:nth-child(1) { animation-delay: 0s; }
    .gkk-typing span:nth-child(2) { animation-delay: 0.15s; }
    .gkk-typing span:nth-child(3) { animation-delay: 0.3s; }
    
    @keyframes gkk-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
    }
    
    /* Input Area */
    #gkk-chat-input-area {
        padding: 16px;
        background: white;
        border-top: 1px solid #e7f1f3;
        display: flex;
        gap: 8px;
    }
    
    #gkk-chat-input {
        flex: 1;
        padding: 12px 16px;
        background: #f6f8f8;
        border: 1px solid #e7f1f3;
        border-radius: 12px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
    }
    
    #gkk-chat-input:focus {
        border-color: #13c8ec;
        background: white;
        box-shadow: 0 0 0 2px rgba(19,200,236,0.1);
    }
    
    #gkk-chat-send {
        width: 48px;
        height: 46px;
        background: #13c8ec;
        border: none;
        border-radius: 12px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    #gkk-chat-send:active { transform: scale(0.95); }
    #gkk-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
    
    /* Mobile Responsive - Match site breakpoint */
    @media (max-width: 768px) {
        #gkk-chat-window {
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            top: auto !important;
            width: 100% !important;
            height: 70vh !important;
            max-height: 70vh;
            border-radius: 24px 24px 0 0 !important;
            animation: gkk-slideUpMobile 0.4s ease;
        }
        
        @keyframes gkk-slideUpMobile {
            from { 
                opacity: 0; 
                transform: translateY(100%); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        #gkk-chat-header {
            padding: 14px !important;
        }
        
        #gkk-chat-header h3 {
            font-size: 15px !important;
        }
        
        #gkk-chat-messages {
            padding: 12px !important;
        }
        
        .gkk-message-content {
            font-size: 13px !important;
            padding: 8px 10px !important;
        }
        
        #gkk-chat-input-area {
            padding: 12px !important;
        }
        
        #gkk-chat-input {
            font-size: 14px !important;
            padding: 10px 14px !important;
        }
        
        #gkk-chat-btn {
            right: 12px !important;
            bottom: 12px !important;
            width: 56px !important;
            height: 56px !important;
        }
        
        #gkk-chat-btn .material-symbols-outlined {
            font-size: 26px !important;
        }
        
        #gkk-chat-send {
            width: 44px !important;
            height: 42px !important;
        }
        
        /* Hide floating button when chat is open on mobile */
        #gkk-chat-btn.open {
            display: none !important;
        }
    }
</style>
    /* Date Divider */
    .gkk-date-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 16px 0 8px;
        position: relative;
    }
    
    .gkk-date-divider span {
        background: rgba(226, 232, 240, 0.8);
        color: #64748b;
        font-size: 11px;
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
`;

// Bot responses (FAQ & Conversation)
const gkkBotResponses = {
    // Greetings & Small Talk
    "hello": "Hello! Welcome to GKK. How can I assist you today?",
    "hi": "Hi there! 👋 How can I help you?",
    "hey": "Hey! I'm here to help.",
    "morning": "Good morning! ☀️ Hope you're having a great day.",
    "evening": "Good evening! 🌙",
    "thanks": "You're welcome! Happy to help. 😊",
    "thank": "No problem at all! Let me know if you need anything else.",
    "bye": "Goodbye! Have a wonderful day! 👋",
    "who are you": "I'm the GKK Assistant 🤖. I help with internships, project tracking, and general queries.",
    "what are you": "I am a smart virtual assistant designed to guide you through the GKK-Hire platform.",

    // General FAQs (Non-Personal)
    "help": "I can help you with:\n• Checking your **Application Status**\n• verifying your **Payment**\n• Finding your **Projects**\n• General inquiries",
    "interview": "Interviews are scheduled after your application is shortlisted. Check your email or status for updates.",
    "project": "Our projects are real-world simulations designed to test your skills. You get assigned one after joining a team.",
    "team": "Teams are groups of interns working together. You can view your team in the Dashboard.",
    "payment": "The registration fee covers your internship assessment and platform access.",
    "fee": "The registration fee is a one-time payment required to verify your commitment and unlock the dashboard.",
    "cost": "There is a nominal platform fee to cover server costs and assessment tools.",
    "contact": "You can reach us at **support@gkk-hire.com** for urgent issues.",
    "apply": "To apply, visit the **Apply Page** from the home screen and fill out the form.",

    // Default Fallback
    "default": "default_fallback_signal"
};

async function getBotResponse(message) {
    const lower = message.toLowerCase();
    const user = await getCurrentUser();

    // --- 1. CONVERSATION & FAQ LAYER (Static) ---
    // Check purely conversational matches first if they are exact or high-confidence
    // This prevents "What is the fee" from triggering "checkPaymentStatus"

    // Helper: partial match against static keys
    for (const [key, response] of Object.entries(gkkBotResponses)) {
        if (key !== "default" && lower.includes(key)) {
            // Smart Filter: If user says "payment status", don't trigger generic "payment" FAQ
            // We want "Matches FAQ key BUT NOT specific intent keywords"
            const isSpecificIntent = lower.match(/(status|check|my|have i|did i)/i);

            if (isSpecificIntent && (key === 'payment' || key === 'project' || key === 'application')) {
                continue; // Skip static, let DB layer handle it
            }
            return response;
        }
    }

    // --- 2. PERSONAL DATA LAYER (Database) ---
    // Triggered if context implies "MY data" or "CHECK status"

    // 0. Handle Direct Email Input (Lookup Application for Guests)
    // This must be top-level so it catches the email response even without keywords
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(message.trim())) {
        return await checkApplicationStatus(message.trim());
    }

    const isPersonalQuery = lower.match(/(my|i|me|check|status|approved|shortlisted|how much.*paid)/i);

    // A. Application Status
    // (Open to Guests via Email, or Logged In Users)
    if (lower.match(/(application|status|approved|shortlisted)/i)) {
        if (user) {
            return await checkApplicationStatus(user.email);
        } else {
            return "I can check that for you! 🕵️\n\nPlease enter your **Registered Email Address** below so I can look it up. 👇";
        }
    }

    // B. Payment Status
    if (lower.match(/(payment|paid|money|fee|cost)/i) && isPersonalQuery) {
        if (!user) {
            return "I can help check your payment status! 💳\n\nSince this contains private data, please **login** first.\n\n🔒 [Login Here](user/login.html)";
        }
        return await checkPaymentStatus(user.id);
    }

    // C. Project Status
    if (lower.match(/(project|work|task|assignment)/i) && isPersonalQuery) {
        if (!user) {
            return "To see your assigned projects, you need to be logged in and part of a team.\n\n🚀 [Login Here](user/login.html)";
        }
        return await checkProjectStatus(user.id);
    }

    // --- 3. KNOWLEDGE LAYER (Wikipedia) ---
    // If we reached here, it's not a standard FAQ and not a recognizable DB query.
    // Try Wiki for general knowledge (e.g., "Who is Musk", "What is Java")

    if (message.split(' ').length > 1) { // Ignore single words like "hey" if missed
        const wiki = await searchWikipedia(message);
        if (wiki) return wiki;
    }

    // --- 4. FALLBACK ---
    return "I'm not sure about that. I can help with:\n• GKK Queries (Status, Payment, Projects)\n• General Knowledge (via Wiki)\n\nOr try searching: 🔍 [Google Search](https://www.google.com/search?q=" + encodeURIComponent(message) + ")";
}

// Wiki Search Helper
async function searchWikipedia(query) {
    if (query.length < 3 || query.split(' ').length > 10) return null;

    // Clean query: Remove common question prefixes and format as Title Case
    let cleanQuery = query.toLowerCase()
        .replace(/^(who|what|where|when|why|how)\s+(is|are|was|were|do|does|did|the)\s+/i, '')
        .replace(/^(tell|give)\s+(me)\s+(about\s+)?/i, '')
        .replace(/\?+$/, '') // Remove trailing question marks
        .trim();

    // Convert to Title Case (Wikipedia often requires this)
    cleanQuery = cleanQuery.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('_');

    try {
        const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
        const response = await fetch(endpoint);

        if (!response.ok) return null; // Not found

        const data = await response.json();

        if (data.type === 'standard' && data.extract) {
            // Limit extract length to keep it brief if needed, though usually summaries are okay.
            // Let's ensure it looks like a proper card.
            return `📚 **${data.title}**\n\n${data.extract}\n\n🔗 [Read Full Article](${data.content_urls.desktop.page})`;
        } else if (data.type === 'disambiguation') {
            return `📚 **${data.title}**\n\nThis topic has multiple meanings. Please be more specific.\n\n🔗 [View Options](${data.content_urls.desktop.page})`;
        }
    } catch (e) {
        console.error("Wiki Error", e);
        return null; // Fallback
    }
    return null;
}

// --- Database Query Helpers ---

async function checkApplicationStatus(email) {
    const { data, error } = await supabaseClient
        .from('applications')
        .select('status, interview_notes')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error("App Check Error:", error);
        return "I couldn't fetch your application details at the moment.";
    }

    if (!data) return "I couldn't find an application linked to your email.";

    // Format the status for display
    const statusMap = {
        'pending': 'Under Review ⏳',
        'shortlisted': 'Shortlisted 📋',
        'approved': 'Approved 🎉',
        'rejected': 'Not Selected ❌',
        'interview_ready': 'Ready for Interview 🤝'
    };

    const displayStatus = statusMap[data.status] || data.status.replace(/_/g, ' ').toUpperCase();

    let msg = `Here are the details for your application:\n\n**Status**: ${displayStatus}`;

    if (data.status === 'approved') {
        msg += "\n\n**Next Steps**:\n• Log in to your dashboard\n• Join your assigned team\n• Start your first project";
    } else if (data.status === 'pending') {
        msg += "\n\n**Note**: Our team is currently reviewing your profile. You will be notified via email once a decision is made.";
    } else if (data.status === 'shortlisted' || data.status === 'interview_ready') {
        msg += "\n\n**Action Required**:\nPlease check your email for the interview schedule. detailed instructions have been sent to you.";
        if (data.interview_notes) msg += `\n\n**HR Note**:\n"${data.interview_notes}"`;
    }

    return msg;
}

async function checkPaymentStatus(userId) {
    const { data, error } = await supabaseClient
        .from('payments')
        .select('amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) return "Error checking payment records.";

    if (!data || data.length === 0) {
        return "I don't see any payment records for your account yet.";
    }

    const payment = data[0];
    const date = new Date(payment.created_at).toLocaleDateString();

    if (payment.status === 'completed') {
        return `✅ Payment Verified!\nAmount: ₹${payment.amount}\nDate: ${date}\nStatus: **Paid**`;
    } else {
        return `⚠️ Last Payment Status: **${payment.status}**\nDate: ${date}\nPlease complete the payment to unlock features.`;
    }
}

async function checkProjectStatus(userId) {
    // First get user's team
    const { data: memberData, error: memberError } = await supabaseClient
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .maybeSingle();

    if (memberError || !memberData) {
        return "You are not currently assigned to any team, so you don't have active projects.";
    }

    // Get projects for that team
    const { data: projects, error: projectError } = await supabaseClient
        .from('projects')
        .select('title, status, deadline')
        .eq('assigned_team_id', memberData.team_id)
        .eq('status', 'in_progress');

    if (projectError) return "Error fetching project details.";

    if (!projects || projects.length === 0) {
        return "Your team currently has no **In Progress** projects.";
    }

    let msg = "🚀 **Active Projects:**\n";
    projects.forEach(p => {
        const due = p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No Deadline';
        msg += `• ${p.title} (Due: ${due})\n`;
    });
    return msg;
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatSmartDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    }
}

// Initialize widget
function initGKKAssistant() {
    // Prevent duplicate initialization
    if (document.getElementById('gkk-chat-widget')) return;

    // Add styles
    document.head.insertAdjacentHTML('beforeend', gkkChatStyles);

    // Load SweetAlert2 if not present
    if (typeof Swal === 'undefined' && !document.querySelector('script[src*="sweetalert2"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        document.head.appendChild(script);
    }

    // Create widget HTML with Material Symbols
    const widgetHTML = `
    <div id="gkk-chat-widget">
        <div id="gkk-chat-window">
            <div id="gkk-chat-header">
                <div id="gkk-chat-avatar">
                   <span class="material-symbols-outlined">smart_toy</span>
                </div>
                <div id="gkk-chat-title">
                    <h3>GKK Assistant</h3>
                    <p style="font-size: 11px; line-height: 1.3; margin-top: 4px; opacity: 1; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                        GKK & General Info<br>
                        <i class="fas fa-lock" style="font-size: 10px;"></i> Private & stored locally
                    </p>
                </div>
                <button id="gkk-chat-reset" class="gkk-header-btn" title="Clear chat history">
                    <span class="material-symbols-outlined">refresh</span>
                </button>
                <button id="gkk-chat-close" class="gkk-header-btn">
                     <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div id="gkk-chat-messages"></div>
            <div id="gkk-chat-input-area">
                <input type="text" id="gkk-chat-input" placeholder="Type your message...">
                <button id="gkk-chat-send" disabled>
                     <span class="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>
        <button id="gkk-chat-btn">
            <span id="gkk-btn-icon" class="material-symbols-outlined">chat</span>
            <span id="gkk-chat-badge">1</span>
        </button>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Elements
    const btn = document.getElementById('gkk-chat-btn');
    const btnIcon = document.getElementById('gkk-btn-icon');
    const window_ = document.getElementById('gkk-chat-window');
    const closeBtn = document.getElementById('gkk-chat-close');
    const resetBtn = document.getElementById('gkk-chat-reset');
    const input = document.getElementById('gkk-chat-input');
    const sendBtn = document.getElementById('gkk-chat-send');
    const messages = document.getElementById('gkk-chat-messages');
    const badge = document.getElementById('gkk-chat-badge');

    let isOpen = false;
    let lastMessageDate = null; // Track date for dividers
    const STORAGE_KEY = 'gkk-assistant-messages';

    // LocalStorage functions
    function saveMessages(messagesArray) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesArray));
        } catch (e) {
            console.error('Failed to save messages:', e);
        }
    }

    function loadMessages() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load messages:', e);
            return [];
        }
    }

    function clearMessages() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            lastMessageDate = null;
        } catch (e) {
            console.error('Failed to clear messages:', e);
        }
    }

    // Load saved messages or add initial message
    const savedMessages = loadMessages();
    if (savedMessages.length > 0) {
        savedMessages.forEach(msg => {
            // BACKWARD_COMPAT: If old messages don't have timestamp, use current date
            if (!msg.timestamp) msg.timestamp = new Date().toISOString();
            addMessage(msg.text, msg.isBot, false, msg.timestamp);
        });
    } else {
        addMessage("Hi! 👋 I'm GKK Assistant. How can I help you today?", true);
    }

    // Toggle chat
    function toggleChat(open) {
        isOpen = open !== undefined ? open : !isOpen;
        window_.classList.toggle('open', isOpen);
        btn.classList.toggle('open', isOpen);

        // Update icon based on state
        btnIcon.textContent = isOpen ? 'close' : 'chat';

        badge.style.display = isOpen ? 'none' : 'flex';
        if (isOpen) {
            setTimeout(() => input.focus(), 100);
            messages.scrollTop = messages.scrollHeight;
        }
    }

    // Click is handled by drag system below (click only fires if no drag occurred)

    closeBtn.addEventListener('click', () => toggleChat(false));

    // Reset chat
    resetBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'Clear Chat History?',
            text: 'This will delete all your previous messages.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#13c8ec',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, clear it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                messages.innerHTML = '';
                clearMessages();
                addMessage("Hi! 👋 I'm GKK Assistant. How can I help you today?", true);
                Swal.fire({
                    title: 'Cleared!',
                    text: 'Chat history has been cleared.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    });

    // Input handling
    input.addEventListener('input', () => {
        sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && input.value.trim()) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // ═══ DRAG SYSTEM ═══
    const DRAG_THRESHOLD = 5; // px — movement below this counts as a click
    const BTN_POS_KEY = 'gkk-btn-pos';
    const WIN_POS_KEY = 'gkk-win-pos';

    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Restore saved button position
    function restoreBtnPosition() {
        try {
            const saved = JSON.parse(localStorage.getItem(BTN_POS_KEY));
            if (saved && !isMobile()) {
                btn.style.right = 'auto';
                btn.style.bottom = 'auto';
                btn.style.left = Math.min(saved.x, window.innerWidth - 60) + 'px';
                btn.style.top = Math.min(saved.y, window.innerHeight - 60) + 'px';
            }
        } catch (e) { /* ignore */ }
    }
    restoreBtnPosition();

    // --- Button drag ---
    let btnDrag = { active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false };

    function onBtnDown(e) {
        if (isMobile()) return;
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const rect = btn.getBoundingClientRect();
        btnDrag.active = true;
        btnDrag.moved = false;
        btnDrag.startX = point.clientX;
        btnDrag.startY = point.clientY;
        btnDrag.offsetX = point.clientX - rect.left;
        btnDrag.offsetY = point.clientY - rect.top;
        btn.classList.add('dragging');
    }

    function onBtnMove(e) {
        if (!btnDrag.active) return;
        const point = e.touches ? e.touches[0] : e;
        const dx = point.clientX - btnDrag.startX;
        const dy = point.clientY - btnDrag.startY;

        if (!btnDrag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        btnDrag.moved = true;

        let x = point.clientX - btnDrag.offsetX;
        let y = point.clientY - btnDrag.offsetY;

        // Clamp within viewport
        x = Math.max(0, Math.min(x, window.innerWidth - btn.offsetWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - btn.offsetHeight));

        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
    }

    function onBtnUp(e) {
        if (!btnDrag.active) return;
        btnDrag.active = false;
        btn.classList.remove('dragging');

        if (btnDrag.moved) {
            // Save position
            const rect = btn.getBoundingClientRect();
            localStorage.setItem(BTN_POS_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
        } else {
            // Treat as click
            toggleChat();
        }
    }

    btn.addEventListener('mousedown', onBtnDown);
    btn.addEventListener('touchstart', onBtnDown, { passive: false });
    document.addEventListener('mousemove', onBtnMove);
    document.addEventListener('touchmove', onBtnMove, { passive: false });
    document.addEventListener('mouseup', onBtnUp);
    document.addEventListener('touchend', onBtnUp);

    // --- Chat window drag (via header) ---
    const header = document.getElementById('gkk-chat-header');
    let winDrag = { active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false };

    function onWinDown(e) {
        if (isMobile()) return;
        // Don't start drag if clicking a button in the header
        if (e.target.closest('.gkk-header-btn')) return;
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const rect = window_.getBoundingClientRect();
        winDrag.active = true;
        winDrag.moved = false;
        winDrag.startX = point.clientX;
        winDrag.startY = point.clientY;
        winDrag.offsetX = point.clientX - rect.left;
        winDrag.offsetY = point.clientY - rect.top;
        header.classList.add('dragging');
        window_.classList.add('dragging-window');
    }

    function onWinMove(e) {
        if (!winDrag.active) return;
        const point = e.touches ? e.touches[0] : e;
        const dx = point.clientX - winDrag.startX;
        const dy = point.clientY - winDrag.startY;

        if (!winDrag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        winDrag.moved = true;

        let x = point.clientX - winDrag.offsetX;
        let y = point.clientY - winDrag.offsetY;

        // Clamp within viewport
        x = Math.max(0, Math.min(x, window.innerWidth - window_.offsetWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - window_.offsetHeight));

        window_.style.right = 'auto';
        window_.style.bottom = 'auto';
        window_.style.left = x + 'px';
        window_.style.top = y + 'px';
    }

    function onWinUp() {
        if (!winDrag.active) return;
        winDrag.active = false;
        header.classList.remove('dragging');
        window_.classList.remove('dragging-window');

        if (winDrag.moved) {
            const rect = window_.getBoundingClientRect();
            localStorage.setItem(WIN_POS_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
        }
    }

    header.addEventListener('mousedown', onWinDown);
    header.addEventListener('touchstart', onWinDown, { passive: false });
    document.addEventListener('mousemove', onWinMove);
    document.addEventListener('touchmove', onWinMove, { passive: false });
    document.addEventListener('mouseup', onWinUp);
    document.addEventListener('touchend', onWinUp);

    // Position chat window when opened — place above button or use saved position
    const origToggle = toggleChat;
    toggleChat = function (open) {
        origToggle(open);
        if (isOpen && !isMobile()) {
            // Try saved window position first
            try {
                const savedWin = JSON.parse(localStorage.getItem(WIN_POS_KEY));
                if (savedWin) {
                    window_.style.right = 'auto';
                    window_.style.bottom = 'auto';
                    window_.style.left = Math.min(savedWin.x, window.innerWidth - 400) + 'px';
                    window_.style.top = Math.max(0, Math.min(savedWin.y, window.innerHeight - 520)) + 'px';
                    return;
                }
            } catch (e) { /* ignore */ }
            // Fallback: position above button
            const btnRect = btn.getBoundingClientRect();
            let winX = btnRect.right - 380;
            let winY = btnRect.top - 510;
            winX = Math.max(8, Math.min(winX, window.innerWidth - 390));
            winY = Math.max(8, winY);
            window_.style.right = 'auto';
            window_.style.bottom = 'auto';
            window_.style.left = winX + 'px';
            window_.style.top = winY + 'px';
        }
    };

    // Reset positions on window resize to prevent off-screen
    window.addEventListener('resize', () => {
        if (isMobile()) {
            // Reset to defaults for mobile
            btn.style.left = '';
            btn.style.top = '';
            btn.style.right = '12px';
            btn.style.bottom = '12px';
            window_.style.left = '';
            window_.style.top = '';
            window_.style.right = '';
            window_.style.bottom = '';
        } else {
            restoreBtnPosition();
        }
    });

    function addMessage(text, isBot, shouldSave = true, timestamp = null) {
        const dateObj = timestamp ? new Date(timestamp) : new Date();
        const dateString = dateObj.toDateString();

        // Add Date Divider if date changed
        if (lastMessageDate !== dateString) {
            const divider = document.createElement('div');
            divider.className = 'gkk-date-divider';
            divider.innerHTML = `<span>${formatSmartDate(dateObj)}</span>`;
            messages.appendChild(divider);
            lastMessageDate = dateString;
        }

        // Parse basic markdown:
        // 1. Links: [text](url) -> <a href="url" target="_blank">text</a>
        // 2. Bold: **text** -> <strong>text</strong>
        // 3. Newlines: \n -> <br>
        let formattedText = text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: inherit; text-decoration: underline;">$1</a>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        const div = document.createElement('div');
        div.className = `gkk-message ${isBot ? 'bot' : 'user'}`;
        div.innerHTML = `
            <div class="gkk-message-content">
                <div>${formattedText}</div>
                <div class="gkk-message-time">${formatTime(dateObj)}</div>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        // Save to localStorage
        if (shouldSave) {
            const allMessages = loadMessages();
            allMessages.push({
                text,
                isBot,
                timestamp: dateObj.toISOString()
            });
            saveMessages(allMessages);
        }
    }

    function showTyping() {
        if (document.getElementById('gkk-typing-indicator')) return;
        const div = document.createElement('div');
        div.className = 'gkk-typing';
        div.id = 'gkk-typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const indicator = document.getElementById('gkk-typing-indicator');
        if (indicator) indicator.remove();
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, false);
        input.value = '';
        sendBtn.disabled = true;

        showTyping();

        // Artificial delay for feel, then fetch real response
        const responseDelay = 600 + Math.random() * 400;

        // Start fetching immediately but assume minimal wait
        try {
            const response = await getBotResponse(text);

            setTimeout(() => {
                hideTyping();
                addMessage(response, true);
            }, responseDelay);
        } catch (e) {
            setTimeout(() => {
                hideTyping();
                addMessage("Sorry, I encountered an error. Please try again.", true);
            }, responseDelay);
        }
    }
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGKKAssistant);
} else {
    initGKKAssistant();
}
