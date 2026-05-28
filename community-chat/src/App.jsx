import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { Send, Zap, Shield, MessageSquare, Compass, Settings, LogOut, Image, Menu, X, Reply, CornerDownRight, AlertCircle, Cpu, Coffee, Lock } from 'lucide-react'

// GKK Dashboard Color Palette
// --bg-body: #0f172a (dark blue)
// --bg-subtle: #1e293b (card bg)
// --primary: #10b981 (emerald green)
// --text-main: #f8fafc (white)
// --text-body: #94a3b8 (gray)
// --text-muted: #64748b (muted)
// --border: #334155

// Random Anime Avatars - 100+ unique characters
const AVATARS = [
  // Adventurer style avatars
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Felix&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aneka&backgroundColor=0ea5e9',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Milo&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Luna&backgroundColor=ec4899',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kai&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Nova&backgroundColor=06b6d4',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Zara&backgroundColor=f97316',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Axel&backgroundColor=84cc16',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Ivy&backgroundColor=14b8a6',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Rex&backgroundColor=6366f1',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Skye&backgroundColor=a855f7',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Juno&backgroundColor=22c55e',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Orion&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Ember&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Storm&backgroundColor=64748b',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Phoenix&backgroundColor=dc2626',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aurora&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Blaze&backgroundColor=ea580c',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Crystal&backgroundColor=0891b2',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Dash&backgroundColor=65a30d',
  // Lorelei style avatars (anime-like)
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Sakura&backgroundColor=fda4af',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Yuki&backgroundColor=a5b4fc',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Hana&backgroundColor=fcd34d',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Ren&backgroundColor=86efac',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Sora&backgroundColor=7dd3fc',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Akira&backgroundColor=c4b5fd',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Haru&backgroundColor=fca5a5',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Kaito&backgroundColor=5eead4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Mei&backgroundColor=f9a8d4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Ryu&backgroundColor=93c5fd',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Yuna&backgroundColor=d8b4fe',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Kenji&backgroundColor=6ee7b7',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Mika&backgroundColor=fbbf24',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Taro&backgroundColor=a78bfa',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Nami&backgroundColor=67e8f9',
  // Notionists style avatars
  'https://api.dicebear.com/7.x/notionists/svg?seed=Zephyr&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Cinder&backgroundColor=f97316',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Frost&backgroundColor=0ea5e9',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Sage&backgroundColor=22c55e',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Violet&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Coral&backgroundColor=f43f5e',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Indigo&backgroundColor=6366f1',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Jade&backgroundColor=14b8a6',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Amber&backgroundColor=d97706',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ruby&backgroundColor=dc2626',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Onyx&backgroundColor=374151',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Pearl&backgroundColor=e5e7eb',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Topaz&backgroundColor=fbbf24',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Opal&backgroundColor=c084fc',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Jasper&backgroundColor=b45309',
  // Fun emoji avatars
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sunny&backgroundColor=fef08a',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Moonlight&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Stardust&backgroundColor=fae8ff',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Rainbow&backgroundColor=bfdbfe',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Thunder&backgroundColor=fde68a',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Ocean&backgroundColor=a5f3fc',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Forest&backgroundColor=bbf7d0',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Desert&backgroundColor=fed7aa',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Galaxy&backgroundColor=ddd6fe',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Volcano&backgroundColor=fecaca',
  // Bottts (robot) style avatars
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bolt&backgroundColor=eab308',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Circuit&backgroundColor=06b6d4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel&backgroundColor=ec4899',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nano&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&backgroundColor=14b8a6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robo&backgroundColor=f97316',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Mech&backgroundColor=84cc16',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Droid&backgroundColor=a855f7',
  // Personas style avatars
  'https://api.dicebear.com/7.x/personas/svg?seed=Atlas&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/personas/svg?seed=Echo&backgroundColor=6366f1',
  'https://api.dicebear.com/7.x/personas/svg?seed=Nyx&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/personas/svg?seed=Titan&backgroundColor=0891b2',
  'https://api.dicebear.com/7.x/personas/svg?seed=Lyra&backgroundColor=db2777',
  'https://api.dicebear.com/7.x/personas/svg?seed=Cosmo&backgroundColor=0ea5e9',
  'https://api.dicebear.com/7.x/personas/svg?seed=Vega&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/personas/svg?seed=Stella&backgroundColor=ec4899',
  'https://api.dicebear.com/7.x/personas/svg?seed=Mars&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/personas/svg?seed=Venus&backgroundColor=f472b6',
  // Pixel art style avatars
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Hero&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ninja&backgroundColor=1e293b',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Wizard&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Knight&backgroundColor=64748b',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Archer&backgroundColor=22c55e',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Mage&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Rogue&backgroundColor=f97316',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Paladin&backgroundColor=fbbf24',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ranger&backgroundColor=84cc16',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Bard&backgroundColor=ec4899',
  // More adventurer variations
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Shadow&backgroundColor=334155',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Mystic&backgroundColor=9333ea',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Thunder2&backgroundColor=ca8a04',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Spirit&backgroundColor=0d9488',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Flame&backgroundColor=dc2626',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aqua&backgroundColor=0284c7',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Terra&backgroundColor=65a30d',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aero&backgroundColor=0ea5e9',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Volt&backgroundColor=eab308',
  'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Frost2&backgroundColor=06b6d4',
]

