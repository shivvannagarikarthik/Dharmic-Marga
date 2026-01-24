const { User } = require('../models');
const { Op } = require('sequelize');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        await User.update(updates, { where: { id: userId } });
        const updatedUser = await User.findByPk(userId);

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Update failed' });
    }
};

exports.getUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId, { attributes: ['isOnline', 'lastSeen'] });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
};

// NEW: Get All Users (for New Chat list)
exports.getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const users = await User.findAll({
            where: {
                id: { [Op.ne]: currentUserId } // Exclude self
            },
            attributes: ['id', 'username', 'avatarUrl', 'bio']
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};
