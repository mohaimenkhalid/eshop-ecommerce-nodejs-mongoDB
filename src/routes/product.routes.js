const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')
const upload = require("../middlewares/upload.middleware");
const FILE_TYPES = require("../constants/fileTypes");
const validateRequest = require('../middlewares/validateRequest.middleware')
const {createProductSchema} = require('../validations/product.validation')

router.post('/create', upload({
    folder: "categories",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(createProductSchema), productController.create)

module.exports = router;