import React from 'react';
import { FaFile, FaDownload } from 'react-icons/fa';
import LocationMessage from './LocationMessage';

const MediaMessage = ({ message, isSent }) => {
  const { type, mediaUrl, fileName, fileSize, content } = message;

  if (type === 'image') {
    return (
      <div className="mt-1">
        <img 
          src={mediaUrl} 
          alt={fileName || 'Image'} 
          className="max-w-xs max-h-60 rounded-lg cursor-pointer hover:opacity-90 transition"
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      </div>
    );
  }

  if (type === 'video') {
    return (
        <div className="mt-1">
            <video 
                src={mediaUrl} 
                className="max-w-xs max-h-60 rounded-lg" 
                controls
            />
        </div>
    );
  }

  if (type === 'audio') {
      return (
          <div className="mt-1 flex items-center gap-2 min-w-[200px]">
              <audio src={mediaUrl} controls className="h-8 w-full" />
          </div>
      );
  }
  
  if (type === 'sticker') {
      return (
          <div className="mt-1">
             <img src={mediaUrl} alt="Sticker" className="w-32 h-32 object-contain" />
          </div>
      );
  }
  
  if (type === 'location') {
      // Content likely contains JSON string of lat,lng or we assume new fields. To simplify, let's parse content.
      // Usually I'd add lat/lng to Message model but 'content' is fine for prototype.
      // Let's assume content is "lat,lng" string.
      const [lat, lng] = (content || '').split(',');
      return <LocationMessage lat={parseFloat(lat)} lng={parseFloat(lng)} />;
  }

  // Document (Fallback)
  return (
    <div className={`mt-1 flex items-center gap-3 p-2 rounded-lg ${isSent ? 'bg-purple-600' : 'bg-gray-600'}`}>
        <div className="bg-black/20 p-2 rounded text-white">
            <FaFile className="text-xl" />
        </div>
        <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate w-32">{fileName || 'Document'}</p>
            {fileSize && <p className="text-xs opacity-70">{(fileSize / 1024).toFixed(1)} KB</p>}
        </div>
        <a 
            href={mediaUrl} 
            download={fileName} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-black/20 rounded-full transition"
        >
            <FaDownload />
        </a>
    </div>
  );
};

export default MediaMessage;
