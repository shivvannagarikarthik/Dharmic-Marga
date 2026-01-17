import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const GroupInfoModal = ({ group, onClose, onUpdate }) => {
  const { user } = useContext(AuthContext);
  const [groupInfo, setGroupInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadGroupInfo();
  }, [group.id]);

  const loadGroupInfo = async () => {
    try {
      const res = await api.get(`/api/groups/${group.id}`);
      setGroupInfo(res.data);
      const currentUserPart = res.data.Users.find(u => u.id === user.id);
      setIsAdmin(currentUserPart?.ConversationParticipant?.role === 'admin');
    } catch (error) {
      console.error('Load group info failed', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const res = await api.get(`/api/chat/users/search?query=${query}`);
      // Filter out existing members
      const existingIds = groupInfo.Users.map(u => u.id);
      setSearchResults(res.data.filter(u => !existingIds.includes(u.id)));
    } else {
      setSearchResults([]);
    }
  };

  const addMember = async (newUserId) => {
    try {
        await api.post(`/api/groups/${group.id}/participants`, { userIds: [newUserId] });
        loadGroupInfo();
        setSearchQuery('');
        setSearchResults([]);
    } catch (err) {
        alert('Failed to add member');
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove user?')) return;
    try {
        await api.delete(`/api/groups/${group.id}/participants/${memberId}`);
        loadGroupInfo();
    } catch (err) {
        alert('Failed to remove member');
    }
  };

  const leaveGroup = async () => {
    if (!confirm('Leave group?')) return;
    try {
        await api.post(`/api/groups/${group.id}/leave`);
        onUpdate(); 
        onClose();
    } catch (err) {
        alert('Failed to leave group');
    }
  };

  if (!groupInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96 max-w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-white font-bold">{groupInfo.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
            <h3 className="text-gray-400 text-xs uppercase mb-2">Members ({groupInfo.Users.length})</h3>
            {groupInfo.Users.map(member => (
                <div key={member.id} className="flex justify-between items-center p-2 hover:bg-gray-700 rounded">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {member.username[0]}
                        </div>
                        <div>
                            <p className="text-white text-sm">{member.username}</p>
                            <span className="text-xs text-gray-500">
                                {member.ConversationParticipant.role}
                            </span>
                        </div>
                    </div>
                    {isAdmin && member.id !== user.id && (
                        <button onClick={() => removeMember(member.id)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                    )}
                </div>
            ))}
        </div>

        {isAdmin && (
            <div className="border-t border-gray-700 pt-4 mb-4">
                <button 
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-2"
                >
                    + Add Member
                </button>
                
                {showAddMember && (
                    <div className="mt-2">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-gray-900 text-white rounded p-2 text-sm"
                        />
                        {searchResults.length > 0 && (
                            <div className="bg-gray-900 mt-1 max-h-24 overflow-y-auto rounded">
                                {searchResults.map(u => (
                                    <div key={u.id} onClick={() => addMember(u.id)} className="p-2 hover:bg-gray-700 cursor-pointer text-white text-sm">
                                        {u.username}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        <button onClick={leaveGroup} className="w-full text-red-500 hover:bg-red-500/10 p-2 rounded text-sm">
            Leave Group
        </button>
      </div>
    </div>
  );
};

export default GroupInfoModal;
