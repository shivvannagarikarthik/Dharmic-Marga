const express = require('express');
const router = express.Router();
const upload = require('../config/storage');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Upload any file (images, videos, documents, audio)
router.post('/file', authenticateToken, upload.single('file'), uploadController.uploadFile);

// Serve uploaded files
router.get('/media/:filename', uploadController.serveFile);

module.exports = router;
