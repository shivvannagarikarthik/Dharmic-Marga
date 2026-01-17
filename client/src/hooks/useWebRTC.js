import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { getSocket } from '../services/socket';

const useWebRTC = (callType = 'voice') => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [calling, setCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();
  const currentCallId = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    socket.on('call_accepted', (data) => {
      setCallAccepted(true);
      if (peerRef.current) {
        peerRef.current.signal(data.answer);
      }
    });

    socket.on('call_rejected', () => {
      endCall();
    });

    socket.on('call_ended', () => {
      endCall();
    });

    socket.on('ice_candidate', (data) => {
      if (peerRef.current) {
        peerRef.current.signal(data.candidate);
      }
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('ice_candidate');
    };
  }, []);

  const startCall = async (receiverId) => {
    try {
      const constraints = callType === 'video' 
        ? { video: true, audio: true }
        : { audio: true };

      const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(currentStream);
      
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream: currentStream
      });

      peer.on('signal', (data) => {
        const socket = getSocket();
        socket.emit('call_initiate', {
          receiverId,
          type: callType,
          offer: data
        });
      });

      peer.on('stream', (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });

      peerRef.current = peer;
      setCalling(true);
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access camera/microphone');
    }
  };

  const answerCall = async () => {
    try {
      if (!incomingCall) return;

      const constraints = incomingCall.type === 'video'
        ? { video: true, audio: true }
        : { audio: true };

      const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(currentStream);

      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: currentStream
      });

      peer.on('signal', (data) => {
        const socket = getSocket();
        socket.emit('call_accept', {
          callId: incomingCall.callId,
          answer: data
        });
      });

      peer.on('stream', (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });

      peer.signal(incomingCall.offer);
      peerRef.current = peer;
      currentCallId.current = incomingCall.callId;
      setCallAccepted(true);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      const socket = getSocket();
      socket.emit('call_reject', { callId: incomingCall.callId });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (currentCallId.current) {
      const socket = getSocket();
      socket.emit('call_end', { callId: currentCallId.current });
    }

    if (peerRef.current) {
      peerRef.current.destroy();
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setCallEnded(true);
    setCallAccepted(false);
    setCalling(false);
    setStream(null);
    currentCallId.current = null;
  };

  return {
    stream,
    myVideo,
    userVideo,
    callAccepted,
    callEnded,
    calling,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall
  };
};

export default useWebRTC;
