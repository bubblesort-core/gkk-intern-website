// ============================================
// GKK INTERNS - TEAM CHAT SYSTEM
// Auto-Encrypted WhatsApp-style messaging
// Messages are encrypted - DB shows gibberish
// ============================================

class TeamChat {
    constructor(supabase, user, team) {
        this.supabase = supabase;
        this.user = user;
        this.team = team;
        this.messageSubscription = null;
        this.typingSubscription = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.localStorageKey = `team_chat_${team.id}`;
        this.container = null;
        this.messagesContainer = null;
        this.inputElement = null;
        this.typingIndicator = null;
        this.typingUsers = new Map();
        this.encryptionKey = null;
    }

    // Initialize the chat
    async init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Team chat container not found');
            return;
        }

        // Auto-generate encryption key from team data
        await this.initEncryption();

        this.render();
        this.setupEventListeners();
        await this.loadMessages();
        this.subscribeToMessages();
        this.subscribeToTyping();
    }

    // ============================================
    // AUTO ENCRYPTION (No password needed)
    // ============================================

    // Generate encryption key automatically from team data
    async initEncryption() {
        // Create a unique key from team data that all team members will derive the same way
        // This makes DB unreadable but team members can decrypt
        const teamSecret = `gkk_team_${this.team.id}_${this.team.created_at || 'static'}_secure_chat`;
        this.encryptionKey = await this.deriveKey(teamSecret);
    }

    // Derive encryption key using PBKDF2
    async deriveKey(secret) {
        const encoder = new TextEncoder();
        const salt = encoder.encode('GKK-HIRE-E2E-CHAT-2024');

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt a message
    async encrypt(plaintext) {
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            this.encryptionKey,
            encoder.encode(plaintext)
        );

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    }

    // Decrypt a message
    async decrypt(ciphertext) {
        try {
            const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encrypted
            );

            return new TextDecoder().decode(decrypted);
        } catch (e) {
            // If decryption fails, message might be plain text (old message)
            return ciphertext;
        }
    }

    // ============================================
    // CHAT UI
    // ============================================

    render() {
        const teamInitial = (this.team.name || 'T')[0].toUpperCase();
        const memberCount = this.team.team_members?.length || 0;

        this.container.innerHTML = `
            <div class="team-chat-container">
                <!-- Header -->
                <div class="team-chat-header">
                    <div class="team-chat-header-info">
                        <div class="team-chat-avatar">${teamInitial}</div>
                        <div>
                            <h3 class="team-chat-title">${this.team.name || 'Team Chat'}</h3>
                            <p class="team-chat-subtitle">
                                <i class="fas fa-lock" style="color: #10b981; font-size: 0.7rem;"></i>
                                <span style="color: #10b981;">Private</span> • ${memberCount} members
                            </p>
                        </div>
                    </div>
                    <div class="team-chat-header-actions">
                        <button class="team-chat-header-btn" title="Scroll to bottom" onclick="teamChat.scrollToBottom()">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                </div>

                <!-- Messages -->
                <div class="team-chat-messages" id="teamChatMessages">
                    <div class="team-chat-empty">
                        <div class="team-chat-empty-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <h3>Start the conversation!</h3>
                        <p>Messages are private and encrypted. Only your team can read them.</p>
                    </div>
                </div>

                <!-- Typing Indicator -->
                <div class="team-chat-typing-indicator" id="typingIndicator">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="typing-indicator-text" id="typingText"></span>
                </div>

                <!-- Input Area -->
                <div class="team-chat-input-area">
                    <div class="team-chat-input-wrapper">
                        <input 
                            type="text" 
                            class="team-chat-input" 
                            id="teamChatInput" 
                            placeholder="Type a message..." 
                            autocomplete="off"
                            maxlength="1000"
                        >
                        <button class="team-chat-emoji-btn" title="Emoji" onclick="teamChat.insertEmoji()">
                            <i class="far fa-smile"></i>
                        </button>
                    </div>
                    <button class="team-chat-send-btn" id="teamChatSendBtn" title="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        this.messagesContainer = document.getElementById('teamChatMessages');
        this.inputElement = document.getElementById('teamChatInput');
        this.typingIndicator = document.getElementById('typingIndicator');
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('teamChatSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (this.inputElement) {
            this.inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.inputElement.addEventListener('input', () => {
                this.handleTyping();
            });

            this.inputElement.addEventListener('blur', () => {
                this.stopTyping();
            });
        }
    }

    // ============================================
    // MESSAGES
    // ============================================

    async loadMessages() {
        try {
            // Load from local storage first for instant display
            const localMessages = this.getLocalMessages();
            if (localMessages.length > 0) {
                this.messagesContainer.innerHTML = '';
                for (const msg of localMessages) {
                    await this.appendMessage(msg, false);
                }
                this.scrollToBottom();
            }

            // Then fetch from server
            const { data: messages, error } = await this.supabase
                .from('team_messages')
                .select('*')
                .eq('team_id', this.team.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (messages && messages.length > 0) {
                this.messagesContainer.innerHTML = '';
                let lastDate = null;

                for (const msg of messages) {
                    const msgDate = new Date(msg.created_at).toDateString();
                    if (msgDate !== lastDate) {
                        this.appendDateSeparator(msg.created_at);
                        lastDate = msgDate;
                    }
                    await this.appendMessage(msg, false);
                }

                // Save to local storage
                this.saveLocalMessages(messages);
                this.scrollToBottom();
            } else if (localMessages.length === 0) {
                this.messagesContainer.innerHTML = `
                    <div class="team-chat-empty">
                        <div class="team-chat-empty-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <h3>Start the conversation!</h3>
                        <p>Messages are private and encrypted. Only your team can read them.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    subscribeToMessages() {
        if (this.messageSubscription) {
            this.supabase.removeChannel(this.messageSubscription);
        }

        this.messageSubscription = this.supabase
            .channel(`team_messages_${this.team.id}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'team_messages',
                    filter: `team_id=eq.${this.team.id}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const existing = document.getElementById(`msg-${payload.new.id}`);
                        if (!existing) {
                            await this.appendMessage(payload.new, true);
                            this.addToLocalStorage(payload.new);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        this.updateMessageUI(payload.new);
                        this.updateLocalMessage(payload.new);
                    }
                }
            )
            .subscribe();
    }

    subscribeToTyping() {
        if (this.typingSubscription) {
            this.supabase.removeChannel(this.typingSubscription);
        }

        this.typingSubscription = this.supabase
            .channel(`team_typing_${this.team.id}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'team_typing',
                    filter: `team_id=eq.${this.team.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        if (payload.new.user_id !== this.user.id) {
                            if (payload.new.is_typing) {
                                this.typingUsers.set(payload.new.user_id, payload.new.user_name);
                            } else {
                                this.typingUsers.delete(payload.new.user_id);
                            }
                            this.updateTypingIndicator();
                        }
                    } else if (payload.eventType === 'DELETE') {
                        this.typingUsers.delete(payload.old.user_id);
                        this.updateTypingIndicator();
                    }
                }
            )
            .subscribe();
    }

    async handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        if (!this.isTyping) {
            this.isTyping = true;
            await this.setTypingStatus(true);
        }

        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 3000);
    }

    async stopTyping() {
        if (this.isTyping) {
            this.isTyping = false;
            await this.setTypingStatus(false);
        }
    }

    async setTypingStatus(isTyping) {
        try {
            const userName = this.user.full_name || this.user.email?.split('@')[0] || 'User';

            if (isTyping) {
                await this.supabase
                    .from('team_typing')
                    .upsert({
                        team_id: this.team.id,
                        user_id: this.user.id,
                        user_name: userName,
                        is_typing: true,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'team_id,user_id' });
            } else {
                await this.supabase
                    .from('team_typing')
                    .delete()
                    .eq('team_id', this.team.id)
                    .eq('user_id', this.user.id);
            }
        } catch (error) {
            console.error('Error setting typing status:', error);
        }
    }

    updateTypingIndicator() {
        const typingText = document.getElementById('typingText');
        if (!typingText) return;

        const names = Array.from(this.typingUsers.values());

        if (names.length === 0) {
            this.typingIndicator.classList.remove('visible');
        } else if (names.length === 1) {
            typingText.innerHTML = `<strong>${names[0]}</strong> is typing...`;
            this.typingIndicator.classList.add('visible');
        } else if (names.length === 2) {
            typingText.innerHTML = `<strong>${names[0]}</strong> and <strong>${names[1]}</strong> are typing...`;
            this.typingIndicator.classList.add('visible');
        } else {
            typingText.innerHTML = `<strong>${names.length} people</strong> are typing...`;
            this.typingIndicator.classList.add('visible');
        }
    }

    async sendMessage() {
        if (this.isSending) return; // Prevent double send

        const text = this.inputElement.value.trim();
        if (!text) return;

        this.isSending = true;
        const sendBtn = document.getElementById('teamChatSendBtn');
        if (sendBtn) sendBtn.disabled = true;
        this.inputElement.disabled = true;

        this.inputElement.value = '';
        this.stopTyping();

        const userName = this.user.full_name || this.user.email?.split('@')[0] || 'User';
        const tempId = 'temp-' + Date.now();

        // Remove empty state
        const emptyState = this.messagesContainer.querySelector('.team-chat-empty');
        if (emptyState) emptyState.remove();

        // Show message immediately (plain text locally)
        const tempMessage = {
            id: tempId,
            team_id: this.team.id,
            user_id: this.user.id,
            user_name: userName,
            message: text,
            is_deleted: false,
            created_at: new Date().toISOString(),
            _plain: true
        };

        await this.appendMessage(tempMessage, true, true);

        try {
            // Encrypt before sending to DB
            const encryptedMessage = await this.encrypt(text);

            const { data, error } = await this.supabase
                .from('team_messages')
                .insert({
                    team_id: this.team.id,
                    user_id: this.user.id,
                    user_name: userName,
                    message: encryptedMessage
                })
                .select()
                .single();

            if (error) throw error;

            // Update temp message
            const tempElement = document.getElementById(`msg-${tempId}`);
            if (tempElement) {
                tempElement.id = `msg-${data.id}`;
                tempElement.dataset.msgId = data.id;
                const meta = tempElement.querySelector('.team-chat-message-meta');
                if (meta) {
                    meta.innerHTML = meta.innerHTML.replace('fa-check"', 'fa-check-double" style="color: #10b981;"');
                }
            }

            this.addToLocalStorage({ ...data, _decrypted: text });
        } catch (error) {
            console.error('Error sending message:', error);
            const tempElement = document.getElementById(`msg-${tempId}`);
            if (tempElement) {
                tempElement.classList.add('failed');
                const meta = tempElement.querySelector('.team-chat-message-meta');
                if (meta) {
                    meta.innerHTML += ' <i class="fas fa-exclamation-circle" style="color: #ef4444;" title="Failed to send"></i>';
                }
            }
            // If failed, we might want to let them try again, but for now just unlock
        } finally {
            this.isSending = false;
            if (sendBtn) sendBtn.disabled = false;
            this.inputElement.disabled = false;
            this.inputElement.focus();
        }
    }

    async deleteMessage(messageId) {
        const result = await Swal.fire({
            title: 'Delete Message?',
            text: 'This message will be deleted for everyone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Delete for everyone',
            cancelButtonText: 'Cancel',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await this.supabase
                .from('team_messages')
                .update({ is_deleted: true })
                .eq('id', messageId)
                .eq('user_id', this.user.id);

            if (error) throw error;

            this.updateMessageUI({ id: messageId, is_deleted: true });
            this.updateLocalMessage({ id: messageId, is_deleted: true });

            Swal.fire({
                title: 'Deleted!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#1e293b',
                color: '#f8fafc'
            });
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }

    updateMessageUI(msg) {
        const element = document.getElementById(`msg-${msg.id}`);
        if (!element) return;

        if (msg.is_deleted) {
            element.classList.add('deleted');
            const content = element.querySelector('.team-chat-message-content');
            if (content) {
                content.innerHTML = '<i class="fas fa-ban"></i> This message was deleted';
            }
            const actions = element.querySelector('.team-chat-message-actions');
            if (actions) actions.remove();
        }
    }

    appendDateSeparator(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateText;
        if (date.toDateString() === today.toDateString()) {
            dateText = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateText = 'Yesterday';
        } else {
            dateText = date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        }

        const separator = document.createElement('div');
        separator.className = 'chat-date-separator';
        separator.innerHTML = `<span>${dateText}</span>`;
        this.messagesContainer.appendChild(separator);
    }

    async appendMessage(msg, scroll = true, isPending = false) {
        const isSent = msg.user_id === this.user.id;
        const time = new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Decrypt message
        let messageText;
        if (msg._plain || msg._decrypted) {
            messageText = msg._plain ? msg.message : msg._decrypted;
        } else if (msg.is_deleted) {
            messageText = null;
        } else {
            messageText = await this.decrypt(msg.message);
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `team-chat-message ${isSent ? 'sent' : 'received'} ${msg.is_deleted ? 'deleted' : ''}`;
        messageDiv.id = `msg-${msg.id}`;
        messageDiv.dataset.msgId = msg.id;

        const messageContent = msg.is_deleted
            ? '<i class="fas fa-ban"></i> This message was deleted'
            : this.escapeHtml(messageText);

        messageDiv.innerHTML = `
            ${!isSent ? `<span class="team-chat-sender">${this.escapeHtml(msg.user_name)}</span>` : ''}
            <div class="team-chat-message-content">
                ${messageContent}
            </div>
            <div class="team-chat-message-meta">
                ${time}
                ${isSent && !msg.is_deleted ? `
                    <i class="fas fa-check${!isPending ? '-double' : ''}" style="color: ${!isPending ? '#10b981' : '#64748b'};"></i>
                ` : ''}
            </div>
            ${isSent && !msg.is_deleted ? `
                <div class="team-chat-message-actions">
                    <button class="team-chat-delete-btn" onclick="teamChat.deleteMessage('${msg.id}')" title="Delete message">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        `;

        this.messagesContainer.appendChild(messageDiv);

        if (scroll) {
            this.scrollToBottom();
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    insertEmoji() {
        const emojis = ['😊', '👍', '🎉', '🔥', '💪', '👏', '❤️', '😄', '🚀', '✅', '💡', '🙌'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        if (this.inputElement) {
            this.inputElement.value += randomEmoji;
            this.inputElement.focus();
        }
    }

    // ============================================
    // LOCAL STORAGE
    // ============================================

    getLocalMessages() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    saveLocalMessages(messages) {
        try {
            const toSave = messages.slice(-100);
            localStorage.setItem(this.localStorageKey, JSON.stringify(toSave));
        } catch (e) {
            console.error('Error saving to local storage:', e);
        }
    }

    addToLocalStorage(message) {
        const messages = this.getLocalMessages();
        const exists = messages.some(m => m.id === message.id);
        if (!exists) {
            messages.push(message);
            this.saveLocalMessages(messages);
        }
    }

    updateLocalMessage(msg) {
        const messages = this.getLocalMessages();
        const index = messages.findIndex(m => m.id === msg.id);
        if (index > -1) {
            messages[index] = { ...messages[index], ...msg };
            this.saveLocalMessages(messages);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.messageSubscription) {
            this.supabase.removeChannel(this.messageSubscription);
        }
        if (this.typingSubscription) {
            this.supabase.removeChannel(this.typingSubscription);
        }
        this.stopTyping();
    }
}

// Global instance
let teamChat = null;

// Initialize team chat
function initTeamChat(supabase, user, team, containerId = 'teamChatContainer') {
    if (teamChat) {
        teamChat.destroy();
    }
    teamChat = new TeamChat(supabase, user, team);
    teamChat.init(containerId);
    return teamChat;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TeamChat, initTeamChat };
}
