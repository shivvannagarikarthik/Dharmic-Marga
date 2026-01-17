const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, groupController.createGroup);
router.get('/:groupId', authenticateToken, groupController.getGroupInfo);
router.post('/:groupId/participants', authenticateToken, groupController.addParticipants);
router.delete('/:groupId/participants/:userId', authenticateToken, groupController.removeParticipant);
router.post('/:groupId/leave', authenticateToken, groupController.leaveGroup);

module.exports = router;
