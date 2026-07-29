const express = require("express")
const router = express.Router();
const brandController = require('../controllers/brandController');
const upload = require('../middlewares/upload.middleware')
const FILE_TYPES = require('../constants/fileTypes')
const validateRequest = require('../middlewares/validateRequest.middleware')
const { createBrandSchema, updateBrandSchema } = require('../validations/brand.validation')

router.get('/', brandController.getPaginateBrands)
router.get('/all', brandController.getAllBrands)
router.post("/create", upload({
    folder: "brands",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(createBrandSchema), brandController.create)

router.patch('/:id', upload({
    folder: "brands",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), validateRequest(updateBrandSchema), brandController.update)

router.delete('/:id', brandController.delete)



module.exports = router;