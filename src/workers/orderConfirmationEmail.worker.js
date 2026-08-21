const { Worker } = require("bullmq");
const bullmqRedis = require("../config/bullmq.redis");
const { QUEUE_NAME } = require("../queues/orderConfirmationEmail.queue");
const orderRepository = require("../repositories/order.repository");
const emailService = require("../services/email.service");
const { renderOrderConfirmationHtml } = require("../templates/orderConfirmation.template");
const createError = require("../utils/createError");

const processOrderConfirmationEmailJob = async (job) => {
    const { orderId } = job.data;

    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
        throw createError(`Order not found for id ${orderId}`, 404);
    }

    const user = order.user;
    if (!user?.email) {
        throw createError(`No email found for user of order ${order.orderNumber}`, 400);
    }

    await emailService.sendMail({
        to: user.email,
        subject: `Order #${order.orderNumber} placed successfully`,
        html: renderOrderConfirmationHtml(order),
    });
};

const orderConfirmationEmailWorker = new Worker(QUEUE_NAME, processOrderConfirmationEmailJob, {
    connection: bullmqRedis,
});

orderConfirmationEmailWorker.on("completed", (job) => {
    console.log(`✅ order-confirmation-email job ${job.id} completed (order ${job.data.orderId})`);
});

orderConfirmationEmailWorker.on("failed", (job, err) => {
    console.error(`❌ order-confirmation-email job ${job?.id} failed (order ${job?.data?.orderId}):`, err.message);
});

module.exports = orderConfirmationEmailWorker;
