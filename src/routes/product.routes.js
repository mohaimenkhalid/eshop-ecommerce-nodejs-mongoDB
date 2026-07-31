const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')
const upload = require("../middlewares/upload.middleware");
const FILE_TYPES = require("../constants/fileTypes");
const validateRequest = require('../middlewares/validateRequest.middleware')
const {createProductSchema, updateProductSchema} = require('../validations/product.validation')

router.post('/create', validateRequest(createProductSchema), productController.create)
router.patch('/:id', validateRequest(updateProductSchema), productController.update)


module.exports = router;