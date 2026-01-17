import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';

const MessageActions = ({ message, isMe, onReply, onDelete, onEdit, onReact }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative group flex items-center gap-2">
      {/* Actions Trigger (visible on hover) */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded-full transition text-gray-400"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu */}
      {showMenu && (
        <div className={`absolute top-full ${isMe ? 'right-0' : 'left-0'} mt-1 bg-gray-800 shadow-xl rounded-lg p-2 z-10 w-40 border border-gray-700`}>
          <button
            onClick={() => { onReply(message); setShowMenu(false); }}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded text-sm flex items-center gap-2"
          >
            <span>↩️</span> Reply
          </button>
          
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded text-sm flex items-center gap-2"
          >
            <span>😊</span> React
          </button>
          
          {isMe && (
            <>
              {!message.isDeleted && message.type === 'text' && (
                <button
                  onClick={() => { onEdit(message); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                >
                  <span>✏️</span> Edit
                </button>
              )}
              
              <button
                onClick={() => { onDelete(message.id); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded text-sm flex items-center gap-2"
              >
                <span>🗑️</span> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-full mb-2 z-20">
          <div className="fixed inset-0 z-10" onClick={() => setShowEmoji(false)} />
          <div className="relative z-20">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onReact(message.id, emojiData.emoji);
                setShowEmoji(false);
                setShowMenu(false);
              }}
              width={300}
              height={400}
              theme="dark"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageActions;
