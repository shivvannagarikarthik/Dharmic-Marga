const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Search
router.get('/users/search', authenticateToken, chatController.searchUsers);
// Bot
router.get('/bot', authenticateToken, chatController.getBotUser);

// Conversations
router.get('/conversations', authenticateToken, chatController.getConversations);
router.post('/conversations', authenticateToken, chatController.createConversation);

// Messages
router.get('/messages/:conversationId', authenticateToken, chatController.getMessages);
router.post('/messages', authenticateToken, chatController.sendMessage);
router.delete('/messages/:messageId', authenticateToken, chatController.deleteMessage); // Added delete
router.put('/messages/:messageId', authenticateToken, chatController.editMessage); // Added edit
router.post('/messages/:messageId/react', authenticateToken, chatController.reactToMessage); // Added react

module.exports = router;
