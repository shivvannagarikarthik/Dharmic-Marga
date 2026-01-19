const { User, Message, Conversation, ConversationParticipant } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png'
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
    const participants = await ConversationParticipant.findAll({ 
        where: { ConversationId: message.conversationId } 
    });
    
    const bot = await User.findOne({ where: { phoneNumber: BOT_PHONE } });
    if (!bot) return;

    const isBotInConv = participants.some(p => p.UserId === bot.id);
    if (!isBotInConv || message.senderId === bot.id) return;

    // 2. Generate Response
    let replyText = "Thinking...";
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        replyText = "I need a Brain! (Please add GEMINI_API_KEY to .env)";
    } else {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
            
            const prompt = `You are a spiritual and helpful AI assistant named 'Dharma Guide'. 
            Context: The user said: "${message.content}".
            Answer beautifully, concisely, and with wisdom. If they ask for a joke, tell a spiritual joke.`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            replyText = response.text();
        } catch (apiError) {
            console.error('Gemini API Error:', apiError);
            if (apiError.message.includes('API_KEY')) replyText = "My API Key is invalid.";
            else replyText = "I am meditating on that... (Service Error)";
        }
    }
    
    // 3. Send Reply
    const reply = await Message.create({
        conversationId: message.conversationId,
        senderId: bot.id,
        content: replyText,
        type: 'text',
        status: 'sent',
        readBy: []
    });

    const fullMessage = await Message.findByPk(reply.id, {
        include: [{ model: User, attributes: ['id', 'username', 'avatarUrl'] }]
    });
    
    io.to(message.conversationId).emit('new_message', fullMessage);

  } catch (err) {
    console.error('Bot handler error', err);
  }
};
