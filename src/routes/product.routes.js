const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')
const upload = require("../middlewares/upload.middleware");
const FILE_TYPES = require("../constants/fileTypes");
const authGuard = require('../middlewares/authGuard.middleware')
const roleGuard = require('../middlewares/roleGuard.middleware')
const validateRequest = require('../middlewares/validateRequest.middleware')
const {createProductSchema, updateProductSchema} = require('../validations/product.validation')

//merchants sell, admins moderate - both may write products and variants
const PRODUCT_MANAGE_ROLES = ["MERCHANT", "ADMIN", "SUPER_ADMIN"];
const productWriteGuards = [authGuard, roleGuard(...PRODUCT_MANAGE_ROLES)];

//product
router.get('/', productController.getPaginateProducts)
router.post('/create', ...productWriteGuards, validateRequest(createProductSchema), productController.create)
router.patch('/:id', ...productWriteGuards, validateRequest(updateProductSchema), productController.update)

//variant
router.post('/:id/variants', ...productWriteGuards, productController.addVariant)
router.patch('/variants/:variantId', ...productWriteGuards, productController.updateVariantById)
router.delete('/variants/:variantId', ...productWriteGuards, productController.deleteVariant)
router.post(
    '/variants/:variantId/images',
    ...productWriteGuards,
    upload({ folder: 'variants', allowedMimeTypes: FILE_TYPES.IMAGES }).array('images', 10),
    productController.addVariantImages
)

router.delete('/variants/:variantId/image', ...productWriteGuards, productController.deleteVariantImage)


module.exports = router;