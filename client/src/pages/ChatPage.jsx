import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import NewChatModal from '../components/NewChatModal';
import CreateGroupModal from '../components/CreateGroupModal';
import MediaUpload from '../components/MediaUpload';
import MessageActions from '../components/MessageActions';

const ChatPage = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    const messagesEndRef = useRef(null);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load Conversations
    const loadConversations = async () => {
        try {
            const res = await api.get('/api/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Load Messages for selected chat
    const loadMessages = async (conversationId) => {
        try {
            const res = await api.get(`/api/conversations/${conversationId}/messages`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadConversations();

        socket.on('receiveMessage', (message) => {
            if (selectedConversation && message.conversationId === selectedConversation.id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
            // Reload conversations to update last message preview
            loadConversations();
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, [selectedConversation]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        if (selectedConversation.isLocal) {
            const msg = {
                id: Date.now(),
                text: newMessage,
                sender: { id: user.id },
                type: 'text',
                timestamp: new Date().toISOString()
            };
            setMessages([...messages, msg]);
            setNewMessage('');
            scrollToBottom();
            return;
        }

        try {
            const res = await api.post('/api/messages', {
                conversationId: selectedConversation.id,
                text: newMessage, // Matches backend update (via content || text)
                type: 'text'
            });
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    // New Handler for Ask Dharma
    const handleAskDharma = async () => {
        try {
            // Get or Create Bot User
            const botRes = await api.get('/api/bot');
            const botUser = botRes.data;

            if (botUser) {
                // Start/Get Conversation with Bot
                const chatRes = await api.post('/api/conversations', { recipientId: botUser.id });
                loadConversations();
                setSelectedConversation(chatRes.data);
            } else {
                alert("Dharma Guide is meditating (Bot User not found).");
            }
        } catch (err) {
            console.error("Ask Dharma Error:", err);
            const errorMessage = err.response?.data?.message || err.message;
            alert(`Error asking Dharma: ${errorMessage}`);
        }
    };

    return (
        <div className='flex h-screen bg-[#050505] text-[#f2e8cf] font-sans selection:bg-[#DAA520]/30 overflow-hidden'>
            {/* Sidebar */}
            <div className='w-80 border-r border-[#DAA520]/10 flex flex-col bg-[#0d0d15]/50 backdrop-blur-sm relative z-10'>
                {/* 1. Header (User Info) */}
                <div className='p-6 border-b border-[#DAA520]/10 flex items-center gap-4 bg-[#0d0d15]'>
                    <div className='w-12 h-12 rounded-full border border-[#DAA520]/30 p-0.5 relative group cursor-pointer'>
                        <div className='w-full h-full rounded-full overflow-hidden bg-[#1a1b41] flex items-center justify-center relative z-10'>
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <span className='text-lg font-bold text-[#DAA520]'>{user.username?.[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <div className="absolute inset-0 border border-[#DAA520] rounded-full opacity-0 group-hover:opacity-100 scale-110 transition duration-500 animate-pulse"></div>
                    </div>
                    <div>
                        <h2 className='text-sm font-spiritual tracking-widest text-[#DAA520] uppercase'>{user.username}</h2>
                        <div className='flex items-center gap-1.5 mt-1'>
                            <span className='w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]'></span>
                            <span className='text-[10px] text-[#f2e8cf]/50 tracking-wider'>ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* 2. Actions (Ask Dharma & New Chat) */}
                <div className='p-4 space-y-3'>
                    <button
                        onClick={() => handleAskDharma()}
                        className='w-full py-3 bg-gradient-to-r from-[#1a1b41] to-[#0d0d15] border border-[#DAA520]/20 rounded-lg text-[#DAA520] text-xs font-spiritual tracking-[2px] hover:border-[#DAA520]/50 hover:shadow-[0_0_15px_rgba(218,165,32,0.1)] transition group flex items-center justify-center gap-2'
                    >
                        <span className="text-sm group-hover:animate-spin-slow">🔮</span> ASK DHARMA
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className='flex-1 py-3 bg-[#DAA520]/5 border border-[#DAA520]/20 rounded-lg text-[#f2e8cf]/80 text-[10px] tracking-widest hover:bg-[#DAA520]/10 hover:text-[#DAA520] transition uppercase'
                        >
                            New Connection
                        </button>
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className='w-10 flex items-center justify-center border border-[#DAA520]/20 rounded-lg text-[#DAA520]/50 hover:text-[#DAA520] hover:border-[#DAA520]/50 transition'
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className='flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1'>
                    {conversations.map(conv => {
                        // Determine name/avatar if private
                        let displayName = conv.name;
                        let displayInitial = displayName?.[0] || '?';
                        let displayAvatar = null;

                        if (!conv.isGroup && conv.Users) {
                            const other = conv.Users.find(u => u.id !== user.id);
                            if (other) {
                                displayName = other.username;
                                displayInitial = displayName[0];
                                displayAvatar = other.avatarUrl;
                            }
                        }

                        return (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`p-3 rounded-xl cursor-pointer transition flex items-center gap-3 border border-transparent ${selectedConversation?.id === conv.id ? 'bg-[#DAA520]/10 border-[#DAA520]/20' : 'hover:bg-[#DAA520]/5 hover:border-[#DAA520]/10'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${selectedConversation?.id === conv.id ? 'bg-[#DAA520] text-black shadow-[0_0_10px_rgba(218,165,32,0.5)]' : 'bg-[#1a1b41] text-[#DAA520] border border-[#DAA520]/20'}`}>
                                    {displayAvatar ? <img src={displayAvatar} className="w-full h-full rounded-full object-cover" /> : displayInitial.toUpperCase()}
                                </div>
                                <div className='overflow-hidden'>
                                    <h3 className={`text-xs font-medium tracking-wide truncate ${selectedConversation?.id === conv.id ? 'text-[#DAA520]' : 'text-[#f2e8cf]/80'}`}>
                                        {displayName?.toUpperCase() || 'UNKNOWN'}
                                    </h3>
                                    <p className='text-[9px] text-[#f2e8cf]/40 uppercase tracking-wider mt-0.5 truncate'>
                                        {conv.isGroup ? 'Group' : 'Connection'}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* 3. Footer (Settings & Logout) */}
                <div className='p-4 border-t border-[#DAA520]/10 bg-[#0d0d15]/50 flex gap-2'>
                    <button
                        onClick={() => navigate('/settings')}
                        className='flex-1 py-2 text-[10px] text-[#DAA520]/60 hover:text-[#DAA520] tracking-[2px] uppercase transition flex items-center justify-center gap-2 border border-transparent hover:border-[#DAA520]/20 rounded'
                    >
                        <span>⚙️</span> Config
                    </button>
                    <button
                        onClick={logout}
                        className='flex-1 py-2 text-[10px] text-red-400/60 hover:text-red-400 tracking-[2px] uppercase transition flex items-center justify-center gap-2 border border-transparent hover:border-red-400/20 rounded'
                    >
                        Exit
                    </button>
                </div>
            </div>

            {/* Main Area (The Void) */}
            <div className='flex-1 flex flex-col relative'>
                {/* Background Image Layer */}
                <div className="absolute inset-0 bg-[url('/bg-om-cosmic.png')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>

                {selectedConversation ? (
                    <div className="relative z-10 flex flex-col h-full bg-black/60 backdrop-blur-sm">
                        {/* Header */}
                        <div className='h-20 border-b border-[#DAA520]/20 flex items-center px-8 bg-[#0d0d15]/80'>
                            <h2 className='text-2xl font-spiritual text-[#DAA520] tracking-widest'>{selectedConversation.name}</h2>
                        </div>

                        {/* Messages */}
                        <div className='flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar'>
                            {messages.map(msg => {
                                const isMe = msg.sender.id === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-xl relative group shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#DAA520]/10 ${isMe ? 'bg-[#DAA520]/10 text-[#f2e8cf] rounded-tr-none' : 'bg-[#1a1b41]/60 text-[#f2e8cf] rounded-tl-none'}`}>
                                            <div className='text-sm leading-relaxed'>{msg.text}</div>
                                            <div className='text-[9px] text-[#DAA520]/50 mt-2 flex justify-end items-center gap-2 font-mono'>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && <span>✓</span>}
                                            </div>

                                            <div className='absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition'>
                                                <MessageActions
                                                    message={msg}
                                                    isMe={isMe}
                                                    onReply={() => { }}
                                                    onDelete={() => { }}
                                                    onEdit={() => { }}
                                                    onReact={() => { }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className='p-6 bg-[#0d0d15]/90 border-t border-[#DAA520]/20'>
                            <form onSubmit={handleSendMessage} className='flex items-center gap-4'>
                                <MediaUpload onFileSelect={(file) => console.log('File selected:', file)} />

                                <input
                                    type='text'
                                    className='flex-1 bg-white/5 text-[#f2e8cf] border border-[#DAA520]/20 rounded-full px-6 py-3 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none placeholder-[#DAA520]/20 font-spiritual text-sm tracking-wide transition-all'
                                    placeholder='Broadcast your message...'
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />

                                <button type='submit' className='p-3 bg-[#DAA520] rounded-full text-black hover:bg-[#FFD700] hover:shadow-[0_0_15px_rgba(218,165,32,0.6)] transition disabled:opacity-50 disabled:shadow-none' disabled={!newMessage.trim()}>
                                    <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className='flex-1 flex flex-col items-center justify-center text-[#DAA520] relative z-10'>
                        {/* Center Visual */}
                        <div className="w-64 h-64 rounded-full border border-[#DAA520]/30 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
                            <div className="absolute inset-0 border border-[#DAA520]/10 rounded-full scale-125"></div>
                            <div className="absolute inset-0 border border-[#DAA520]/5 rounded-full scale-150"></div>
                            <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(218,165,32,0.5)]">🕉️</span>
                        </div>

                        <div className='mt-12 text-center space-y-4'>
                            <h1 className='text-4xl font-spiritual tracking-[0.5em] text-transparent bg-clip-text bg-gradient-to-r from-[#DAA520] via-[#f2e8cf] to-[#DAA520] drop-shadow-sm'>V O I D</h1>
                            <p className='text-xs text-[#DAA520]/60 tracking-[0.2em] font-light max-w-md mx-auto leading-loose'>
                                SELECT A CONNECTION TO BEGIN TRANSMISSION.<br />
                                SILENCE IS ALSO AN ANSWER.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showNewChatModal && (
                <NewChatModal
                    onClose={() => setShowNewChatModal(false)}
                    onChatCreated={() => {
                        setShowNewChatModal(false);
                        loadConversations();
                    }}
                />
            )}

            {showCreateGroupModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroupModal(false)}
                    onGroupCreated={() => {
                        setShowCreateGroupModal(false);
                        loadConversations();
                    }}
                />
            )}
        </div>
    );
};
export default ChatPage;
