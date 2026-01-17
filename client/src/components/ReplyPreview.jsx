import React from 'react';

const ReplyPreview = ({ message, onCancel }) => {
  if (!message) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-1 h-10 bg-purple-500 rounded-full"></div>
        <div className="flex-1 min-w-0">
          <p className="text-purple-400 text-xs font-bold">Replying to message</p>
          <p className="text-gray-300 text-sm truncate">
            {message.type === 'text' ? message.content : `[${message.type}]`}
          </p>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="p-1 hover:bg-gray-700 rounded-full text-gray-400"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ReplyPreview;
