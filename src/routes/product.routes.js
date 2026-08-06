const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')
const upload = require("../middlewares/upload.middleware");
const FILE_TYPES = require("../constants/fileTypes");
const validateRequest = require('../middlewares/validateRequest.middleware')
const {createProductSchema, updateProductSchema} = require('../validations/product.validation')

//product
router.post('/create', validateRequest(createProductSchema), productController.create)
router.patch('/:id', validateRequest(updateProductSchema), productController.update)

//variant
router.post('/:id/variants', productController.addVariant)
router.patch('/variants/:variantId', productController.updateVariantById)
router.delete('/variants/:variantId', productController.deleteVariant)
router.post(
    '/variants/:variantId/images',
    upload({ folder: 'variants', allowedMimeTypes: FILE_TYPES.IMAGES }).array('images', 10),
    productController.addVariantImages
)

router.delete('/variants/:variantId/image', productController.deleteVariantImage)


module.exports = router;