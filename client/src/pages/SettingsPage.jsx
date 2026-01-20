import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MediaUpload from '../components/MediaUpload';

// --- SEPARATE COMPONENTS (The Real Fix + Refs) ---

const Header = ({ title, onBack }) => (
    <div className="flex items-center gap-4 border-b border-[#DAA520]/30 pb-4 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-[#DAA520]/50 flex items-center justify-center hover:bg-[#DAA520]/20 text-[#DAA520] transition bg-black/40 backdrop-blur-md">
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

const MainView = ({ user, avatarUrl, username, bio, setView }) => (
    <>
        <div className="flex items-center gap-4 border-b border-[#DAA520]/30 pb-4 mb-6">
             <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full border border-[#DAA520]/50 flex items-center justify-center hover:bg-[#DAA520]/20 text-[#DAA520] transition bg-black/40 backdrop-blur-md">
                <span className="text-xl pb-1">←</span>
            </button>
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-[#DAA520]">Settings</h1>
        </div>

        <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-[#DAA520]/20 cursor-pointer" onClick={() => setView('profile')}>
            <img src={avatarUrl || user?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} className="w-16 h-16 rounded-full object-cover border border-[#DAA520]" />
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

// 2. PROFILE EDIT COMPONENT WITH REFS (No Re-renders)
const ProfileView = ({ defaultUsername, defaultBio, avatarUrl, user, setUsername, setBio, handleAvatarUpload, handleSave, setView }) => {
    // We use Refs for inputs to prevent re-renders on keystrokes
    const usernameRef = useRef(defaultUsername);
    const bioRef = useRef(defaultBio);

    const onSaveClick = () => {
        // Update parent state only on SAVE
        const newName = usernameRef.current.value;
        const newBio = bioRef.current.value;
        setUsername(newName);
        setBio(newBio);
        handleSave(newName, newBio); // Pass directly to avoid stale state race
    };

    return (
        <>
            <Header title="Profile" onBack={() => setView('main')} />
            <div className="flex justify-center mb-8">
                 <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#DAA520] relative">
                         <img src={avatarUrl || user?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-[#DAA520] text-black w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
                        <MediaUpload onFileSelect={handleAvatarUpload} />
                    </div>
                </div>
            </div>
            <div className="space-y-6 px-2">
                <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#f2e8cf]/50 mb-2">Name</label>
                    <input 
                        className="w-full bg-transparent border-b border-[#DAA520]/30 py-2 text-[#f2e8cf] focus:border-[#DAA520] outline-none" 
                        defaultValue={defaultUsername}
                        ref={usernameRef} // UNCONTROLLED
                        onChange={() => {}} // No-op to satisfy React warning if needed, but defaultValue implies uncontrolled
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#f2e8cf]/50 mb-2">About</label>
                    <input 
                        className="w-full bg-transparent border-b border-[#DAA520]/30 py-2 text-[#f2e8cf] focus:border-[#DAA520] outline-none" 
                        defaultValue={defaultBio} 
                        ref={bioRef} // UNCONTROLLED
                    />
                </div>
                <button onClick={onSaveClick} className="w-full py-3 mt-4 border border-[#DAA520] text-[#DAA520] uppercase text-xs font-bold tracking-[0.2em] hover:bg-[#DAA520] hover:text-black transition">Save</button>
            </div>
        </>
    );
};

// 3. ACCOUNT SETTINGS COMPONENT
const AccountView = ({ privacy, setPrivacy, lockEnabled, setLockEnabled, pin, setPin, handleSaveLocalSecurity, handleSave, setView }) => (
    <>
       <Header title="Account" onBack={() => setView('main')} />
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
               {lockEnabled && <input type="number" placeholder="PIN (4 digits)" maxLength="4" value={pin} onChange={e => setPin(e.target.value)} className="w-full bg-black/50 p-2 border border-[#f2e8cf]/20 rounded text-center tracking-[1em] mb-4" />}
               {lockEnabled && <button onClick={handleSaveLocalSecurity} className="text-xs text-[#DAA520] border border-[#DAA520] px-2 py-1 rounded">Set PIN</button>}
           </div>
           
           <button onClick={() => handleSave()} className="w-full mt-6 py-3 bg-[#DAA520] text-black font-bold uppercase text-xs tracking-[0.2em] rounded">Save Changes</button>
       </div>
    </>
);

// 4. CHATS SETTINGS COMPONENT
const ChatsView = ({ appSettings, setAppSettings, handleSave, setView }) => (
    <>
        <Header title="Chats" onBack={() => setView('main')} />
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
             <button onClick={() => handleSave()} className="w-full mt-6 py-3 bg-[#DAA520] text-black font-bold uppercase text-xs tracking-[0.2em] rounded">Save Settings</button>
        </div>
    </>
);

const NotificationsView = ({ notificationPerm, handleRequestNotificationPerm, setView }) => (
     <>
    <Header title="Notifications" onBack={() => setView('main')} />
    <div className="p-4 space-y-6">
        <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-[#DAA520]/20">
             <div>
                <h3 className="text-[#DAA520] text-sm font-bold uppercase tracking-widest">Desktop Alerts</h3>
                <p className="text-xs text-[#f2e8cf]/50 mt-1">Show browser popups for new messages</p>
             </div>
             <button 
                onClick={handleRequestNotificationPerm}
                className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition ${notificationPerm === 'granted' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-[#DAA520] text-black hover:bg-[#DAA520]/80'}`}
             >
                {notificationPerm === 'granted' ? 'Active (Click to Test)' : 'Enable'}
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

const PlaceholderView = ({ title, setView }) => (
    <>
        <Header title={title} onBack={() => setView('main')} />
        <div className="flex flex-col items-center justify-center p-10 opacity-50">
            <div className="text-4xl mb-4">🚧</div>
            <p>This path is being paved.</p>
            <p className="text-xs mt-2">Coming in Version 1.1</p>
        </div>
    </>
);

const SettingsPage = () => {
    const { user } = useContext(AuthContext); 
    const navigate = useNavigate();
    const [view, setView] = useState('main'); 
    
    // Core State
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
    
    const [privacy, setPrivacy] = useState(user?.privacySettings || { lastSeen: 'everyone', readReceipts: true, twoFactorEnabled: false });
    const [appSettings, setAppSettings] = useState(user?.appSettings || { theme: 'cosmic', wallpaper: 'default', fontSize: 'medium', notificationsKey: false });

    // Security (Local)
    const [lockEnabled, setLockEnabled] = useState(false);
    const [pin, setPin] = useState('');

    const [notificationPerm, setNotificationPerm] = useState(Notification.permission);

    useEffect(() => {
        setLockEnabled(localStorage.getItem('app_lock_enabled') === 'true');
        setPin(localStorage.getItem('app_pin') || '');
    }, []);

    // Updated Save to accept override values (for Ref logic)
    const handleSave = async (overrideName, overrideBio) => {
        const finalName = overrideName !== undefined ? overrideName : username;
        const finalBio = overrideBio !== undefined ? overrideBio : bio;

        try {
            await api.put('/api/users/profile', { 
                username: finalName, 
                bio: finalBio, 
                avatarUrl, 
                privacySettings: privacy, 
                appSettings 
            });
            alert('Settings Aligned');
            // Optimistically update state
            setUsername(finalName);
            setBio(finalBio);
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

    const handleRequestNotificationPerm = async () => {
        const res = await Notification.requestPermission();
        setNotificationPerm(res);
        if(res === 'granted') { 
            setAppSettings({...appSettings, notificationsKey: true}); 
            if('serviceWorker' in navigator) navigator.serviceWorker.ready.then(r=>r.showNotification('Dharma Active', {body:'System Ready', icon:'/vite.svg'})); 
            else new Notification('System Ready'); 
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col p-4 relative overflow-hidden text-[#f2e8cf] font-spiritual w-full max-w-lg mx-auto">
             <div className="fixed inset-0 z-[-1]">
                <img src="/bg-himalayas.png" className="w-full h-full object-cover object-bottom opacity-20" />
                <div className="absolute inset-0 bg-black/90"></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                {view === 'main' && <MainView 
                    user={user} 
                    avatarUrl={avatarUrl} 
                    username={username} 
                    bio={bio} 
                    setView={setView} 
                />}
                
                {view === 'profile' && <ProfileView 
                    defaultUsername={username} // Passing as DEFAULT for ref
                    defaultBio={bio} 
                    avatarUrl={avatarUrl} 
                    user={user} 
                    setUsername={setUsername} 
                    setBio={setBio} 
                    handleAvatarUpload={handleAvatarUpload} 
                    handleSave={handleSave} 
                    setView={setView}
                />}
                
                {view === 'account' && <AccountView 
                    privacy={privacy} 
                    setPrivacy={setPrivacy} 
                    lockEnabled={lockEnabled} 
                    setLockEnabled={setLockEnabled} 
                    pin={pin} 
                    setPin={setPin} 
                    handleSaveLocalSecurity={handleSaveLocalSecurity} 
                    handleSave={handleSave}
                    setView={setView}
                />}
                
                {view === 'chats' && <ChatsView 
                    appSettings={appSettings} 
                    setAppSettings={setAppSettings} 
                    handleSave={handleSave} 
                    setView={setView}
                />}
                
                {view === 'notifications' && <NotificationsView 
                    notificationPerm={notificationPerm} 
                    handleRequestNotificationPerm={handleRequestNotificationPerm} 
                    setView={setView}
                />}
                
                {view === 'storage' && <PlaceholderView title="Storage" setView={setView} />}
                {view === 'help' && <PlaceholderView title="Help" setView={setView} />}
            </div>
        </div>
    );
};

export default SettingsPage;
