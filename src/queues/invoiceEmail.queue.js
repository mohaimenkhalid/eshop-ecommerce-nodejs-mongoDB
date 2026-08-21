const { Queue } = require("bullmq");
const bullmqRedis = require("../config/bullmq.redis");

const QUEUE_NAME = "invoice-email";

const invoiceEmailQueue = new Queue(QUEUE_NAME, { connection: bullmqRedis });

exports.QUEUE_NAME = QUEUE_NAME;
exports.invoiceEmailQueue = invoiceEmailQueue;

exports.enqueueInvoiceEmail = ({ orderId }) => {
    return invoiceEmailQueue.add(
        "send-invoice-email",
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
