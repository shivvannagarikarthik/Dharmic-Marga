const { Call, User } = require('../models');

module.exports = (io, socket, redisClient) => {
  // Initiate a call
  socket.on('call_initiate', async (data) => {
    try {
      const { receiverId, type, offer } = data;

      const call = await Call.create({
        callerId: socket.userId,
        receiverId,
        type,
        status: 'ringing',
        startedAt: new Date()
      });

      const receiverSocketId = await redisClient.get(`user:${receiverId}:socketId`);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming_call', {
          callId: call.id,
          caller: {
            id: socket.userId,
            username: socket.username
          },
          type,
          offer
        });
      } else {
        await call.update({ status: 'missed' });
        socket.emit('call_failed', { message: 'User is offline' });
      }
    } catch (error) {
      console.error('Call initiate error:', error);
      socket.emit('call_error', { message: 'Failed to initiate call' });
    }
  });

  socket.on('call_accept', async (data) => {
    try {
      const { callId, answer } = data;
      const call = await Call.findByPk(callId);
      if (!call) return socket.emit('call_error', { message: 'Call not found' });

      await call.update({ status: 'accepted' });
      const callerSocketId = await redisClient.get(`user:${call.callerId}:socketId`);

      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', { callId: call.id, answer });
      }
    } catch (error) {
      console.error('Call accept error:', error);
    }
  });

  socket.on('call_reject', async (data) => {
    try {
      const { callId } = data;
      const call = await Call.findByPk(callId);
      if (!call) return;

      await call.update({ status: 'rejected', endedAt: new Date() });
      const callerSocketId = await redisClient.get(`user:${call.callerId}:socketId`);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_rejected', { callId: call.id });
      }
    } catch (error) {
      console.error('Call reject error:', error);
    }
  });

  socket.on('call_end', async (data) => {
    try {
      const { callId } = data;
      const call = await Call.findByPk(callId);
      if (!call) return;

      const duration = Math.floor((new Date() - new Date(call.startedAt)) / 1000);
      await call.update({ status: 'ended', endedAt: new Date(), duration });

      const otherUserId = call.callerId === socket.userId ? call.receiverId : call.callerId;
      const otherSocketId = await redisClient.get(`user:${otherUserId}:socketId`);
      
      if (otherSocketId) {
        io.to(otherSocketId).emit('call_ended', { callId: call.id });
      }
    } catch (error) {
      console.error('Call end error:', error);
    }
  });

  socket.on('ice_candidate', async (data) => {
    try {
      const { receiverId, candidate } = data;
      const receiverSocketId = await redisClient.get(`user:${receiverId}:socketId`);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('ice_candidate', { senderId: socket.userId, candidate });
      }
    } catch (error) {
      console.error('ICE candidate error:', error);
    }
  });
};
