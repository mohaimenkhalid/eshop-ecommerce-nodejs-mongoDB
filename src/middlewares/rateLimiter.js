const rateLimit = require("express-rate-limit");
// const { RedisStore } = require("rate-limit-redis");
//
// const { redisClient } = require("../config/redis");

const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    limit: 100, // max 100 requests per IP

    standardHeaders: "draft-8",
    legacyHeaders: false,

    // store: new RedisStore({
    //     sendCommand: (...args) => redisClient.sendCommand(args),
    // }),

    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

module.exports = {
    globalRateLimiter,
};