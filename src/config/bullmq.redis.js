const IORedis = require("ioredis");

const bullmqRedis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

module.exports = bullmqRedis;