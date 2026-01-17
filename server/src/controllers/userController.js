const { User } = require('../models');
const redisClient = require('../config/redis');

exports.updateProfile = async (req, res) => {
  try {
    const { username, avatarUrl, bio } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.username = username || user.username;
    user.avatarUrl = avatarUrl || user.avatarUrl;
    user.bio = bio || user.bio; // Ensure User model has bio or ignore if not
    
    await user.save();
    res.json(user);
  } catch (error) {
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
        const user = await User.findByPk(userId, { attributes: ['lastSeen'] });
        lastSeen = user?.lastSeen;
    }

    res.json({ status, lastSeen });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching status' });
  }
};
