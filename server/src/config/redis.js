const { createClient } = require('redis');
require('dotenv').config();

let redisClient;

// Use REDIS_URL if provided (common in cloud), or build from HOST/PORT
// Fail gracefully if neither exists.
const url = process.env.REDIS_URL || 
            (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` : null);

if (url) {
    console.log('Using Redis at:', url.replace(/:.*@/, ':***@')); // Log masked (if password)
    redisClient = createClient({ url });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Redis Client Connected'));
} else {
    console.log('>>> NO REDIS CONFIG FOUND. USING MOCK CLIENT. <<<');
    
    // Mock Interface matches basic Redis client methods
    redisClient = {
        isOpen: false,
        connect: async () => { console.log('Mock Redis Connect: Usage of DB only.'); },
        on: (event, cb) => { 
            if(event === 'error') console.log('Mock Redis: Error handler registered'); 
        },
        set: async (key, val, opts) => { console.log(`Mock Redis SET: ${key}`); return 'OK'; },
        get: async (key) => { console.log(`Mock Redis GET: ${key}`); return null; },
        del: async (key) => { console.log(`Mock Redis DEL: ${key}`); return 1; },
        quit: async () => {}
    };
}

module.exports = redisClient;
