const express = require("express")
const router = express.Router();
const brandController = require('../controllers/brandController');
const upload = require('../middlewares/upload.middleware')
const FILE_TYPES = require('../constants/fileTypes')

router.get('/', brandController.getPaginateBrands)
router.get('/all', brandController.getAllBrands)
router.post("/create", upload({
    folder: "brands",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), brandController.create)

router.patch('/:id', upload({
    folder: "brands",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).single("image"), brandController.update)



module.exports = router;