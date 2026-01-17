const { User } = require('../models');
const app = require('../app'); // To ensure DB connection if needed, but app starts server. Better to just connect DB.
const sequelize = require('../config/db');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');
        
        const bot = await User.findOne({ where: { phoneNumber: '0000000000' } });
        if (bot) {
            console.log('Bot found:', bot.toJSON());
        } else {
            console.log('Bot NOT found!');
            // Create it
             const newBot = await User.create({
                username: 'AI Assistant',
                phoneNumber: '0000000000',
                bio: 'I am your personal AI assistant.',
                avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png'
            });
            console.log('Bot Created:', newBot.toJSON());
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
