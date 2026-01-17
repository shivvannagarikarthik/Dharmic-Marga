import React, { useState } from 'react';
import api from '../services/api';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      try {
        const res = await api.get(`/api/chat/users/search?query=${query}`);
        setSearchResults(res.data.filter(u => !selectedUsers.find(sel => sel.id === u.id)));
      } catch (error) {
        console.error('Search failed', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchResults(searchResults.filter(u => u.id !== user.id));
    setSearchQuery('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert('Group name required');
    if (selectedUsers.length === 0) return alert('Select at least one member');

    setLoading(true);
    try {
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
          className="w-full bg-gray-700 text-white rounded p-2 mb-4"
        />

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search Users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-700 text-white rounded p-2"
          />
          
          {searchResults.length > 0 && (
            <div className="bg-gray-700 mt-1 max-h-32 overflow-y-auto rounded">
              {searchResults.map(user => (
                <div key={user.id} onClick={() => toggleUser(user)} className="p-2 hover:bg-gray-600 cursor-pointer text-white flex items-center gap-2">
                   <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs">{user.username[0]}</div>
                   {user.username}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-gray-400 text-sm mb-2">Selected Members ({selectedUsers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <span key={user.id} className="bg-purple-900 text-purple-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {user.username}
                <button onClick={() => toggleUser(user)} className="hover:text-white">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
