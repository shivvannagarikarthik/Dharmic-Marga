const { User, Conversation, Message, ConversationParticipant } = require('../models');
const { Op } = require('sequelize');

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user.id;

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.iLike]: `%${query}%` } },
                    { phoneNumber: { [Op.iLike]: `%${query}%` } }
                ],
                id: { [Op.ne]: userId } // Exclude self
            },
            attributes: ['id', 'username', 'avatarUrl', 'phoneNumber']
        });

        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get AI Bot User directly
exports.getBotUser = async (req, res) => {
    try {
        let bot = await User.findOne({ where: { phoneNumber: '0000000000' } });
        if (!bot) {
            bot = await User.create({
                username: 'Dharma Guide',
                phoneNumber: '0000000000',
                bio: 'I am your spiritual guide.',
                avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png' // Consider using local asset if this fails?
            });
        }
        res.json(bot);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get bot' });
    }
};

// Get all conversations for the logged-in user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all conversations the user is part of
        const userConversations = await ConversationParticipant.findAll({
            where: { UserId: userId },
            attributes: ['ConversationId']
        });

        const conversationIds = userConversations.map(uc => uc.ConversationId);

        const conversations = await Conversation.findAll({
            where: { id: conversationIds },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'avatarUrl'],
                    through: { attributes: [] }
                },
                {
                    model: Message,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    separate: true
                }
            ]
        });

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const messages = await Message.findAll({
            where: { conversationId },
            include: [
                { model: User, attributes: ['id', 'username', 'avatarUrl'] },
                { model: Message, as: 'ReplyTo', include: [{ model: User, attributes: ['username'] }] }
            ],
            order: [['createdAt', 'ASC']]
        });

        // Normalize for frontend (text, sender, timestamp)
        const formattedMessages = messages.map(m => {
            const msg = m.toJSON();
            return {
                ...msg,
                text: msg.content,
                timestamp: msg.createdAt,
                sender: msg.User
            };
        });

        res.json(formattedMessages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, content, type, replyToId } = req.body;
        const senderId = req.user.id;

        const message = await Message.create({
            conversationId,
            senderId,
            content,
            type: type || 'text',
            status: 'sent',
            replyToId: replyToId || null
        });

        const fullMessage = await Message.findByPk(message.id, {
            include: [{ model: User, attributes: ['id', 'username', 'avatarUrl'] }]
        });

        const msg = fullMessage.toJSON();
        const formattedMessage = {
            ...msg,
            text: msg.content,
            timestamp: msg.createdAt,
            sender: msg.User
        };

        res.status(201).json(formattedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Start or Get Conversation
exports.createConversation = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user.id;

        // 1. Find common conversation IDs between sender and recipient
        const senderConvs = await ConversationParticipant.findAll({
            where: { UserId: senderId },
            attributes: ['ConversationId']
        });
        const senderConvIds = senderConvs.map(c => c.ConversationId);

        const recipientConvs = await ConversationParticipant.findAll({
            where: { UserId: recipientId },
            attributes: ['ConversationId']
        });
        const recipientConvIds = recipientConvs.map(c => c.ConversationId);

        // Intersection
        const commonIds = senderConvIds.filter(id => recipientConvIds.includes(id));

        // 2. Check if any common conversation is 'private'
        let conversation = null;
        if (commonIds.length > 0) {
            conversation = await Conversation.findOne({
                where: {
                    id: { [Op.in]: commonIds },
                    type: 'private'
                },
                include: [
                    { model: User, attributes: ['id', 'username', 'avatarUrl'] }
                ]
            });
        }

        if (conversation) {
            return res.json(conversation);
        }

        // 3. Create new conversation if none exists
        const recipient = await User.findByPk(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        const newConversation = await Conversation.create({
            name: recipient.username,
            type: 'private'
        });

        await ConversationParticipant.create({ ConversationId: newConversation.id, UserId: senderId });
        await ConversationParticipant.create({ ConversationId: newConversation.id, UserId: recipientId });

        // Reload to include Users
        conversation = await Conversation.findByPk(newConversation.id, {
            include: [
                { model: User, attributes: ['id', 'username', 'avatarUrl'] }
            ]
        });

        res.status(201).json(conversation);

    } catch (err) {
        console.error("Create Conversation Error:", err);
        res.status(500).json({ message: 'Failed to create conversation' });
    }
};

// Delete Message
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        await Message.update({ isDeleted: true, content: 'This message was deleted', mediaUrl: null }, { where: { id: messageId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
};

exports.editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        await Message.update({ content, editedAt: new Date() }, { where: { id: messageId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
};

exports.reactToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        const message = await Message.findByPk(messageId);
        let reactions = message.reactions || {};

        if (reactions[userId] === emoji) {
            delete reactions[userId];
        } else {
            reactions[userId] = emoji;
        }

        await Message.update({ reactions }, { where: { id: messageId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
};
