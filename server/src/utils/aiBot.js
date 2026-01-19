const { User, Message, Conversation, ConversationParticipant } = require('../models');
const axios = require('axios');

const BOT_PHONE = '0000000000';
const BOT_NAME = 'AI Assistant';

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
    }
    return bot;
  } catch (err) {
    console.error('Bot init failed', err);
  }
};

exports.handleBotMessage = async (message, io) => {
  try {
    const participants = await ConversationParticipant.findAll({ 
        where: { ConversationId: message.conversationId } 
    });
    const bot = await User.findOne({ where: { phoneNumber: BOT_PHONE } });
    if (!bot) return;

    const isBotInConv = participants.some(p => p.UserId === bot.id);
    if (!isBotInConv || message.senderId === bot.id) return;

    let replyText = "Thinking...";
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        replyText = "I need a Brain! (Please add GEMINI_API_KEY to .env)";
    } else if (message.content.toLowerCase() === 'system list models') {
        // DEBUG TOOL: List available models
        try {
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const listResp = await axios.get(listUrl);
            const models = listResp.data.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace('models/', ''))
                .join(', ');
            replyText = `Available Models: ${models}`;
        } catch (err) {
            replyText = `List Error: ${err.message}`;
        }
    } else {
        try {
            // Using 'gemini-flash-latest' as confirmed valid by user diagnostic
            const modelName = 'gemini-flash-latest';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{
                    parts: [{
                        text: `You are a spiritual AI named 'Dharma Guide'. User said: "${message.content}". Answer wisely.`
                    }]
                }]
            };

            const response = await axios.post(url, payload);
            
            if (response.data?.candidates?.[0]?.content) {
                replyText = response.data.candidates[0].content.parts[0].text;
            } else {
                replyText = "I felt that, but I have no words.";
            }

        } catch (apiError) {
            console.error('Gemini REST API Error:', apiError.response ? apiError.response.data : apiError.message);
            const errData = apiError.response ? apiError.response.data : {};
            if (errData.error) {
                 replyText = `Error: ${errData.error.message} (Code: ${errData.error.code})`;
            } else {
                 replyText = "Connection Error (Check Logs)";
            }
        }
    }
    
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
