const { Server } = require("socket.io");
const { Message, User, Conversation, ConversationParticipant } = require('./models');
const { Op } = require('sequelize');
const redisClient = require('./config/redis');
const aiBot = require('./utils/aiBot');
const callHandler = require('./socket/callHandler');

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    const jwt = require('jsonwebtoken');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${socket.user.username || userId}`);

    if (redisClient.isOpen) {
        await redisClient.set(`user:${userId}:socketId`, socket.id);
        await redisClient.set(`user:${userId}:lastSeen`, new Date().toISOString());
    }

    socket.join(userId);
    
    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
    });

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type, mediaUrl, mediaType, fileName, fileSize, replyToId } = data;
        
        // CHECK FOR DISAPPEARING TIMER
        const conversation = await Conversation.findByPk(conversationId);
        let expiresAt = null;
        if (conversation && conversation.messageTimer > 0) {
            expiresAt = new Date(Date.now() + conversation.messageTimer);
        }

        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          type: type || 'text',
          mediaUrl,
          mediaType,
          fileName,
          fileSize,
          replyToId,
          status: 'sent',
          readBy: [],
          expiresAt
        });

        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { model: User, attributes: ['id', 'username', 'avatarUrl'] },
                { model: Message, as: 'ReplyTo', include: [{model: User, attributes: ['username']}] }
            ]
        });

        io.to(conversationId).emit('new_message', fullMessage);

        aiBot.handleBotMessage(message, io);

      } catch (error) {
        console.error('Socket send_message error', error);
      }
    });

    // Handle Setting Change
    socket.on('update_disappearing_timer', async ({ conversationId, timer }) => {
        try {
            await Conversation.update({ messageTimer: timer }, { where: { id: conversationId } });
            io.to(conversationId).emit('timer_updated', { conversationId, timer });
            
            // Send system-like message
            const sysMsg = await Message.create({
                conversationId,
                senderId: userId, // technically system but we use sender for simplicity
                content: `updated disappearing messages timer.`,
                type: 'text',
                status: 'sent',
                expiresAt: null // system logs don't disappear? or maybe they should.
            });
             io.to(conversationId).emit('new_message', { ...sysMsg.toJSON(), User: { username: 'System', id: 'system' } });
            
        } catch(err){
            console.error(err);
        }
    });

    socket.on('mark_read', async ({ conversationId }) => {
        try {
            const messages = await Message.findAll({
                where: {
                    conversationId,
                    senderId: { [Op.ne]: userId }
                }
            });

            const updates = [];
            for (const msg of messages) {
                const readBy = msg.readBy || [];
                if (!readBy.find(r => r.userId === userId)) {
                    readBy.push({ userId, readAt: new Date() });
                    msg.readBy = readBy;
                    msg.changed('readBy', true); 
                    await msg.save();
                    updates.push(msg.id);
                }
            }

            if (updates.length > 0) {
                io.to(conversationId).emit('messages_read', { messageIds: updates, userId });
            }
        } catch (err) {
            console.error('Mark read error', err);
        }
    });
    
    // Other events...
    socket.on('delete_message', ({ messageId, conversationId }) => { io.to(conversationId).emit('message_deleted', { messageId }); });
    socket.on('edit_message', ({ messageId, conversationId, content }) => { io.to(conversationId).emit('message_edited', { messageId, content }); });
    socket.on('react_message', ({ messageId, conversationId, userId, emoji }) => { io.to(conversationId).emit('message_reaction', { messageId, userId, emoji }); });
    
    callHandler(io, socket, redisClient);

    socket.on('disconnect', async () => {
      if (redisClient.isOpen) await redisClient.del(`user:${userId}:socketId`);
    });
  });
};

module.exports = initializeSocket;
