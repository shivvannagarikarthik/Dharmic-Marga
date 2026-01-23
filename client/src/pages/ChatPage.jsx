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

    return (
        <div className='h-screen flex text-[#f2e8cf] bg-black overflow-hidden'>
            {/* Sidebar */}
            <div className='w-80 flex flex-col border-r border-[#f2e8cf]/20 bg-[#050505]'>

                {/* 1. Sidebar Header (Fixed at top) */}
                <div className='p-4 border-b border-[#f2e8cf]/10'>
                    <h1 className='text-xl font-bold mb-4 text-[#DAA520] tracking-wider'>Dharmic Marga</h1>
                    <div className='flex gap-2'>
                        <button
                            className='flex-1 py-2 bg-[#DAA520] text-black rounded font-bold hover:bg-[#b8860b] transition shadow-lg'
                            onClick={() => setShowNewChatModal(true)}
                        >
                            NEW CHAT
                        </button>
                        <button
                            className='flex-1 py-2 bg-transparent text-[#DAA520] border border-[#DAA520] rounded font-bold hover:bg-[#DAA520]/10 transition'
                            onClick={() => setShowCreateGroupModal(true)}
                        >
                            GROUP
                        </button>
                    </div>
                </div>

                {/* 2. Sidebar List (Scrollable middle) */}
                <div className='flex-1 overflow-y-auto custom-scrollbar p-2'>
                    {conversations.length === 0 && (
                        <div className="text-center text-gray-500 mt-10">No chats yet</div>
                    )}
                    {conversations.map(c => (
                        <div
                            key={c.id}
                            className={`p-3 mb-1 rounded flex flex-col cursor-pointer transition ${selectedConversation?.id === c.id ? 'bg-[#DAA520]/20 border border-[#DAA520]/30' : 'hover:bg-white/5 border border-transparent'}`}
                            onClick={() => setSelectedConversation(c)}
                        >
                            <div className='font-bold text-[#f2e8cf]'>{c.name}</div>
                            <div className='text-xs text-gray-400 flex justify-between'>
                                <span>{c.isGroup ? 'Group' : 'Direct Message'}</span>
                                {c.lastMessage && <span>{new Date(c.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Sidebar Footer (Fixed at bottom) */}
                <div className='p-4 border-t border-[#f2e8cf]/10 bg-[#0a0a0a]'>
                    <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                            <div className='w-8 h-8 rounded-full bg-[#DAA520] flex items-center justify-center text-black font-bold'>
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className='text-sm font-medium'>{user?.username}</div>
                        </div>
                    </div>
                    <div className='flex gap-2 mt-3'>
                        <button
                            onClick={() => navigate('/settings')}
                            className='flex-1 py-1.5 text-xs text-[#DAA520] border border-[#DAA520]/50 rounded hover:bg-[#DAA520]/10 transition flex items-center justify-center gap-1'
                        >
                            <span>⚙️</span> Settings
                        </button>
                        <button
                            onClick={logout}
                            className='flex-1 py-1.5 text-xs text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition'
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className='flex-1 flex flex-col bg-[#0a0a0a] relative'>
                {selectedConversation ? (
                    <>
                        <div className='h-16 border-b border-[#f2e8cf]/20 flex items-center px-6 bg-[#111] shadow-md z-10'>
                            <h2 className='text-xl font-bold text-[#f2e8cf]'>{selectedConversation.name}</h2>
                        </div>

                        <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/50'>
                            {messages.map(msg => {
                                const isMe = msg.sender.id === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg relative group shadow-sm ${isMe ? 'bg-[#DAA520] text-black rounded-tr-none' : 'bg-[#222] text-[#f2e8cf] rounded-tl-none'}`}>
                                            <div className='break-words'>{msg.text}</div>
                                            <div className='text-[10px] opacity-70 mt-1 flex justify-end items-center gap-1'>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && <span>✓</span>}
                                            </div>

                                            <div className='absolute top-0 -right-8 opacity-0 group-hover:opacity-100 transition'>
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

                        <div className='p-4 bg-[#111] border-t border-[#f2e8cf]/20'>
                            <form onSubmit={handleSendMessage} className='flex items-center gap-2'>
                                <MediaUpload onFileSelect={(file) => console.log('File selected:', file)} />

                                <input
                                    type='text'
                                    className='flex-1 bg-[#222] text-[#f2e8cf] border-none rounded-full px-4 py-2 focus:ring-1 focus:ring-[#DAA520] outline-none placeholder-gray-600'
                                    placeholder='Type a message...'
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />

                                <button type='submit' className='p-2 bg-[#DAA520] rounded-full text-black hover:bg-[#b8860b] transition disabled:opacity-50' disabled={!newMessage.trim()}>
                                    <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className='flex-1 flex flex-col items-center justify-center text-[#f2e8cf]/30'>
                        <div className='text-6xl mb-4 opacity-50'>🕉️</div>
                        <div className='text-xl font-light'>Select a chat to begin your journey</div>
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
