const { Worker } = require("bullmq");
const bullmqRedis = require("../config/bullmq.redis");
const { QUEUE_NAME } = require("../queues/invoiceEmail.queue");
const orderRepository = require("../repositories/order.repository");
const paymentRepository = require("../repositories/payment.repository");
const pdfService = require("../services/pdf.service");
const emailService = require("../services/email.service");
const createError = require("../utils/createError");

const processInvoiceEmailJob = async (job) => {
    const { orderId } = job.data;

    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
        throw createError(`Order not found for id ${orderId}`, 404);
    }

    const payment = await paymentRepository.getPaymentByOrderId(orderId)

    if (!order.user?.email) {
        throw createError(`No email found for user of order ${order.orderNumber}`, 400);
    }

    const pdfBuffer = await pdfService.generateInvoicePdf(order, payment);

    await emailService.sendMail({
        to: order.user.email,
        subject: `Your Order has been confirmed. Invoice for your order #${order.orderNumber}`,
        html: `<p>Hi ${order.user.name},</p><p>Your order has been confirmed. Please find your invoice for order <strong>#${order.orderNumber}</strong> attached.</p>`,
        attachments: [
            {
                filename: `invoice-${order.orderNumber}.pdf`,
                content: pdfBuffer,
            },
        ],
    });
};

const invoiceEmailWorker = new Worker(QUEUE_NAME, processInvoiceEmailJob, {
    connection: bullmqRedis,
});

invoiceEmailWorker.on("completed", (job) => {
    console.log(`✅ invoice-email job ${job.id} completed (order ${job.data.orderId})`);
});

invoiceEmailWorker.on("failed", (job, err) => {
    console.error(`❌ invoice-email job ${job?.id} failed (order ${job?.data?.orderId}):`, err.message);
});

module.exports = invoiceEmailWorker;
