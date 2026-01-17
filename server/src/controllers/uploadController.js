const path = require('path');
const fs = require('fs');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/api/media/${req.file.filename}`;
    const fileType = req.file.mimetype.split('/')[0]; // image, video, audio, application

    res.json({
      success: true,
      file: {
        url: fileUrl,
        type: fileType,
        mimeType: req.file.mimetype,
        fileName: req.file.originalname,
        fileSize: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
};

exports.serveFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Search in all upload folders
    const folders = ['images', 'videos', 'audio', 'documents'];
    let filePath = null;

    for (const folder of folders) {
      const testPath = path.join(__dirname, '../../uploads', folder, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
};
