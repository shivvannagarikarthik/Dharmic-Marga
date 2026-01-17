import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import MediaUpload from '../components/MediaUpload';

const SettingsPage = () => {
    const { user, login } = useContext(AuthContext); // login used to update user context if needed
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
    const [loading, setLoading] = useState(false);
    
    // Security State
    const [lockEnabled, setLockEnabled] = useState(false);
    const [pin, setPin] = useState('');

    useEffect(() => {
        setLockEnabled(localStorage.getItem('app_lock_enabled') === 'true');
        setPin(localStorage.getItem('app_pin') || '');
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/api/users/profile', { username, bio, avatarUrl });
            alert('Profile updated!');
            // Ideally force refresh user context, simplified here
        } catch (err) {
            console.error(err);
            alert('Failed to update');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (file) => {
         const formData = new FormData();
         formData.append('file', file);
         try {
             const res = await api.post('/api/upload/file', formData);
             setAvatarUrl(res.data.file.url);
         } catch(err) {
             console.error(err);
         }
    };

    const handleSaveSecurity = () => {
        if (lockEnabled && pin.length !== 4) {
            alert('PIN must be 4 digits');
            return;
        }
        localStorage.setItem('app_lock_enabled', lockEnabled);
        localStorage.setItem('app_pin', pin);
        alert('Security settings saved');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex justify-center p-8">
            <div className="w-full max-w-2xl">
                <div className="flex items-center mb-8 gap-4">
                    <button onClick={() => window.location.href='/'} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">←</button>
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

                <div className="bg-gray-800 p-8 rounded-2xl shadow-xl space-y-8">
                    {/* Profile Section */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Profile</h2>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 mb-4 relative group">
                                <img src={avatarUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
                                    <MediaUpload onFileSelect={handleAvatarUpload} />
                                </div>
                            </div>
                            <p className="text-sm text-gray-400">Click to change photo</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Username</label>
                                <input 
                                    className="w-full bg-gray-700 p-3 rounded"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                                <textarea 
                                    className="w-full bg-gray-700 p-3 rounded"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="bg-purple-600 px-6 py-2 rounded font-bold hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div>
                         <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                            Security <span className="text-xs bg-yellow-500 text-black px-2 rounded">New</span>
                         </h2>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-lg">App Lock (Biometric/PIN)</label>
                                <input 
                                    type="checkbox" 
                                    checked={lockEnabled} 
                                    onChange={e => setLockEnabled(e.target.checked)}
                                    className="w-6 h-6 accent-purple-600"
                                />
                            </div>
                            
                            {lockEnabled && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Set 4-Digit PIN</label>
                                    <input 
                                        type="password" 
                                        maxLength="4"
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        className="w-full bg-gray-700 p-3 rounded tracking-widest"
                                        placeholder="0000"
                                    />
                                </div>
                            )}

                            <button 
                                onClick={handleSaveSecurity}
                                className="bg-green-600 px-6 py-2 rounded font-bold hover:bg-green-700"
                            >
                                Save Security Settings
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
