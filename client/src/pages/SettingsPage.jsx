import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MediaUpload from '../components/MediaUpload';

const SettingsPage = () => {
    const { user, login } = useContext(AuthContext); 
    const navigate = useNavigate();
    const [view, setView] = useState('main'); // main, account, privacy, chats, notifications, storage, help
    
    // State for local changes before save
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
    
    // Privacy & Settings (Defaults until loaded)
    const [privacy, setPrivacy] = useState(user?.privacySettings || { lastSeen: 'everyone', readReceipts: true, twoFactorEnabled: false });
    const [appSettings, setAppSettings] = useState(user?.appSettings || { theme: 'cosmic', wallpaper: 'default', fontSize: 'medium', notificationsKey: false });

    // Security (Local)
    const [lockEnabled, setLockEnabled] = useState(false);
    const [pin, setPin] = useState('');

    useEffect(() => {
        setLockEnabled(localStorage.getItem('app_lock_enabled') === 'true');
        setPin(localStorage.getItem('app_pin') || '');
    }, []);

    const handleSave = async () => {
        try {
            await api.put('/api/users/profile', { username, bio, avatarUrl, privacySettings: privacy, appSettings });
            alert('Settings Aligned');
            // Optimistic update logic would go here
        } catch (err) { alert('Update Failed'); }
    };
    
    const handleAvatarUpload = async (file) => {
         const formData = new FormData();
         formData.append('file', file);
         try {
             const res = await api.post('/api/upload/file', formData);
             setAvatarUrl(res.data.file.url);
         } catch(err) {}
    };

    const handleSaveLocalSecurity = () => {
        if (lockEnabled && pin.length !== 4) return alert('PIN must be 4 digits');
        localStorage.setItem('app_lock_enabled', lockEnabled);
        localStorage.setItem('app_pin', pin);
        alert('Local Security Updated');
    };

    // --- SUB-COMPONENTS ---
    const Header = ({ title, backTo = 'main' }) => (
        <div className="flex items-center gap-4 border-b border-[#DAA520]/30 pb-4 mb-6">
            <button onClick={() => backTo === 'exit' ? navigate('/chat') : setView(backTo)} className="w-10 h-10 rounded-full border border-[#DAA520]/50 flex items-center justify-center hover:bg-[#DAA520]/20 text-[#DAA520] transition bg-black/40 backdrop-blur-md">
                <span className="text-xl pb-1">←</span>
            </button>
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-[#DAA520]">{title}</h1>
        </div>
    );

    const MenuRow = ({ icon, label, sub, onClick }) => (
        <div onClick={onClick} className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer border-b border-[#f2e8cf]/5 transition">
            <div className="text-2xl w-8 text-center">{icon}</div>
            <div className="flex-1">
                <h3 className="text-[#f2e8cf] tracking-wide text-sm font-bold">{label}</h3>
                {sub && <p className="text-[10px] text-[#f2e8cf]/50 uppercase tracking-widest">{sub}</p>}
            </div>
            <div className="text-[#DAA520]">›</div>
        </div>
    );

    // --- VIEWS ---
    const MainView = () => (
        <>
            <Header title="Settings" backTo="exit" />
            <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-[#DAA520]/20" onClick={() => setView('profile')}>
                <img src={avatarUrl || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full object-cover border border-[#DAA520]" />
                <div>
                   <h2 className="text-lg font-bold text-[#f2e8cf]">{username || 'Soul'}</h2>
                   <p className="text-xs text-[#f2e8cf]/60 truncate max-w-[200px]">{bio || 'Traveling...'}</p>
                </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-[#f2e8cf]/10">
                <MenuRow icon="🔑" label="Account" sub="Privacy, Security, Number" onClick={() => setView('account')} />
                <MenuRow icon="🕉️" label="Chats" sub="Theme, Wallpaper, History" onClick={() => setView('chats')} />
                <MenuRow icon="🔔" label="Notifications" sub="Tones, Vibration" onClick={() => setView('notifications')} />
                <MenuRow icon="💾" label="Storage" sub="Network usage, Auto-download" onClick={() => setView('storage')} />
                <MenuRow icon="❓" label="Help" sub="Help center, Contact us" onClick={() => setView('help')} />
            </div>
            
            <div className="mt-8 text-center">
                 <p className="text-[10px] uppercase tracking-[0.3em] text-[#f2e8cf]/30">Dharmic Version 1.0</p>
                 <p className="text-[10px] text-[#DAA520]/40 mt-1">Made with ❤️ by Varunesh</p>
            </div>
        </>
    );

    const ProfileView = () => (
        <>
            <Header title="Profile" />
            <div className="flex flex-col items-center mb-8 relative">
                 <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#DAA520] mb-4 relative group">
                    <img src={avatarUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        <MediaUpload onFileSelect={handleAvatarUpload} />
                    </div>
                </div>
            </div>
            <div className="space-y-6 px-2">
                <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#f2e8cf]/50 mb-2">Name</label>
                    <input className="w-full bg-transparent border-b border-[#DAA520]/30 py-2 text-[#f2e8cf] focus:border-[#DAA520] outline-none" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#f2e8cf]/50 mb-2">About</label>
                    <input className="w-full bg-transparent border-b border-[#DAA520]/30 py-2 text-[#f2e8cf] focus:border-[#DAA520] outline-none" value={bio} onChange={e => setBio(e.target.value)} />
                </div>
                <button onClick={handleSave} className="w-full py-3 mt-4 border border-[#DAA520] text-[#DAA520] uppercase text-xs font-bold tracking-[0.2em] hover:bg-[#DAA520] hover:text-black transition">Save</button>
            </div>
        </>
    );
    
    // ... Account and Chat Views (Kept Simple for Length) ...
    const AccountView = () => (
        <>
           <Header title="Account" />
           <div className="space-y-1">
               <div className="p-4 bg-white/5 rounded-t-xl mx-1"><h3 className="text-[#DAA520] text-xs uppercase tracking-widest mb-4">Privacy</h3>
                   <div className="flex justify-between items-center mb-4">
                       <span>Read Receipts</span>
                       <input type="checkbox" checked={privacy.readReceipts} onChange={e => setPrivacy({...privacy, readReceipts: e.target.checked})} className="accent-[#DAA520]" />
                   </div>
                    <div className="flex justify-between items-center">
                       <span>Last Seen</span>
                       <select value={privacy.lastSeen} onChange={e => setPrivacy({...privacy, lastSeen: e.target.value})} className="bg-black border border-[#f2e8cf]/20 text-xs p-1 rounded">
                           <option value="everyone">Everyone</option>
                           <option value="contacts">Contacts</option>
                           <option value="none">None</option>
                       </select>
                   </div>
               </div>
               
               <div className="p-4 bg-white/5 mx-1"><h3 className="text-[#DAA520] text-xs uppercase tracking-widest mb-4">Security</h3>
                    <div className="flex justify-between items-center mb-4">
                       <span>App Lock (Local PIN)</span>
                       <input type="checkbox" checked={lockEnabled} onChange={e => setLockEnabled(e.target.checked)} className="accent-[#DAA520]" />
                   </div>
                   {lockEnabled && <input type="password" placeholder="PIN (4 digits)" maxLength="4" value={pin} onChange={e => setPin(e.target.value)} className="w-full bg-black/50 p-2 border border-[#f2e8cf]/20 rounded text-center tracking-[1em] mb-4" />}
                   {lockEnabled && <button onClick={handleSaveLocalSecurity} className="text-xs text-[#DAA520] border border-[#DAA520] px-2 py-1 rounded">Set PIN</button>}
               </div>
               
               <button onClick={handleSave} className="w-full mt-6 py-3 bg-[#DAA520] text-black font-bold uppercase text-xs tracking-[0.2em] rounded">Save Changes</button>
           </div>
        </>
    );

    const ChatsView = () => (
        <>
            <Header title="Chats" />
             <div className="p-4 space-y-6">
                <div>
                     <label className="block text-[#DAA520] text-xs uppercase tracking-widest mb-2">Theme</label>
                     <div className="flex gap-4">
                         {['Cosmic', 'Light', 'Dark'].map(t => (
                             <div key={t} onClick={() => setAppSettings({...appSettings, theme: t.toLowerCase()})} 
                                  className={`px-4 py-2 border rounded cursor-pointer transition ${appSettings.theme === t.toLowerCase() ? 'border-[#DAA520] bg-[#DAA520]/20 text-[#DAA520]' : 'border-white/20 hover:bg-white/5'}`}>
                                 {t}
                             </div>
                         ))}
                     </div>
                </div>
                 <button onClick={handleSave} className="w-full mt-6 py-3 bg-[#DAA520] text-black font-bold uppercase text-xs tracking-[0.2em] rounded">Save Settings</button>
            </div>
        </>
    );

    const NotificationsView = () => {
        const [perm, setPerm] = useState(Notification.permission);
        
        const requestPerm = async () => {
            const res = await Notification.requestPermission();
            setPerm(res);
            if(res === 'granted') { alert('Granted'); if('serviceWorker' in navigator) { alert('Wait SW'); navigator.serviceWorker.ready.then(reg => { alert('Show'); reg.showNotification('Dharma Test', {body:'Test'}); }).catch(e=>alert('Err'+e)); } else { alert('No SW'); new Notification('Test'); } }
        };

        return (
             <>
            <Header title="Notifications" />
            <div className="p-4 space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-[#DAA520]/20">
                     <div>
                        <h3 className="text-[#DAA520] text-sm font-bold uppercase tracking-widest">Desktop Alerts</h3>
                        <p className="text-xs text-[#f2e8cf]/50 mt-1">Show browser popups for new messages</p>
                     </div>
                     <button 
                        onClick={requestPerm}
                         
                        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition ${perm === 'granted' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-[#DAA520] text-black hover:bg-[#DAA520]/80'}`}
                     >
                        {perm === 'granted' ? 'Active (Click to Test)' : 'Enable'}
                     </button>
                </div>
                
                <div className="opacity-50 pointer-events-none">
                    <label className="block text-[#DAA520] text-xs uppercase tracking-widest mb-2">Sound</label>
                    <select className="w-full bg-black border border-[#f2e8cf]/20 p-2 rounded text-xs">
                        <option>Cosmic Chiming (Default)</option>
                    </select>
                </div>
            </div>
            </>
        );
    };

    const PlaceholderView = ({ title }) => (
        <>
            <Header title={title} />
            <div className="flex flex-col items-center justify-center p-10 opacity-50">
                <div className="text-4xl mb-4">🚧</div>
                <p>This path is being paved.</p>
                <p className="text-xs mt-2">Coming in Version 1.1</p>
            </div>
        </>
    );

    return (
        <div className="h-[100dvh] flex flex-col p-4 relative overflow-hidden text-[#f2e8cf] font-spiritual w-full max-w-lg mx-auto">
             <div className="fixed inset-0 z-[-1]">
                <img src="/bg-himalayas.png" className="w-full h-full object-cover object-bottom opacity-20" />
                <div className="absolute inset-0 bg-black/90"></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                {view === 'main' && <MainView />}
                {view === 'profile' && <ProfileView />}
                {view === 'account' && <AccountView />}
                {view === 'chats' && <ChatsView />}
                {view === 'notifications' && <NotificationsView />}
                {view === 'storage' && <PlaceholderView title="Storage" />}
                {view === 'help' && <PlaceholderView title="Help" />}
            </div>
        </div>
    );
};

export default SettingsPage;
