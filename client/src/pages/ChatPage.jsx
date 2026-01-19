import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import api from '../services/api';
import MediaUpload from '../components/MediaUpload';
import MediaMessage from '../components/MediaMessage';
import VoiceRecorder from '../components/VoiceRecorder';
import CallInterface from '../components/CallInterface';
import MessageActions from '../components/MessageActions';
import ReplyPreview from '../components/ReplyPreview';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupInfoModal from '../components/GroupInfoModal';
import MessageStatus from '../components/MessageStatus';
import DisappearingTimerModal from '../components/DisappearingTimerModal';
import StickerPicker from '../components/StickerPicker';
import 'leaflet/dist/leaflet.css'; 

const ChatPage = () => {
  const { user, logout, loading } = useContext(AuthContext); 
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [callType, setCallType] = useState('voice');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  
  const messagesEndRef = useRef(null);

  if (loading) {
     return <div className="h-screen flex items-center justify-center text-[#DAA520] font-spiritual">Attuning Frequency...</div>;
  }
  
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
        const socket = getSocket();
        if (socket) {
            socket.emit('mark_read', { conversationId: selectedConversation.id });
        }
    }
  }, [selectedConversation, messages.length]);

  useEffect(() => {
    loadConversations();
    const socket = getSocket();
    if (socket) {
      socket.on('new_message', (message) => { console.log('NOTIF CHECK:', Notification.permission, message.senderId, user.id); if (Notification.permission === 'granted' && String(message.senderId) !== String(user?.id)) { navigator.serviceWorker.ready.then(reg => reg.showNotification('New Dharma Message', { body: message.content, icon: '/vite.svg', vibrate: [200] })); }
        if (selectedConversation && message.conversationId === selectedConversation.id) {
          setMessages((prev) => [...prev, message]);
           socket.emit('mark_read', { conversationId: selectedConversation.id });
        }
        loadConversations();
      });
      socket.on('message_deleted', ({ messageId }) => {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isDeleted: true, content: 'Frequency Interrupted', mediaUrl: null } 
            : msg
        ));
      });
      socket.on('message_edited', ({ messageId, content }) => {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? { ...msg, content, editedAt: new Date() } : msg
        ));
      });
      socket.on('message_reaction', ({ messageId, userId, emoji }) => {
        setMessages((prev) => prev.map(msg => {
          if (msg.id !== messageId) return msg;
          const reactions = { ...(msg.reactions || {}) };
          if (reactions[userId] === emoji) {
            delete reactions[userId];
          } else {
            reactions[userId] = emoji;
          }
          return { ...msg, reactions };
        }));
      });
      socket.on('messages_read', ({ messageIds, userId }) => {
         if (selectedConversation) {
             setMessages(prev => prev.map(msg => {
                 if (messageIds.includes(msg.id)) {
                     const readBy = msg.readBy || [];
                     if (!readBy.find(r => r.userId === userId)) {
                         readBy.push({ userId, readAt: new Date() });
                     }
                     return { ...msg, readBy };
                 }
                 return msg;
             }));
         }
      });
      socket.on('timer_updated', ({ conversationId, timer }) => {
          if (selectedConversation && selectedConversation.id === conversationId) {
              setSelectedConversation(prev => ({ ...prev, messageTimer: timer }));
          }
          loadConversations();
      });
    }
    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('message_deleted');
        socket.off('message_edited');
        socket.off('message_reaction');
        socket.off('messages_read');
        socket.off('timer_updated');
      }
    };
  }, [selectedConversation, user]);

  const loadConversations = async () => {
    try {
      const response = await api.get('/api/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await api.get(`/api/chat/messages/${conversationId}`);
      // Client-side Sort to prevent order jumping
      const sorted = response.data.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(sorted);
      const socket = getSocket();
      if (socket) {
          socket.emit('join_conversation', conversationId);
          socket.emit('mark_read', { conversationId });
      }
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    if (editingMessage) { handleCompleteEdit(); return; }
    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { conversationId: selectedConversation.id, content: newMessage, type: 'text', replyToId: replyTo?.id });
      setNewMessage(''); setReplyTo(null);
    }
  };
  const handleReply = (msg) => { setReplyTo(msg); setEditingMessage(null); };
  const handleDelete = async (mid) => { await api.delete(`/api/chat/messages/${mid}`); const s=getSocket(); s.emit('delete_message', {messageId: mid, conversationId: selectedConversation.id}); };
  const handleEdit = (msg) => { setEditingMessage(msg); setNewMessage(msg.content); setReplyTo(null); };
  const handleCompleteEdit = async () => { await api.put(`/api/chat/messages/${editingMessage.id}`, {content: newMessage}); const s=getSocket(); s.emit('edit_message', {messageId: editingMessage.id, conversationId: selectedConversation.id, content: newMessage}); setEditingMessage(null); setNewMessage(''); };
  const handleReact = async (mid, emoji) => { await api.post(`/api/chat/messages/${mid}/react`, {emoji}); const s=getSocket(); s.emit('react_message', {messageId: mid, conversationId: selectedConversation.id, userId: user.id, emoji}); };
  const startCall = (type) => { setCallType(type); setShowCallInterface(true); };
  const handleFileSelect = async (file) => {
      if (!selectedConversation) return;
      try { const fd = new FormData(); fd.append('file', file);
        const res = await api.post('/api/upload/file', fd, {headers:{'Content-Type':'multipart/form-data'}});
        const { url, type, fileName, fileSize, mimeType } = res.data.file;
        const socket = getSocket();
        if(socket) socket.emit('send_message', {conversationId: selectedConversation.id, content:'', type, mediaUrl: url, mediaType: mimeType, fileName, fileSize});
      } catch(e) {}
  };
  const handleStartAIChat = async () => {
        try {
            let botUser = null;
            try { const res = await api.get('/api/chat/bot'); botUser = res.data; } catch(e){}
            if(!botUser) return alert('AI spirit not found.');
            const convRes = await api.post('/api/chat/conversations', { recipientId: botUser.id });
            setSelectedConversation(convRes.data); loadMessages(convRes.data.id); loadConversations();
        } catch(e) { alert('Connection hindered'); }
  };
    
    useEffect(() => {
    if (!selectedConversation) return;
    const fetchStatus = async () => {
        if (selectedConversation.type === 'group') return;
        const other = selectedConversation.Users?.find(u => u.id !== user.id);
        if (other) { try { const res = await api.get(`/api/users/${other.id}/status`); setOtherUserStatus(res.data); } catch(e){} }
    };
    fetchStatus();
    const i = setInterval(fetchStatus, 30000); return () => clearInterval(i);
  }, [selectedConversation, user.id]);

  return (
    <div className="h-[100dvh] flex text-[#f2e8cf] font-sans antialiased overflow-hidden relative">
      {/* Background Image (Responsive Position - Center on Mobile) */}
      <div className="fixed inset-0 z-[-1]">
          <img 
            src="/bg-om-cosmic.png" 
            alt="Cosmic Om Background" 
            className="w-full h-full object-cover transition-all duration-1000 ease-in-out md:object-[calc(50%+10rem)_center] object-center"
          />
          <div className="absolute inset-0 bg-black/30"></div>
      </div>

       {showCallInterface && <CallInterface receiverId={selectedConversation?.Users?.[0]?.id} callType={callType} onClose={() => setShowCallInterface(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onGroupCreated={loadConversations} />}
      {showGroupInfo && selectedConversation && <GroupInfoModal group={selectedConversation} onClose={() => setShowGroupInfo(false)} onUpdate={() => { loadConversations(); setSelectedConversation(null); }} />}
      {showTimerModal && <DisappearingTimerModal currentTimer={selectedConversation?.messageTimer} onClose={() => setShowTimerModal(false)} onSetTimer={val => {const s=getSocket(); if(s) s.emit('update_disappearing_timer', {conversationId: selectedConversation.id, timer: val}); setShowTimerModal(false); }} />}

      {/* --- SIDEBAR --- */}
      <div className={`w-full md:w-80 flex flex-col border-r border-[#f2e8cf]/20 bg-black/40 backdrop-blur-md ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-6 border-b border-[#f2e8cf]/20 flex justify-between items-center bg-black/20">
             <div onClick={() => window.location.href='/settings'} className="cursor-pointer group flex items-center gap-3">
                 <div className="w-10 h-10 border border-[#DAA520] rounded-full flex items-center justify-center text-[#DAA520] font-spiritual text-lg group-hover:bg-[#DAA520] group-hover:text-black transition">
                     {user?.username.charAt(0).toUpperCase()}
                 </div>
                 <h2 className="font-spiritual text-[#f2e8cf] tracking-widest text-lg font-bold">{user?.username}</h2>
             </div>
             <button onClick={logout} className="text-[#f2e8cf]/70 hover:text-[#DAA520] transition text-xl">⏻</button>
          </div>
          
          {/* Action Bar */}
          <div className="flex p-4 gap-2">
               <button onClick={handleStartAIChat} className="flex-1 py-3 border border-[#DAA520]/50 text-[#DAA520] hover:bg-[#DAA520]/10 transition uppercase text-xs tracking-[0.2em] font-bold rounded-sm shadow-[0_0_10px_rgba(218,165,32,0.1)]">
                   Ask Dharma
               </button>
                <button onClick={() => setShowCreateGroup(true)} className="px-4 py-3 bg-white/10 text-white hover:bg-white/20 transition border border-white/20 rounded-sm">
                   +
               </button>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {conversations.map(c => (
                  <div key={c.id} onClick={() => handleSelectConversation(c)}
                       className={`p-4 border-b border-[#f2e8cf]/10 cursor-pointer hover:bg-white/10 transition flex items-center gap-4 ${selectedConversation?.id === c.id ? 'bg-white/10 border-l-4 border-l-[#DAA520]' : 'border-l-4 border-l-transparent'}`}>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-[#f2e8cf]/30 text-[#f2e8cf] font-spiritual ${c.type === 'group' ? 'bg-blue-900/40' : 'bg-transparent'}`}>
                           {c.type === 'group' ? '👥' : (c.name === 'AI Assistant' ? '🕉️' : c.name.charAt(0))}
                       </div>
                       <div className="flex-1 overflow-hidden">
                           <div className="flex justify-between items-center mb-1">
                               <h3 className={`font-spiritual tracking-wide text-sm font-bold ${selectedConversation?.id === c.id ? 'text-[#DAA520] drop-shadow-sm' : 'text-[#f2e8cf]'}`}>{c.name === 'AI Assistant' ? 'Dharma Guide' : c.name}</h3>
                               {c.messageTimer > 0 && <span className="text-[#DAA520] text-[10px]">⏳</span>}
                           </div>
                           <p className={`text-xs truncate font-light tracking-wide ${selectedConversation?.id === c.id ? 'text-[#f2e8cf]/90' : 'text-[#f2e8cf]/60'}`}>{c.Messages?.[0]?.content || "Silence..."}</p>
                       </div>
                  </div>
              ))}
          </div>
      </div>

      {/* --- MAIN CHAT --- */}
      <div className={`flex-1 flex flex-col relative ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          
          {selectedConversation ? (
              <>
                <div className="p-4 border-b border-[#f2e8cf]/20 flex justify-between items-center z-10 bg-black/50 backdrop-blur-md">
                    <div className="flex items-center gap-2 md:gap-4 cursor-pointer" onClick={() => { if(selectedConversation.type === 'group') setShowGroupInfo(true); }}>
                        {/* Back Button for Mobile - Improved Size */}
                        <button onClick={() => setSelectedConversation(null)} className="md:hidden text-[#DAA520] mr-1 p-2 active:bg-white/10 rounded-full transition">
                            <span className="text-xl">←</span>
                        </button>

                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#DAA520]/60 flex items-center justify-center text-[#DAA520] font-spiritual text-base md:text-xl ${selectedConversation.type === 'group' ? 'bg-blue-900/30' : 'bg-transparent'}`}>
                             {selectedConversation.type === 'group' ? '👥' : selectedConversation.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-spiritual text-[#f2e8cf] tracking-widest flex items-center gap-3 font-bold drop-shadow-md">
                                {selectedConversation.name === 'AI Assistant' ? 'Dharma Guide' : selectedConversation.name}
                                {selectedConversation.type !== 'group' && otherUserStatus?.status === 'online' && <span className="w-2 h-2 bg-[#DAA520] rounded-full shadow-[0_0_10px_#DAA520] animate-pulse"></span>}
                            </h2>
                            <p className="text-[10px] text-[#f2e8cf]/60 uppercase tracking-[0.3em]">
                                {selectedConversation.type === 'group' ? 'Circle' : 'Connection'} {selectedConversation.messageTimer > 0 && '• Ephemeral'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-4 text-[#f2e8cf]/80">
                         {/* Icons hidden or smaller on very small screens if needed, but flex gap handles it */}
                        <button onClick={() => setShowTimerModal(true)} className="hover:text-[#DAA520] transition hover:scale-110 p-2">⏳</button>
                        <button onClick={() => startCall('voice')} className="hover:text-[#DAA520] transition hover:scale-110 p-2">📞</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-8 z-10">
                    {messages.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map(m => {
                        const isMe = m.senderId === user.id;
                        return (
                            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {m.ReplyTo && <div className="text-xs text-[#f2e8cf]/70 mb-1 border-l border-[#DAA520] pl-2 italic">Reflecting: {m.ReplyTo.content}</div>}
                                
                                <div className="group flex items-end gap-3 max-w-[85%] md:max-w-[70%]">
                                    {!isMe && <MessageActions message={m} isMe={isMe} onReply={handleReply} onReact={handleReact} />}
                                    
                                    <div className={`p-3 md:p-4 backdrop-blur-md border ${isMe ? 'bg-[#DAA520]/20 border-[#DAA520]/50 text-[#f2e8cf] rounded-t-xl rounded-bl-xl shadow-[0_0_15px_rgba(218,165,32,0.2)]' : 'bg-black/60 border-white/20 text-[#f2e8cf] rounded-t-xl rounded-br-xl'}`}>
                                        {m.type === 'text' ? <p className="text-sm leading-relaxed tracking-wide font-normal">{m.content}</p> : <MediaMessage message={m} isSent={isMe} />}
                                        <div className="flex justify-end items-center gap-2 mt-2 opacity-60">
                                            <span className="text-[10px] uppercase tracking-widest">{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            {isMe && <MessageStatus status={m.status} readBy={m.readBy} isGroup={selectedConversation.type === 'group'} />}
                                        </div>
                                    </div>
                                    
                                    {isMe && <MessageActions message={m} isMe={isMe} onReply={handleReply} onDelete={handleDelete} onEdit={handleEdit} onReact={handleReact} />}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 md:p-6 pt-0 z-20">
                     <div className="bg-black/60 border border-[#f2e8cf]/20 p-2 flex flex-col gap-2 relative backdrop-blur-xl shadow-2xl rounded-lg">
                         {replyTo && <div className="p-2 bg-white/10 text-[#DAA520] text-xs flex justify-between italic border-l-2 border-[#DAA520]"><span>Reflecting on {replyTo.content}</span><button onClick={() => setReplyTo(null)}>×</button></div>}
                         
                         <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4 px-2">
                             <div className="flex gap-2 text-[#f2e8cf]/70">
                                 <MediaUpload onFileSelect={handleFileSelect} />
                                 <button type="button" onClick={() => setShowStickerPicker(!showStickerPicker)} className="hover:text-[#DAA520] transition">✦</button>
                             </div>
                             
                             <input 
                                type="text" 
                                value={newMessage} 
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Transmit thought..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-[#f2e8cf] placeholder-[#f2e8cf]/40 font-normal tracking-wider text-sm md:text-base"
                             />
                             
                             <button type="submit" disabled={!newMessage.trim()} className="text-[#DAA520] font-bold text-xl hover:scale-110 transition disabled:opacity-50 drop-shadow-md">
                                 ➢
                             </button>
                         </form>
                         {showStickerPicker && <div className="absolute bottom-full left-0 mb-2"><StickerPicker onSelect={url => {const s=getSocket(); if(s) { s.emit('send_message', {conversationId: selectedConversation.id, content:'Sticker', type:'sticker', mediaUrl: url}); setShowStickerPicker(false); }}} onClose={() => setShowStickerPicker(false)} /></div>}
                     </div>
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center z-10 p-10 hidden md:flex">
                  <div className="w-48 h-48 border-2 border-[#DAA520] rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_80px_rgba(218,165,32,0.15)] bg-black/20 backdrop-blur-sm">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-[#DAA520] drop-shadow-[0_0_15px_rgba(218,165,32,0.6)]">
                          <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" fillOpacity="0.8"/>
                          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                      </svg>
                  </div>
                  <h1 className="text-5xl font-spiritual text-[#f2e8cf] mb-4 tracking-[0.3em] uppercase drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(242, 232, 207, 0.3)' }}>Void</h1>
                  <p className="text-[#f2e8cf] uppercase tracking-[0.2em] text-sm max-w-sm leading-loose font-medium opacity-80">
                      Select a connection to begin transmission.<br/>Silence is also an answer.
                  </p>
              </div>
          )}
      </div>
    </div>
  );
};

export default ChatPage;
