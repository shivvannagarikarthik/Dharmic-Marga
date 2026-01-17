import React from 'react';

const MessageStatus = ({ status, readBy, isGroup }) => {
  // If group, maybe check count? For now simplify.
  // Logic: 
  // - If isGroup: Blue if readBy.length > 0 (at least one person read? or use complicated logic).
  // - If Private: Blue if readBy has other user.
  
  // Actually, Message model now has 'readBy'.
  // We can just check if readBy is not empty for now for "Read".
  // 'status' field in DB might also be updated but let's rely on readBy array length.
  
  const isRead = readBy && readBy.length > 0;
  
  if (isRead) {
    return <span className="text-blue-400 text-[10px] ml-1">✓✓</span>; // Blue Double Tick
  }
  
  // Delivered logic is tricky without explicit 'deliveredTo' array.
  // For now, let's assume if it's in the UI of other user it's delivered (socket).
  // Simple: Sent = 1 tick, Read = 2 Blue ticks.
  // We can simulate Delivered (2 gray ticks) if we want, but Read is the request.
  
  return <span className="text-gray-400 text-[10px] ml-1">✓</span>; // Single Tick (Sent)
};

export default MessageStatus;
