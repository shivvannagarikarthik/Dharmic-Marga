import React, { useState, useEffect } from 'react';
import api from '../services/api';

const NewChatModal = ({ onClose, onChatCreated }) => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/api/users');
                setUsers(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startChat = async (userId) => {
        console.log("Starting chat with user:", userId);
        try {
            const res = await api.post('/api/conversations', { recipientId: userId });
            console.log("Chat created/found:", res.data);
            onChatCreated();
            onClose();
        } catch (err) {
            console.error("Failed to start chat:", err);
            alert("Failed to start conversation. Please check console for details.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d0d15] w-full max-w-md rounded-2xl border border-[#DAA520]/30 shadow-[0_0_50px_rgba(218,165,32,0.1)] overflow-hidden">
                <div className="p-4 border-b border-[#DAA520]/20 flex justify-between items-center bg-[#DAA520]/5">
                    <h2 className="text-[#DAA520] font-spiritual tracking-widest text-lg">NEW CHAT</h2>
                    <button onClick={onClose} className="text-[#DAA520]/50 hover:text-[#DAA520]">✕</button>
                </div>

                <div className="p-4 bg-[#0d0d15]">
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-[#DAA520]/40">🔍</span>
                        <input
                            type="text"
                            placeholder="Search seekers..."
                            className="w-full bg-[#1a1b41]/30 border border-[#DAA520]/20 rounded-lg py-2 pl-10 pr-4 text-[#f2e8cf] focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none font-sans"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            onClick={() => startChat(user.id)}
                            className="flex items-center gap-3 p-3 hover:bg-[#DAA520]/10 rounded-lg cursor-pointer transition group border border-transparent hover:border-[#DAA520]/10"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#1a1b41] text-[#DAA520] flex items-center justify-center font-bold border border-[#DAA520]/20 group-hover:border-[#DAA520]">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.username[0].toUpperCase()
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[#f2e8cf] font-medium group-hover:text-[#DAA520] transition font-spiritual tracking-wide">{user.username}</h3>
                                {user.bio && <p className="text-[10px] text-[#DAA520]/50 truncate max-w-[180px]">{user.bio}</p>}
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="text-center p-8 text-[#DAA520]/30 text-sm">
                            No souls found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewChatModal;
