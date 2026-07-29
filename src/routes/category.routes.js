const express = require("express")
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const upload = require('../middlewares/upload.middleware')
const FILE_TYPES = require('../constants/fileTypes')
const validateRequest = require('../middlewares/validateRequest.middleware')
const { createCategorySchema, updateCategorySchema } = require('../validations/category.validation')

router.get('/', categoryController.getPaginateCategories)
router.get('/all', categoryController.getAllCategories)
router.post("/create", upload({
    folder: "categories",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(createCategorySchema), categoryController.create)

router.patch('/:id', upload({
    folder: "categories",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(updateCategorySchema), categoryController.update)

router.delete('/:id', categoryController.delete)

module.exports = router;
