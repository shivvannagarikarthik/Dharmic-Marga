const { User, Message, Conversation, ConversationParticipant } = require('../models');

const BOT_PHONE = '0000000000';
const BOT_NAME = 'AI Assistant';

// Initialize Bot User
exports.initBot = async () => {
  try {
    let bot = await User.findOne({ where: { phoneNumber: BOT_PHONE } });
    if (!bot) {
      bot = await User.create({
        username: BOT_NAME,
        phoneNumber: BOT_PHONE,
        bio: 'I am your personal AI assistant. Ask me anything!',
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png' // Robot Icon
      });
      console.log('AI Assistant User Created');
    }
    return bot;
  } catch (err) {
    console.error('Bot init failed', err);
  }
};

// Handle Incoming Message
exports.handleBotMessage = async (message, io) => {
  try {
    // 1. Check if bot is recipient
    // Get conversation participants
    const participants = await ConversationParticipant.findAll({ 
        where: { ConversationId: message.conversationId } 
    });
    
    const bot = await User.findOne({ where: { phoneNumber: BOT_PHONE } });
    if (!bot) return;

    // Check if bot is in conversation AND message is NOT from bot
    const isBotInConv = participants.some(p => p.UserId === bot.id);
    if (!isBotInConv || message.senderId === bot.id) return;

    // 2. Simulate Thinking (Typing indicator)
    
    // 3. Generate Response
    const replyText = generateResponse(message.content);
    
    // 4. Send Reply after delay
    setTimeout(async () => {
       const reply = await Message.create({
           conversationId: message.conversationId,
           senderId: bot.id,
           content: replyText,
           type: 'text',
           status: 'sent',
           readBy: []
       });

       // Broadcast
       const fullMessage = await Message.findByPk(reply.id, {
           include: [{ model: User, attributes: ['id', 'username', 'avatarUrl'] }]
       });
       
       io.to(message.conversationId).emit('new_message', fullMessage);

    }, 1500 + Math.random() * 1000); // 1.5 - 2.5s delay

  } catch (err) {
    console.error('Bot handler error', err);
  }
};

function generateResponse(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('hello') || lower.includes('hi')) return "Hello! How can I help you today? 🤖";
    if (lower.includes('help')) return "I can help you with:\n1. App features\n2. Life advice\n3. Jokes\nJust ask!";
    if (lower.includes('joke')) return "Why did the programmer quit his job? because he didn't get arrays. 😂";
    if (lower.includes('features')) return "This app has Voice Calls, Video Calls, Groups, and me! 🚀";
    if (lower.includes('who are you')) return "I am Dharmic Marga's AI Assistant.";
    
    return "That's interesting! Tell me more. (I'm a simple demo bot, but I'm learning!)";
}
