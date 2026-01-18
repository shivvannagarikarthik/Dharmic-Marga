const { User } = require('../models');
const redisClient = require('../config/redis');

exports.updateProfile = async (req, res) => {
  try {
    const { username, avatarUrl, bio, privacySettings, appSettings } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username !== undefined) user.username = username;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio;
    
    // Update Settings (Merge or Replace)
    if (privacySettings) {
        user.privacySettings = { ...user.privacySettings, ...privacySettings };
    }
    if (appSettings) {
        user.appSettings = { ...user.appSettings, ...appSettings };
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Update failed' });
  }
};

exports.getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    let status = 'offline';
    let lastSeen = null;

    if (redisClient.isOpen) {
      const socketId = await redisClient.get(`user:${userId}:socketId`);
      status = socketId ? 'online' : 'offline';
      lastSeen = await redisClient.get(`user:${userId}:lastSeen`);
    }

    // If no last seen in redis (e.g. server restart), fallback to DB
    if (!lastSeen) {
        const user = await User.findByPk(userId, { attributes: ['lastSeen', 'privacySettings'] });
        
        // Check Privacy Settings
        if (user?.privacySettings?.lastSeen === 'none') {
            lastSeen = null; // Hide it
            status = 'offline'; // Hide status too? Usually just last seen.
        }
        else {
             lastSeen = user?.lastSeen;
        }
    }

    res.json({ status, lastSeen });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching status' });
  }
};
