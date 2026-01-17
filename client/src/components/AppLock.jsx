import React, { useState, useEffect } from 'react';

const AppLock = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPin = localStorage.getItem('app_pin');
    const isEnabled = localStorage.getItem('app_lock_enabled') === 'true';
    
    // Lock on initial load if enabled
    if (isEnabled && savedPin) {
      setIsLocked(true);
    }
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('app_pin');
    if (pin === savedPin) {
      setIsLocked(false);
      setPin('');
      setError('');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  if (!isLocked) return children;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-[100] text-white">
       <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center w-80">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-3xl mb-4">
            🔒
          </div>
          <h2 className="text-xl font-bold mb-2">App Locked</h2>
          <p className="text-gray-400 text-sm mb-6">Enter your PIN to unlock</p>
          
          <form onSubmit={handleUnlock} className="w-full">
            <input
              type="password" 
              maxLength="4"
              value={pin} 
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-gray-700 text-center text-2xl tracking-[0.5em] py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}
            <button type="submit" className="w-full bg-purple-600 py-2 rounded-lg font-bold hover:bg-purple-700">
                Unlock
            </button>
          </form>
       </div>
    </div>
  );
};

export default AppLock;
