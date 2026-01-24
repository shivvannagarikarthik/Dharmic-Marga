import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';
import MediaUpload from '../components/MediaUpload';
import CreateGroupModal from '../components/CreateGroupModal';
import NewChatModal from '../components/NewChatModal';
import MessageActions from '../components/MessageActions';

const ChatPage = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const messagesEndRef = useRef(null);

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
            const res = await api.get(`/api/messages/${conversationId}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!user) return;
        loadConversations();
        const socket = getSocket();

        if (socket) {
             socket.on('receive_message', (message) => {
                if (selectedConversation && message.conversationId === selectedConversation.id) {
                    setMessages(prev => [...prev, message]);
                    scrollToBottom();
                }
                loadConversations();
            });
        }
       
        return () => {
            if (socket) socket.off('receive_message');
        };
    }, [user, selectedConversation]);

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
                text: newMessage,
                type: 'text'
            });
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    // New Handler for Direct Bot Chat
    const handleAskDharma = async () => {
        // 1. Check if we already have a chat with the bot
        const existingBotChat = conversations.find(c => !c.isGroup && c.participants.some(p => p.username === 'Dharma Guide'));
        
        if (existingBotChat) {
            setSelectedConversation(existingBotChat);
            return;
        }

        // 2. If not, try to find the bot user to create one
        try {
            const usersRes = await api.get('/api/users');
            const botUser = usersRes.data.find(u => u.username === 'Dharma Guide');
            
            if (botUser) {
                const createRes = await api.post('/api/conversations', { recipientId: botUser.id });
                setSelectedConversation(createRes.data);
                loadConversations();
            } else {
                alert("Dharma Guide is currently meditating (offline). Please try again later.");
            }
        } catch (err) {
            console.error("Failed to connect to Dharma:", err);
        }
    };

    return (
        <div className='h-screen flex bg-[#050505] overflow-hidden font-sans text-[#f2e8cf]'>
            {/* Sidebar (Cosmic Glass) */}
            <div className='w-80 flex flex-col border-r border-[#DAA520]/20 bg-[#0d0d15]/90 backdrop-blur-md relative z-10'>
                
                {/* 1. Sidebar Header */}
                <div className='p-6 border-b border-[#DAA520]/10'>
                    <div className='flex items-center justify-between mb-6'>
                         <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 rounded-full border border-[#DAA520] flex items-center justify-center text-[#DAA520] font-spiritual text-lg'>
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className='font-spiritual text-[#DAA520] tracking-widest text-lg uppercase'>{user?.username || 'SEEKER'}</span>
                         </div>
                    </div>

                    <div className='space-y-3'>
                        <button 
                            className='w-full py-3 bg-[#DAA520]/10 border border-[#DAA520] text-[#DAA520] text-xs font-spiritual tracking-[2px] hover:bg-[#DAA520] hover:text-black transition-all duration-500 shadow-[0_0_10px_rgba(218,165,32,0.1)] hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] flex items-center justify-center gap-2' 
                            onClick={handleAskDharma}
                        >
                            <span>🕉️</span> ASK DHARMA
                        </button>
                        
                        <div className='flex gap-2'>
                            <button 
                                className='flex-1 py-2 border border-[#DAA520]/30 text-[#DAA520]/80 text-[10px] font-spiritual tracking-[1px] hover:bg-[#DAA520]/10 hover:border-[#DAA520] transition bg-transparent' 
                                onClick={() => setShowNewChatModal(true)}
                            >
                                NEW CONNECTION
                            </button>
                            <button 
                                className='w-10 flex items-center justify-center border border-[#DAA520]/30 text-[#DAA520]/80 hover:bg-[#DAA520]/10 hover:border-[#DAA520] transition' 
                                onClick={() => setShowCreateGroupModal(true)}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Sidebar List */}
                <div className='flex-1 overflow-y-auto custom-scrollbar p-0'>
                   {conversations.map(c => (
                        <div 
                            key={c.id} 
                            className={`p-4 border-b border-[#DAA520]/5 cursor-pointer transition-all duration-300 hover:bg-[#DAA520]/5 ${selectedConversation?.id === c.id ? 'bg-[#DAA520]/10 border-l-2 border-l-[#DAA520]' : 'border-l-2 border-l-transparent'}`}
                            onClick={() => setSelectedConversation(c)}
                        >
                            <div className='flex items-center gap-4'>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${c.isGroup ? 'bg-indigo-900/50 text-indigo-300' : 'bg-[#1a1b41] text-[#DAA520]'}`}>
                                    {c.isGroup ? 'GRP' : c.name.substring(0,2).toUpperCase()}
                                </div>
                                <div className='flex-1'>
                                    <div className='font-spiritual text-sm text-[#f2e8cf] tracking-wide'>{c.name}</div>
                                    <div className='text-[10px] text-[#DAA520]/60 mt-1 uppercase tracking-wider'>{c.isGroup ? 'Sacred Circle' : 'Connection'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                {isMe && <span>✓</span>}
                                            </div>
                                            
                                            <div className='absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition'>
                                                 <MessageActions 
                                                    message={msg} 
                                                    isMe={isMe} 
                                                    onReply={() => {}}
                                                    onDelete={() => {}}
                                                    onEdit={() => {}} 
                                                    onReact={() => {}}
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
                                SELECT A CONNECTION TO BEGIN TRANSMISSION.<br/>
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
