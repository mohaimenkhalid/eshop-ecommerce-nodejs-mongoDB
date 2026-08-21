const { Queue } = require("bullmq");
const bullmqRedis = require("../config/bullmq.redis");

const QUEUE_NAME = "order-confirmation-email";

const orderConfirmationEmailQueue = new Queue(QUEUE_NAME, { connection: bullmqRedis });

exports.QUEUE_NAME = QUEUE_NAME;
exports.orderConfirmationEmailQueue = orderConfirmationEmailQueue;

exports.enqueueOrderConfirmationEmail = ({ orderId }) => {
    return orderConfirmationEmailQueue.add(
        "send-order-confirmation-email",
        { orderId },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        }
    );
};
