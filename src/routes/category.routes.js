const express = require("express")
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const upload = require('../middlewares/upload.middleware')
const FILE_TYPES = require('../constants/fileTypes')
const authGuard = require('../middlewares/authGuard.middleware')
const roleGuard = require('../middlewares/roleGuard.middleware')
const validateRequest = require('../middlewares/validateRequest.middleware')
const { createCategorySchema, updateCategorySchema } = require('../validations/category.validation')

//categories are global catalog data, so only admins may write
const CATEGORY_MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN"];

router.get('/', categoryController.getPaginateCategories)
router.get('/all', categoryController.getAllCategories)
router.post("/create", authGuard, roleGuard(...CATEGORY_MANAGE_ROLES), upload({
    folder: "categories",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(createCategorySchema), categoryController.create)

router.patch('/:id', authGuard, roleGuard(...CATEGORY_MANAGE_ROLES), upload({
    folder: "categories",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(updateCategorySchema), categoryController.update)

router.delete('/:id', authGuard, roleGuard(...CATEGORY_MANAGE_ROLES), categoryController.delete)

module.exports = router;
