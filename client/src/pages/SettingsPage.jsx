import React, { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import MediaUpload from '../components/MediaUpload';

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

const SettingsPage = () => {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('main');
    const [localUser, setLocalUser] = useState(user);
    const [notificationPerm, setNotificationPerm] = useState(Notification.permission);

    useEffect(() => {
        if (user) setLocalUser(user);
    }, [user]);

    const handleUpdate = async (updates) => {
        try {
            const updatedUser = { ...localUser, ...updates };
            if (updates.privacySettings) {
                updatedUser.privacySettings = { ...localUser.privacySettings, ...updates.privacySettings };
            }
            if (updates.appSettings) {
                updatedUser.appSettings = { ...localUser.appSettings, ...updates.appSettings };
            }
            setLocalUser(updatedUser);
            const res = await api.put('/api/users/profile', updates);
            login(res.data, localStorage.getItem('token'));
        } catch (err) {
            console.error("Settings Update Failed", err);
            setLocalUser(user);
        }
    };

    const requestNotificationPermission = async () => {
        console.log("Requesting notification permission...");
        try {
            const perm = await Notification.requestPermission();
            console.log("Permission result:", perm);
            setNotificationPerm(perm);
            if (perm === 'denied') {
                alert("Notifications are blocked. Please allow them in your browser settings (URL bar).");
            } else if (perm === 'granted') {
                // Optional: Test notification
                new Notification("Notifications enabled!");
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
            alert("Error requesting permission. Check console.");
        }
    };

    const handleBack = () => {
        if (activeView === 'main') {
            navigate('/chat');
        } else {
            setActiveView('main');
        }
    };

    if (!localUser) return <div className="p-10 text-[#f2e8cf]">Loading settings...</div>;

    return (
        <div className="h-[100dvh] w-full max-w-md mx-auto bg-[#0a0f1c] text-[#f2e8cf] flex flex-col font-sans relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0f1c] to-[#0a0f1c] animate-pulse-slow"></div>
            </div>

            <div className="z-10 flex-1 flex flex-col h-full">
                {activeView === 'main' && (
                    <SettingsMain user={localUser} onNavigate={setActiveView} onBack={() => navigate('/chat')} />
                )}
                {activeView === 'profile' && (
                    <ProfileView user={localUser} onUpdate={handleUpdate} onBack={handleBack} />
                )}
                {activeView === 'privacy' && (
                    <PrivacyView settings={localUser.privacySettings || {}} onUpdate={(s) => handleUpdate({ privacySettings: s })} onBack={handleBack} />
                )}
                {activeView === 'chats' && (
                    <ChatsView settings={localUser.appSettings || {}} onUpdate={(s) => handleUpdate({ appSettings: s })} onBack={handleBack} />
                )}
                {/* FIXED: Passing permission props */}
                {activeView === 'notifications' && (
                    <NotificationsView
                        settings={localUser.appSettings || {}}
                        onUpdate={(s) => handleUpdate({ appSettings: s })}
                        onBack={handleBack}
                        notificationPerm={notificationPerm}
                        requestNotificationPermission={requestNotificationPermission}
                    />
                )}
                {activeView === 'account' && (
                    <AccountView onBack={handleBack} />
                )}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                SUB VIEWS                                   */
/* -------------------------------------------------------------------------- */

const SettingsMain = ({ user, onNavigate, onBack }) => {
    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center gap-4 p-4 border-b border-indigo-900/30 bg-[#0a0f1c]/80 backdrop-blur-md">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition">
                    <ArrowLeftIcon />
                </button>
                <h1 className="text-xl font-medium tracking-wide text-amber-500">Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div
                    onClick={() => onNavigate('profile')}
                    className="flex items-center gap-4 p-4 py-6 border-b border-indigo-900/30 cursor-pointer hover:bg-white/5 transition"
                >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=0D8ABC&color=fff`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-medium tracking-wide text-[#f2e8cf]">{user.username}</h2>
                        <p className="text-sm text-indigo-300/70 truncate max-w-[200px]">{user.bio || 'Available'}</p>
                    </div>
                </div>

                <div className="mt-2">
                    <MenuItem icon={<KeyIcon />} label="Account" subtext="Security notifications, change number" onClick={() => onNavigate('account')} />
                    <MenuItem icon={<LockIcon />} label="Privacy" subtext="Block contacts, disappearing messages" onClick={() => onNavigate('privacy')} />
                    <MenuItem icon={<ChatIcon />} label="Chats" subtext="Theme, wallpapers, chat history" onClick={() => onNavigate('chats')} />
                    <MenuItem icon={<BellIcon />} label="Notifications" subtext="Message, group & call tones" onClick={() => onNavigate('notifications')} />
                    <MenuItem icon={<HelpIcon />} label="Help" subtext="Help center, contact us, privacy policy" onClick={() => alert('Help Center: Coming Soon')} />
                </div>
            </div>
            <div className="p-6 text-center text-xs text-indigo-400/30">
                <p>from</p>
                <p className="font-bold tracking-widest text-[#f2e8cf]/50 mt-1">ANTIGRAVITY</p>
            </div>
        </div>
    );
};

const ProfileView = ({ user, onUpdate, onBack }) => {
    const usernameRef = useRef(user.username);
    const bioRef = useRef(user.bio);

    const handleSave = () => {
        const newName = usernameRef.current.value;
        const newBio = bioRef.current.value;
        if (newName !== user.username || newBio !== user.bio) {
            onUpdate({ username: newName, bio: newBio });
        }
    };

    const handleAvatar = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await api.post('/api/upload/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const avatarUrl = uploadRes.data.file.url;
            onUpdate({ avatarUrl });
        } catch (e) {
            console.error(e);
            alert("Avatar upload failed");
        }
    };

    return (
        <div className="flex flex-col h-full animate-slide-in">
            <Header title="Profile" onBack={onBack} />
            <div className="p-6 flex flex-col items-center gap-8">
                <div className="relative group">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-amber-500/30 shadow-2xl">
                        <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=0D8ABC&color=fff`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-amber-600 p-3 rounded-full cursor-pointer hover:bg-amber-500 border-4 border-[#0a0f1c] shadow-lg transition transform hover:scale-110">
                        <MediaUpload onFileSelect={handleAvatar} />
                    </div>
                </div>

                <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider ml-1">Name</label>
                    <div className="bg-indigo-900/20 rounded-xl p-0 border border-indigo-500/20 focus-within:border-amber-500/50 transition flex items-center">
                        <input
                            ref={usernameRef}
                            defaultValue={user.username}
                            className="w-full bg-transparent border-none outline-none text-[#f2e8cf] p-4 placeholder-indigo-400/50"
                            placeholder="Your Name"
                        />
                        <span className="pr-4 text-indigo-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></span>
                    </div>
                </div>

                <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider ml-1">About</label>
                    <div className="bg-indigo-900/20 rounded-xl p-0 border border-indigo-500/20 focus-within:border-amber-500/50 transition">
                        <input
                            ref={bioRef}
                            defaultValue={user.bio}
                            className="w-full bg-transparent border-none outline-none text-[#f2e8cf] p-4 placeholder-indigo-400/50"
                        />
                    </div>
                </div>

                <button onClick={handleSave} className="w-full py-3 bg-amber-600 rounded-xl font-bold shadow-lg hover:bg-amber-500 transition">Save Changes</button>
            </div>
        </div>
    );
};

const PrivacyView = ({ settings, onUpdate, onBack }) => {
    return (
        <div className="flex flex-col h-full animate-slide-in">
            <Header title="Privacy" onBack={onBack} />
            <div className="p-2">
                <div className="p-4">
                    <h3 className="text-indigo-400 text-sm font-bold uppercase mb-2 ml-2">Who can see my personal info</h3>
                    <div className="bg-indigo-900/10 rounded-xl overflow-hidden">
                        <SelectRow
                            label="Last Seen"
                            value={settings.lastSeen || 'everyone'}
                            options={['everyone', 'contacts', 'none']}
                            onChange={(v) => onUpdate({ ...settings, lastSeen: v })}
                        />
                        <div className="h-[1px] bg-indigo-900/30 mx-4"></div>
                        <SelectRow
                            label="Profile Photo"
                            value={settings.profilePhoto || 'everyone'}
                            options={['everyone', 'contacts', 'none']}
                            onChange={(v) => onUpdate({ ...settings, profilePhoto: v })}
                        />
                        <div className="h-[1px] bg-indigo-900/30 mx-4"></div>
                        <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer">
                            <div className="flex flex-col">
                                <span className="text-base text-[#f2e8cf]">Read Receipts</span>
                                <span className="text-xs text-indigo-300/60">If turned off, you won't send or receive read receipts.</span>
                            </div>
                            <Toggle
                                active={settings.readReceipts !== false}
                                onToggle={() => onUpdate({ ...settings, readReceipts: !settings.readReceipts })}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="text-indigo-400 text-sm font-bold uppercase mb-2 ml-2">Updates</h3>
                    <div className="bg-indigo-900/10 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer">
                            <div className="flex flex-col">
                                <span className="text-base text-[#f2e8cf]">Default Message Timer</span>
                                <span className="text-xs text-indigo-300/60">Start new chats with disappearing messages set to your timer.</span>
                            </div>
                            <span className="text-sm text-indigo-300 mr-2">Off</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChatsView = ({ settings, onUpdate, onBack }) => {
    return (
        <div className="flex flex-col h-full animate-slide-in">
            <Header title="Chats" onBack={onBack} />
            <div className="p-4">
                <div className="bg-indigo-900/10 rounded-xl overflow-hidden mb-6">
                    <SelectRow
                        label="Theme"
                        value={settings.theme || 'cosmic'}
                        options={['light', 'dark', 'cosmic']}
                        onChange={(v) => onUpdate({ ...settings, theme: v })}
                    />
                    <div className="h-[1px] bg-indigo-900/30 mx-4"></div>
                    <div className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between">
                        <span className="text-base">Wallpaper</span>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20"></div>
                    </div>
                </div>

                <div className="bg-indigo-900/10 rounded-xl overflow-hidden">
                    <SelectRow
                        label="Font Size"
                        value={settings.fontSize || 'medium'}
                        options={['small', 'medium', 'large']}
                        onChange={(v) => onUpdate({ ...settings, fontSize: v })}
                    />
                </div>
            </div>
        </div>
    );
};

// FIXED Notifications View
const NotificationsView = ({ settings, onUpdate, onBack, notificationPerm, requestNotificationPermission }) => {
    return (
        <div className="flex flex-col h-full animate-slide-in">
            <Header title="Notifications" onBack={onBack} />
            <div className="p-4 space-y-4">
                {/* Global Permission Block */}
                <div className="bg-indigo-900/10 rounded-xl p-4 flex items-center justify-between border border-indigo-500/10">
                    <div>
                        <h3 className="text-[#f2e8cf] font-medium">Browser Notifications</h3>
                        <p className={`text-xs ${notificationPerm === 'granted' ? 'text-green-400' : 'text-amber-400'}`}>
                            {notificationPerm === 'granted' ? 'Enabled' : 'Permissions needed for functionality'}
                        </p>
                    </div>
                    {notificationPerm !== 'granted' && (
                        <button
                            onClick={requestNotificationPermission}
                            className="px-4 py-2 bg-amber-600 rounded-lg text-sm font-bold shadow hover:bg-amber-500 transition"
                        >
                            Enable
                        </button>
                    )}
                </div>

                <h3 className="text-indigo-400 text-sm font-bold uppercase ml-2">Preferences</h3>
                <div className="bg-indigo-900/10 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer">
                        <span className="text-base text-[#f2e8cf]">Conversation Tones</span>
                        <Toggle
                            active={settings.notificationsKey !== false}
                            onToggle={() => onUpdate({ ...settings, notificationsKey: !settings.notificationsKey })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const AccountView = ({ onBack }) => (
    <div className="flex flex-col h-full animate-slide-in">
        <Header title="Account" onBack={onBack} />
        <div className="p-4 space-y-2">
            <MenuItem icon={<LockIcon />} label="Security notifications" subtext="" onClick={() => { }} />
            <MenuItem icon={<KeyIcon />} label="Passkeys" subtext="" onClick={() => { }} />
            <MenuItem icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                label="Delete Account"
                subtext=""
                onClick={() => alert("This action is permanent.")}
            />
        </div>
    </div>
);

const Header = ({ title, onBack }) => (
    <div className="flex items-center gap-4 p-4 border-b border-indigo-900/30 bg-[#0a0f1c]/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition">
            <ArrowLeftIcon />
        </button>
        <h2 className="text-xl font-medium tracking-wide text-amber-500">{title}</h2>
    </div>
);

const MenuItem = ({ icon, label, subtext, onClick }) => (
    <div onClick={onClick} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition rounded-xl">
        <div className="text-indigo-400">{icon}</div>
        <div className="flex-1">
            <h3 className="text-base font-normal">{label}</h3>
            {subtext && <p className="text-xs text-indigo-300/60">{subtext}</p>}
        </div>
    </div>
);

const SelectRow = ({ label, value, options, onChange }) => (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer relative group">
        <span className="text-base text-[#f2e8cf] capitalize">{label}</span>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent text-indigo-300 text-sm outline-none cursor-pointer appearance-none pr-8 text-right"
        >
            {options.map(o => <option key={o} value={o} className="bg-[#0a0f1c]">{o}</option>)}
        </select>
        <span className="absolute right-4 text-indigo-500 pointer-events-none text-xs">▼</span>
    </div>
);

const Toggle = ({ active, onToggle }) => (
    <div
        onClick={onToggle}
        className={`w-11 h-6 rounded-full flex items-center transition-colors cursor-pointer ${active ? 'bg-amber-600' : 'bg-gray-600'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`}></div>
    </div>
);

const ArrowLeftIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const KeyIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
const LockIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const ChatIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const HelpIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default SettingsPage;
