import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket;

export const initiateSocketConnection = (token) => {
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
  });
  console.log('Connecting socket...');
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const getSocket = () => socket;
