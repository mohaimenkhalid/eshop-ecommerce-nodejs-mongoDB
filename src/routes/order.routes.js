const express = require("express");
const router = express.Router();
const authGuard = require("../middlewares/authGuard.middleware");
const validateRequest = require("../middlewares/validateRequest.middleware");
const { createOrderSchema } = require("../validations/order.validation");
const orderController = require("../controllers/orderController");

router.post(
    "/",
    authGuard,
    validateRequest(createOrderSchema),
    orderController.createOrder
);

module.exports = router;