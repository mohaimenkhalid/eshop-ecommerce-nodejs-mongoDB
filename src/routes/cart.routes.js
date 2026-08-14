const express = require('express')
const router = express.Router();
const cartController = require('../controllers/cartController')
const authGuard = require('../middlewares/authGuard.middleware')
const validateRequest = require('../middlewares/validateRequest.middleware')
const { addToCartSchema } = require('../validations/cart.validation')

router.post('/', authGuard, validateRequest(addToCartSchema), cartController.addToCart)
router.patch('/:cartId', authGuard, cartController.cartQuantityUpdate)

module.exports = router;