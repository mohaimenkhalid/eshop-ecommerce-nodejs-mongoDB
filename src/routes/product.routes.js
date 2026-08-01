const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')
const upload = require("../middlewares/upload.middleware");
const FILE_TYPES = require("../constants/fileTypes");
const validateRequest = require('../middlewares/validateRequest.middleware')
const {createProductSchema, updateProductSchema} = require('../validations/product.validation')

router.post('/create', validateRequest(createProductSchema), productController.create)
router.patch('/:id', validateRequest(updateProductSchema), productController.update)
router.post('/:id/variants', productController.addVariant)

module.exports = router;



// POST   /products/:id/variants
// PATCH  /variants/:variantId
// DELETE /variants/:variantId

// POST   /variants/:variantId/images
// DELETE /variants/:variantId/images/:imageId