const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/users/search', chatController.searchUsers);
router.get('/bot', chatController.getBotUser); // Added Route
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.post('/conversations', chatController.createConversation);

// Message Actions
router.delete('/messages/:messageId', chatController.deleteMessage);
router.put('/messages/:messageId', chatController.editMessage);
router.post('/messages/:messageId/react', chatController.reactToMessage);

module.exports = router;
