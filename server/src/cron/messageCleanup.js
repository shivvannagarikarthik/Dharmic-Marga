const cron = require('node-cron');
const { Message } = require('../models');
const { Op } = require('sequelize');

const startCleanupJob = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const result = await Message.destroy({
                where: {
                    expiresAt: {
                        [Op.lt]: now
                    }
                }
            });
            if (result > 0) {
                console.log(`🧹 Deleted ${result} expired disappearing messages.`);
            }
        } catch (err) {
            console.error('Cleanup job error', err);
        }
    });
    console.log('Message Cleanup Job Started (Every 1m)');
};

module.exports = startCleanupJob;
