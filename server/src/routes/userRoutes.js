const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.put('/profile', authenticateToken, userController.updateProfile);
router.get('/:userId/status', authenticateToken, userController.getUserStatus);

module.exports = router;
