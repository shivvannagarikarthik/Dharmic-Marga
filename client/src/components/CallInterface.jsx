import React from 'react';
import useWebRTC from '../hooks/useWebRTC';

const CallInterface = ({ receiverId, callType, onClose }) => {
  const {
    myVideo,
    userVideo,
    callAccepted,
    calling,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall
  } = useWebRTC(callType);

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  React.useEffect(() => {
    if (receiverId && !incomingCall) {
      startCall(receiverId);
    }
  }, [receiverId]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="max-w-4xl w-full p-6">
        {/* Incoming Call */}
        {incomingCall && !callAccepted && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-white text-2xl mb-4">Incoming {incomingCall.type} call</h2>
            <p className="text-gray-400 mb-6">from {incomingCall.caller.username}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={answerCall}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold"
              >
                Accept
              </button>
              <button
                onClick={() => { rejectCall(); onClose(); }}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Call in Progress */}
        {(calling || callAccepted) && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* My Video/Audio */}
              <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video relative">
                {callType === 'video' ? (
                  <video
                    ref={myVideo}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">You</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                  You
                </div>
              </div>

              {/* User Video/Audio */}
              <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                {callAccepted ? (
                  callType === 'video' ? (
                    <video
                      ref={userVideo}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">U</span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-400">Calling...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleEndCall}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                End Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallInterface;
