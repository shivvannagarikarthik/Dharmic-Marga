import React, { useState } from 'react';
import api from '../services/api';

const NewChatModal = ({ onClose, onUserSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length > 0) {
            setLoading(true);
            try {
                const res = await api.get(`/api/chat/users/search?query=${query}`);
                setSearchResults(res.data);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
            <div className="bg-[#0a0f1c] border border-indigo-900/50 p-6 rounded-xl w-96 max-w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl text-[#f2e8cf] font-spiritual tracking-wide">New Chat</h2>
                    <button onClick={onClose} className="text-indigo-400 hover:text-[#f2e8cf] transition">✕</button>
                </div>

                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search People..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        autoFocus
                        className="w-full bg-indigo-900/20 text-[#f2e8cf] rounded-lg p-3 pl-10 border border-indigo-500/20 focus:border-amber-500/50 outline-none transition placeholder-indigo-400/50"
                    />
                    <span className="absolute left-3 top-3.5 text-indigo-400">🔍</span>
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 min-h-[100px]">
                    {loading && <div className="text-center text-indigo-400 text-xs py-4">Searching database...</div>}

                    {!loading && searchQuery && searchResults.length === 0 && (
                        <div className="text-center text-indigo-400/50 text-xs py-4">No connections found in the void.</div>
                    )}

                    {!loading && !searchQuery && (
                        <div className="text-center text-indigo-400/30 text-xs py-4">Type to search for a soul.</div>
                    )}

                    {searchResults.map(user => (
                        <div
                            key={user.id}
                            onClick={() => onUserSelect(user)}
                            className="p-3 hover:bg-white/5 rounded-lg cursor-pointer flex items-center gap-3 transition group border border-transparent hover:border-indigo-500/30"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-900 to-black border border-indigo-500/30 flex items-center justify-center text-[#f2e8cf] font-bold group-hover:border-amber-500/50 transition">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.username[0].toUpperCase()
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[#f2e8cf] font-medium group-hover:text-amber-500 transition">{user.username}</h3>
                                {user.bio && <p className="text-[10px] text-indigo-400 truncate max-w-[180px]">{user.bio}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewChatModal;
