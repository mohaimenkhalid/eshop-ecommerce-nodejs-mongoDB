const express = require("express")
const router = express.Router();
const brandController = require('../controllers/brandController');
const upload = require('../middlewares/upload.middleware')
const FILE_TYPES = require('../constants/fileTypes')
const authGuard = require('../middlewares/authGuard.middleware')
const roleGuard = require('../middlewares/roleGuard.middleware')
const validateRequest = require('../middlewares/validateRequest.middleware')
const { createBrandSchema, updateBrandSchema } = require('../validations/brand.validation')

//brands are global catalog data, so only admins may write
const BRAND_MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN"];

router.get('/', brandController.getPaginateBrands)
router.get('/all', brandController.getAllBrands)
router.post("/create", authGuard, roleGuard(...BRAND_MANAGE_ROLES), upload({
    folder: "brands",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(createBrandSchema), brandController.create)

router.patch('/:id', authGuard, roleGuard(...BRAND_MANAGE_ROLES), upload({
    folder: "brands",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(updateBrandSchema), brandController.update)

router.delete('/:id', authGuard, roleGuard(...BRAND_MANAGE_ROLES), brandController.delete)



module.exports = router;