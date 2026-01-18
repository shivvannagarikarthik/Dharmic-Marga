import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MediaUpload from '../components/MediaUpload';

const SettingsPage = () => {
    const { user, login } = useContext(AuthContext); 
    const navigate = useNavigate();
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
            alert('Spirit Connection Updated (Profile Saved)');
        } catch (err) {
            console.error(err);
            alert('Alignment failed');
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
            alert('Key must be 4 digits');
            return;
        }
        localStorage.setItem('app_lock_enabled', lockEnabled);
        localStorage.setItem('app_pin', pin);
        alert('Sanctuary Secured');
    };

    return (
        <div className="h-[100dvh] flex flex-col items-center p-4 md:p-8 relative overflow-hidden text-[#f2e8cf] font-spiritual">
            {/* Background */}
             <div className="fixed inset-0 z-[-1]">
                <img 
                    src="/bg-himalayas.png" 
                    alt="Himalayan Sky" 
                    className="w-full h-full object-cover object-bottom md:object-center opacity-40"
                />
                <div className="absolute inset-0 bg-black/80"></div>
            </div>

            <div className="w-full max-w-lg relative z-10 flex flex-col gap-6">
                
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-[#DAA520]/30 pb-4">
                    <button onClick={() => navigate('/chat')} className="w-10 h-10 rounded-full border border-[#DAA520]/50 flex items-center justify-center hover:bg-[#DAA520]/20 text-[#DAA520] transition bg-black/40 backdrop-blur-md">
                        <span className="text-xl pb-1">←</span>
                    </button>
                    <h1 className="text-xl md:text-3xl font-bold tracking-[0.2em] uppercase text-[#DAA520]">Sanctuary Settings</h1>
                </div>

                <div className="bg-black/40 backdrop-blur-md border border-[#f2e8cf]/10 p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Profile Section */}
                    <div>
                        <h2 className="text-[#DAA520] text-sm uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                             <span>☸</span> Essence (Profile)
                        </h2>
                        
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#DAA520] mb-4 relative group shadow-[0_0_20px_rgba(218,165,32,0.3)]">
                                <img src={avatarUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition">
                                    <div className="text-[10px] uppercase tracking-widest text-[#DAA520]"><MediaUpload onFileSelect={handleAvatarUpload} /></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="group">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#f2e8cf]/50 mb-2">Identity Name</label>
                                <input 
                                    className="w-full bg-black/30 border-b border-[#DAA520]/30 focus:border-[#DAA520] text-[#f2e8cf] py-2 px-1 outline-none transition tracking-wide"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="group">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#f2e8cf]/50 mb-2">Mantra (Bio)</label>
                                <textarea 
                                    className="w-full bg-black/30 border-b border-[#DAA520]/30 focus:border-[#DAA520] text-[#f2e8cf] py-2 px-1 outline-none transition tracking-wide h-20 resize-none"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="w-full py-3 border border-[#DAA520] text-[#DAA520] hover:bg-[#DAA520] hover:text-black transition uppercase text-xs tracking-[0.3em] font-bold rounded-sm shadow-[0_0_15px_rgba(218,165,32,0.1)]"
                            >
                                {loading ? 'Aligning...' : 'Update Essence'}
                            </button>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="pt-6 border-t border-[#f2e8cf]/10">
                         <h2 className="text-[#DAA520] text-sm uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <span>🔒</span> Protection (Security)
                         </h2>
                         <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                                <label className="text-sm tracking-widest text-[#f2e8cf]/80">App Lock (PIN)</label>
                                <input 
                                    type="checkbox" 
                                    checked={lockEnabled} 
                                    onChange={e => setLockEnabled(e.target.checked)}
                                    className="w-5 h-5 accent-[#DAA520]"
                                />
                            </div>
                            
                            {lockEnabled && (
                                <div className="animate-fade-in">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#f2e8cf]/50 mb-2">Secret Key (4 Digits)</label>
                                    <input 
                                        type="password" 
                                        maxLength="4"
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        className="w-full bg-black/30 border-b border-[#DAA520]/30 focus:border-[#DAA520] text-[#f2e8cf] py-2 px-1 text-center text-2xl tracking-[1em] outline-none"
                                        placeholder="••••"
                                    />
                                </div>
                            )}

                            <button 
                                onClick={handleSaveSecurity}
                                className="w-full py-3 bg-[#DAA520]/10 hover:bg-[#DAA520]/20 text-[#DAA520] border border-[#DAA520]/30 transition uppercase text-xs tracking-[0.3em] font-bold rounded-sm"
                            >
                                Seal Sanctuary
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
