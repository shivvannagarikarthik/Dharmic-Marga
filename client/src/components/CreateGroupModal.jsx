import React, { useState } from 'react';
import api from '../services/api';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // DEBUG: Modified handleSearch
    const handleSearch = async (query) => {
        setSearchQuery(query);
        console.log("CreateGroup: Searching for:", query);

        // Relaxed constraint: > 0 (allow 1 char search)
        if (query.trim().length > 0) {
            try {
                const res = await api.get(`/api/chat/users/search?query=${query}`);
                console.log("CreateGroup: API Response:", res.data);

                // Filter out already selected users
                const filtered = res.data.filter(u => !selectedUsers.find(sel => sel.id === u.id));
                setSearchResults(filtered);

                if (filtered.length === 0 && res.data.length > 0) {
                    console.log("CreateGroup: Users found but all are already selected.");
                } else if (res.data.length === 0) {
                    console.log("CreateGroup: No users found in DB matching query.");
                }

            } catch (error) {
                console.error('CreateGroup: Search failed', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const toggleUser = (user) => {
        console.log("CreateGroup: Toggling user", user.username);
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
        // Remove from search results to avoid duplicate selection visually
        setSearchResults(searchResults.filter(u => u.id !== user.id));
        setSearchQuery(''); // UX: Clear search on selection
    };

    const handleSubmit = async () => {
        if (!name.trim()) return alert('Group name required');
        if (selectedUsers.length === 0) return alert('Select at least one member');

        setLoading(true);
        try {
            console.log("CreateGroup: Submitting group", { name, participants: selectedUsers.map(u => u.id) });
            await api.post('/api/groups', {
                name,
                participantIds: selectedUsers.map(u => u.id)
            });
            onGroupCreated();
            onClose();
        } catch (error) {
            console.error('Create group failed', error);
            alert('Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96 max-w-full">
                <h2 className="text-xl text-white font-bold mb-4">Create Group</h2>

                <input
                    type="text"
                    placeholder="Group Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded p-2 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                />

                <div className="mb-4 relative">
                    <input
                        type="text"
                        placeholder="Search Users..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    />

                    {searchResults.length > 0 && (
                        <div className="absolute w-full mt-1 bg-gray-700 max-h-32 overflow-y-auto rounded shadow-xl z-10">
                            {searchResults.map(user => (
                                <div key={user.id} onClick={() => toggleUser(user)} className="p-2 hover:bg-gray-600 cursor-pointer text-white flex items-center gap-2 border-b border-gray-600/50 last:border-0">
                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">{user.username[0].toUpperCase()}</div>
                                    {user.username}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Debug UI: Text Feedback */}
                    {searchQuery.length > 0 && searchResults.length === 0 && (
                        <div className="absolute w-full mt-1 bg-gray-700 p-2 text-gray-400 text-xs text-center rounded shadow z-10">
                            No users found
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <h3 className="text-gray-400 text-sm mb-2">Selected Members ({selectedUsers.length})</h3>
                    <div className="flex flex-wrap gap-2 min-h-[30px] p-2 bg-black/20 rounded">
                        {selectedUsers.length === 0 && <span className="text-gray-600 text-xs italic">No members selected</span>}
                        {selectedUsers.map(user => (
                            <span key={user.id} className="bg-purple-900 text-purple-200 text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-fade-in">
                                {user.username}
                                <button onClick={() => toggleUser(user)} className="hover:text-white font-bold ml-1">×</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition shadow-lg">
                        {loading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