// Generate random user ID (persisted in localStorage)
const getOrCreateUserId = () => {
  let id = localStorage.getItem('gkk_chat_user_id')
  if (!id) {
    id = Math.random().toString(36).substring(2, 10)
    localStorage.setItem('gkk_chat_user_id', id)
  }
  return id
}

const getOrCreateAvatar = () => {
  let avatar = localStorage.getItem('gkk_chat_avatar')
  if (!avatar) {
    avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)]
    localStorage.setItem('gkk_chat_avatar', avatar)
  }
  return avatar
}

const userId = getOrCreateUserId()
const initialAvatar = getOrCreateAvatar()

const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

const CHAT_ROOMS = [
  { id: 'general', name: 'General Chat', icon: <MessageSquare size={20} />, description: 'The main lobby for everyone.', color: '#10b981' }, // Emerald
  { id: 'report-issue', name: 'Report Issue', icon: <AlertCircle size={20} />, description: 'Found a bug? Let us know here.', color: '#f59e0b' }, // Amber
  { id: 'tech-talk', name: 'Tech Talk', icon: <Cpu size={20} />, description: 'Discuss code, gadgets, and AI.', color: '#3b82f6' }, // Blue
  { id: 'casual-corner', name: 'Casual Corner', icon: <Coffee size={20} />, description: 'Just chilling and vibing.', color: '#8b5cf6' }, // Purple
]

