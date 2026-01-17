const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: 'redis://' + process.env.REDIS_HOST + ':' + process.env.REDIS_PORT
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// We export the client, connection should be handled at app start to avoid async issues in requires
module.exports = redisClient;
