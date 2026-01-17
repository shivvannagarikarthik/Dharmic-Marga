import React from 'react';

const STICKERS = [
  'https://cdn-icons-png.flaticon.com/512/9376/9376323.png', // Happy
  'https://cdn-icons-png.flaticon.com/512/9376/9376349.png', // Love
  'https://cdn-icons-png.flaticon.com/512/9376/9376356.png', // Cool
  'https://cdn-icons-png.flaticon.com/512/9376/9376332.png', // Sad
  'https://cdn-icons-png.flaticon.com/512/9376/9376228.png', // Angry
  'https://cdn-icons-png.flaticon.com/512/9376/9376241.png', // Shocked
  'https://cdn-icons-png.flaticon.com/512/4712/4712027.png', // Robot
  'https://cdn-icons-png.flaticon.com/512/190/190693.png',   // Thumbs Up
];

const StickerPicker = ({ onSelect, onClose }) => {
  return (
    <div className="absolute bottom-16 left-4 bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 w-64 max-h-60 overflow-y-auto">
      <div className="grid grid-cols-4 gap-2">
        {STICKERS.map((url, i) => (
            <img 
                key={i} 
                src={url} 
                className="w-12 h-12 cursor-pointer hover:scale-110 transition" 
                onClick={() => onSelect(url)}
            />
        ))}
      </div>
      <button onClick={onClose} className="mt-2 text-xs text-gray-400 hover:text-white w-full">Close</button>
    </div>
  );
};

export default StickerPicker;