function App() {
  const [currentView, setCurrentView] = useState('chat')
  const [activeChannel, setActiveChannel] = useState(CHAT_ROOMS[0])
  const [inputText, setInputText] = useState('')
  const [onlineCount, setOnlineCount] = useState(1)
  const messagesEndRef = useRef(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentUserAvatar, setCurrentUserAvatar] = useState(initialAvatar)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef(null)

  // Store messages per room - persists when switching rooms
  const [messagesByRoom, setMessagesByRoom] = useState({
    'general': [],
    'report-issue': [],
    'tech-talk': [],
    'casual-corner': []
  })

  // Get current room's messages
  const messages = messagesByRoom[activeChannel.id] || []

  // Use refs for values that shouldn't trigger re-subscription
  const soundEnabledRef = useRef(soundEnabled)
  const currentUserAvatarRef = useRef(currentUserAvatar)
  const activeChannelRef = useRef(activeChannel.id)

  // Keep refs in sync with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    activeChannelRef.current = activeChannel.id
  }, [activeChannel.id])

  useEffect(() => {
    currentUserAvatarRef.current = currentUserAvatar
    // Update presence when avatar changes (without re-subscribing)
    if (channelRef.current) {
      channelRef.current.track({ user_id: userId, avatar: currentUserAvatar })
    }
  }, [currentUserAvatar])

  // Subscribe to Realtime Broadcast channel - NO DATABASE STORAGE
  // Only re-subscribe when changing rooms
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Don't clear messages - they're stored per room now
    setReplyingTo(null)

    const channel = supabase.channel(`room:${activeChannel.id}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    })

    channel.on('broadcast', { event: 'message' }, (payload) => {
      const msg = payload.payload

      // Use ref to check sound setting without causing re-subscription
      if (soundEnabledRef.current && msg.userId !== userId && !document.hidden) {
        const audio = new Audio(SOUND_URL)
        audio.volume = 0.5
        audio.play().catch(() => { })
      }

      // Add message to the correct room
      setMessagesByRoom(prev => ({
        ...prev,
        [activeChannelRef.current]: [...(prev[activeChannelRef.current] || []).slice(-99), msg]
      }))
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      setOnlineCount(Object.keys(state).length)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        await channel.track({ user_id: userId, avatar: currentUserAvatarRef.current })
      }
    })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChannel.id]) // Only depend on channel ID

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleRerollAvatar = () => {
    const newAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)]
    setCurrentUserAvatar(newAvatar)
    localStorage.setItem('gkk_chat_avatar', newAvatar)

    if (channelRef.current) {
      channelRef.current.track({ user_id: userId, avatar: newAvatar })
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !channelRef.current) return

    const message = {
      id: `${userId}-${Date.now()}`,
      text: inputText.trim(),
      userId: userId,
      avatar: currentUserAvatar,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text.substring(0, 50) + (replyingTo.text.length > 50 ? '...' : ''),
        userId: replyingTo.userId
      } : null
    }

    await channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    })

    setInputText('')
    setReplyingTo(null)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRoomSelect = (room) => {
    setActiveChannel(room)
    setCurrentView('chat')
    setIsMobileMenuOpen(false)
  }

  const handleNavClick = (view) => {
    setCurrentView(view)
    setIsMobileMenuOpen(false)
  }

  const handleReply = (msg) => {
    setReplyingTo(msg)
  }

  return (
    <div className="bg-[#0f172a] font-sans text-[#f8fafc] min-h-screen flex items-center justify-center lg:p-6 overflow-hidden relative">

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-350 h-screen lg:h-[90vh] bg-[#0f172a] lg:rounded-2xl border-0 lg:border border-[#334155] shadow-2xl flex relative z-10">

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 w-72 bg-[#1e293b] border-r border-[#334155] flex flex-col justify-between z-60 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: activeChannel.color || '#10b981' }}>
                  <Zap size={16} fill="currentColor" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">GKK Chat</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-[#64748b] hover:text-[#f8fafc]">
                <X size={24} />
              </button>
            </div>

            <nav className="space-y-1">
              {CHAT_ROOMS.map(room => (
                <NavItem
                  key={room.id}
                  icon={room.icon}
                  text={room.name}
                  active={currentView === 'chat' && activeChannel.id === room.id}
                  color={room.color}
                  onClick={() => {
                    setActiveChannel(room)
                    handleNavClick('chat')
                  }}
                />
              ))}

              <div className="pt-4 mt-4 border-t border-[#334155]"></div>

              <NavItem
                icon={<Shield size={18} />}
                text="How It Works"
                active={currentView === 'secure'}
                onClick={() => handleNavClick('secure')}
              />
            </nav>
          </div>

          <div className="p-6 border-t border-[#334155]">
            <NavItem
              icon={<Settings size={18} />}
              text="Settings"
              active={currentView === 'settings'}
              onClick={() => handleNavClick('settings')}
            />
            <div className="mt-6 flex items-center gap-3">
              <div className="size-8 rounded-full bg-[#334155]" style={{ backgroundImage: `url(${currentUserAvatar})`, backgroundSize: 'cover' }}></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-[#f8fafc]">
                  Anonymous
                </p>
                <p className={`text-xs truncate ${isConnected ? 'text-[#10b981]' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#0f172a] relative w-full min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden h-14 border-b border-[#334155] flex items-center px-4 justify-between bg-[#1e293b] sticky top-0 z-50">
            <div className="flex items-center gap-3 relative z-50">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#f8fafc] relative z-50 p-2 -ml-2 rounded-lg hover:bg-[#334155] transition-colors">
                <Menu size={24} />
              </button>
              <span className="font-bold text-sm tracking-wide text-[#f8fafc]">
                {currentView === 'chat' ? activeChannel.name : 'GKK Chat'}
              </span>
            </div>
            {currentView === 'chat' && (
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeChannel.color || '#10b981' }}></span>
                <span className="text-[10px] font-mono text-[#64748b]">{onlineCount} online</span>
              </div>
            )}
          </div>

          {currentView === 'chat' && (
            <ChatView
              activeChannel={activeChannel}
              onlineCount={onlineCount}
              messages={messages}
              inputText={inputText}
              setInputText={setInputText}
              handleKeyPress={handleKeyPress}
              handleSendMessage={handleSendMessage}
              messagesEndRef={messagesEndRef}
              userId={userId}
              onReply={handleReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          )}

          {/* currentView === 'explore' removed */}
          {currentView === 'secure' && <SecureView />}
          {currentView === 'settings' && (
            <SettingsView
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              onRerollAvatar={handleRerollAvatar}
              currentUserAvatar={currentUserAvatar}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// --- Views ---

function ChatView({ activeChannel, onlineCount, messages, inputText, setInputText, handleKeyPress, handleSendMessage, messagesEndRef, userId, onReply, replyingTo, setReplyingTo }) {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Bar - Desktop */}
      <div className="hidden lg:flex h-20 border-b border-[#334155] items-center justify-between px-10 bg-[#1e293b]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-full bg-[#334155] flex items-center justify-center border border-[#475569]" style={{ color: activeChannel.color || '#10b981' }}>
            {activeChannel.icon}
          </div>
          <div>
            <h2 className="font-bold text-base lg:text-lg flex items-center gap-3 text-[#f8fafc]">
              {activeChannel.name}
              <span className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeChannel.color || '#10b981' }}></span>
            </h2>
            <p className="text-xs text-[#64748b]">Messages disappear when you leave • Nothing stored</p>
          </div>
        </div>
        <div className="hidden lg:flex text-xs font-mono text-[#64748b] items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: activeChannel.color || '#10b981' }}></span>
          {onlineCount} ONLINE
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent bg-[#0f172a]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#64748b] gap-4 opacity-70">
            <MessageSquare size={32} />
            <p className="text-sm tracking-widest uppercase">No messages yet</p>
            <p className="text-xs text-[#64748b] text-center max-w-xs">
              Messages are ephemeral - they only exist while you're here. Nothing is stored in any database!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.userId === userId
          return (
            <div key={msg.id} className={`flex items-end gap-3 max-w-[90%] lg:max-w-[65%] ${isMe ? 'ml-auto flex-row-reverse' : ''} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className="size-8 rounded-full bg-[#334155] border border-[#475569] shrink-0"
                style={{ backgroundImage: `url(${msg.avatar})`, backgroundSize: 'cover' }}></div>

              <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${isMe ? '' : 'text-[#64748b]'}`} style={isMe ? { color: activeChannel.color || '#10b981' } : {}}>
                  {isMe ? 'You' : 'Anonymous'}
                </span>

                {/* Reply Preview */}
                {msg.replyTo && (
                  <div className={`flex items-center gap-2 text-xs text-[#64748b] px-3 py-1 rounded-lg bg-[#334155]/50 border-l-2 ${isMe ? 'mr-2' : 'ml-2'}`} style={{ borderColor: activeChannel.color || '#10b981' }}>
                    <CornerDownRight size={12} />
                    <span className="truncate max-w-50">{msg.replyTo.text}</span>
                  </div>
                )}

                <div className={`px-5 py-3 text-[15px] leading-relaxed shadow-md relative wrap-break-word whitespace-pre-wrap rounded-2xl ${isMe
                  ? 'text-white rounded-tr-sm'
                  : 'bg-[#1e293b] text-[#f8fafc] border border-[#334155] rounded-tl-sm'
                  }`}
                  style={isMe ? { backgroundColor: activeChannel.color || '#10b981' } : {}}>
                  {msg.text}
                </div>

                {/* Reply Button */}
                {!isMe && (
                  <button
                    onClick={() => onReply(msg)}
                    className="flex items-center gap-1 text-[10px] transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: activeChannel.color || '#10b981' }}
                  >
                    <Reply size={12} /> Reply
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="px-4 lg:px-8 py-2 bg-[#1e293b] border-t border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <Reply size={16} style={{ color: activeChannel.color || '#10b981' }} />
            <span>Replying to: </span>
            <span className="text-[#f8fafc] font-medium truncate max-w-50">{replyingTo.text}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-[#64748b] hover:text-[#f8fafc]">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 lg:p-8 bg-[#1e293b] border-t border-[#334155]">
        <div className="max-w-225 mx-auto relative group">
          <div className="bg-[#0f172a] border border-[#334155] p-2 pl-4 rounded-full flex items-center gap-3 shadow-lg transition-all"
            style={{ borderColor: 'var(--border-color, #334155)' }}
            onFocusCapture={(e) => e.currentTarget.style.borderColor = activeChannel.color || '#10b981'}
            onBlurCapture={(e) => e.currentTarget.style.borderColor = '#334155'}
          >
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-[#f8fafc] placeholder:text-[#64748b] h-10 text-sm font-medium"
              placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="size-10 text-white rounded-full flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: activeChannel.color || '#10b981' }}
            >
              <Send size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExploreView({ onSelectRoom }) {
  return (
    <main className="flex-1 p-6 lg:p-12 overflow-y-auto w-full min-w-0 bg-[#0f172a]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-[#f8fafc]">Explore</h2>
        <p className="text-[#94a3b8] mb-10 text-lg">Join a channel to start chatting anonymously. All messages are ephemeral.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHAT_ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className="bg-[#1e293b] border border-[#334155] p-8 rounded-xl hover:bg-[#10b981] hover:border-[#10b981] transition-all duration-300 text-left group flex flex-col justify-between h-48 shadow-md"
            >
              <div className="w-full flex justify-between items-start">
                <div className="size-10 rounded-full bg-[#334155] group-hover:bg-white/20 flex items-center justify-center text-[#10b981] group-hover:text-white transition-colors">
                  {room.icon}
                </div>
                <div className="text-xs font-mono border border-[#334155] group-hover:border-white/30 px-2 py-1 rounded-full text-[#64748b] group-hover:text-white/80">
                  EPHEMERAL
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#f8fafc]">{room.name}</h3>
                <p className="text-[#94a3b8] group-hover:text-white/80 text-sm">{room.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

function SecureView() {
  return (
    <main className="flex-1 p-6 lg:p-12 overflow-y-auto w-full min-w-0 bg-[#0f172a]">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center pt-10">
          <Shield size={64} className="mx-auto mb-6 text-[#10b981]" strokeWidth={1} />
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-[#f8fafc]">How It Works</h2>
          <p className="text-[#94a3b8] text-lg max-w-lg mx-auto">True ephemeral messaging - nothing is ever stored.</p>
        </div>

        <div className="space-y-4">
          {[
            { title: 'No Database Storage', text: 'Messages are broadcast in real-time but NEVER saved to any database. When you leave, they\'re gone forever.', icon: <LogOut size={20} /> },
            { title: 'Fully Anonymous', text: 'No accounts, no registration. You get a random avatar and everyone sees you as "Anonymous".', icon: <Lock size={20} /> },
            { title: 'Reply to Anyone', text: 'Click reply on any message to respond directly. Everyone in the room can see and join the conversation.', icon: <Reply size={20} /> },
            { title: 'Real-time Only', text: 'Uses Supabase Realtime Broadcast - pure pub/sub messaging with zero persistence.', icon: <Zap size={20} /> }
          ].map((item, i) => (
            <div key={i} className="bg-[#1e293b] border border-[#334155] p-8 rounded-xl flex items-center gap-6 shadow-md">
              <div className="size-12 rounded-full bg-[#10b981]/15 flex items-center justify-center shrink-0 text-[#10b981]">
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#f8fafc] mb-1">{item.title}</h3>
                <p className="text-[#94a3b8]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

function SettingsView({ soundEnabled, setSoundEnabled, onRerollAvatar, currentUserAvatar }) {
  return (
    <main className="flex-1 p-6 lg:p-12 overflow-y-auto w-full min-w-0 bg-[#0f172a]">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 tracking-tight text-[#f8fafc]">Settings</h2>

        <div className="space-y-6">
          {/* Identity Section */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4 flex items-center gap-2">
              <Image size={20} className="text-[#10b981]" /> Identity
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-[#334155] border-2 border-[#475569]"
                  style={{ backgroundImage: `url(${currentUserAvatar})`, backgroundSize: 'cover' }}></div>
                <div>
                  <p className="text-[#f8fafc] font-medium">Anonymous Avatar</p>
                  <p className="text-sm text-[#64748b]">Your current digital mask.</p>
                </div>
              </div>
              <button
                onClick={onRerollAvatar}
                className="px-4 py-2 bg-[#10b981] text-white text-sm font-bold rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2">
                <Compass size={16} /> Reroll
              </button>
            </div>
          </div>

          {/* Sound Section */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-full flex items-center justify-center ${soundEnabled ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#334155] text-[#64748b]'}`}>
                <Zap size={20} />
              </div>
              <div>
                <p className="text-[#f8fafc] font-medium">Sound Effects</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[#64748b]">Play a sound on new messages.</p>
                  <button
                    onClick={() => {
                      const audio = new Audio(SOUND_URL)
                      audio.volume = 0.5
                      audio.play().catch(() => alert('Audio blocked: Check browser permissions'))
                    }}
                    className="text-xs text-[#10b981] hover:text-[#059669] underline">
                    Test Sound
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-[#10b981]' : 'bg-[#334155]'}`}>
              <div className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${soundEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}

function NavItem({ icon, text, active, onClick, color }) {
  const activeStyle = active
    ? { backgroundColor: color || '#10b981', color: 'white' }
    : {};

  return (
    <button
      onClick={onClick}
      style={activeStyle}
      className={`
      w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group text-sm font-medium
      ${active ? '' : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155]'}
    `}>
      <div
        className={`${active ? 'text-white' : 'text-[#64748b] group-hover:text-white'} transition-colors`}
        style={!active && color ? { color: 'inherit' } : {}}
      >
        {/* We can use inline style for hover color if needed, but simple CSS group-hover is trickier with dynamic values strings. 
            For now, keeping the text hover as white/slate. If we want the icon to colorize on hover, we'd need more complex state.
            Let's keep it simple: Active = Colored BG. Inactive = Slate text.
        */}
        {icon}
      </div>
      <span>{text}</span>
    </button>
  )
}

export default App
