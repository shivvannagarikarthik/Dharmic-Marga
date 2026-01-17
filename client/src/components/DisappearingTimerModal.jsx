import React from 'react';

const DisappearingTimerModal = ({ currentTimer, onClose, onSetTimer }) => {
  const options = [
    { label: 'Off', value: 0 },
    { label: '24 Hours', value: 86400000 },
    { label: '7 Days', value: 7 * 86400000 },
    { label: '90 Days', value: 90 * 86400000 },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
        <h3 className="text-xl font-bold text-white mb-4">Disappearing Messages</h3>
        <p className="text-sm text-gray-400 mb-4">
            New messages in this chat will disappear after the selected duration.
        </p>
        
        <div className="space-y-2">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onSetTimer(opt.value)}
                    className={`w-full p-3 rounded text-left ${
                        currentTimer === opt.value ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 text-gray-400 hover:text-white">
            Cancel
        </button>
      </div>
    </div>
  );
};

export default DisappearingTimerModal;
