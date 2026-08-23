const express = require("express")
const router = express.Router();
const shopController = require('../controllers/shopController');
const upload = require('../middlewares/upload.middleware')
const FILE_TYPES = require('../constants/fileTypes')
const authGuard = require('../middlewares/authGuard.middleware')
const roleGuard = require('../middlewares/roleGuard.middleware')
const validateRequest = require('../middlewares/validateRequest.middleware')
const { createShopSchema, updateShopSchema } = require('../validations/shop.validation')

const shopUpload = upload({
    folder: "shops",
    allowedMimeTypes: FILE_TYPES.IMAGES,
}).fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
]);

const SHOP_MANAGE_ROLES = ["MERCHANT", "ADMIN", "SUPER_ADMIN"];

router.get('/', shopController.getPaginateShops)
router.get('/all', shopController.getAllShops)

router.post('/create',
    authGuard,
    roleGuard(...SHOP_MANAGE_ROLES),
    shopUpload,
    validateRequest(createShopSchema),
    shopController.create
)

//kept below /all so the static route is not swallowed by the param route
router.get('/:id', shopController.getShopById)

router.patch('/:id',
    authGuard,
    roleGuard(...SHOP_MANAGE_ROLES),
    shopUpload,
    validateRequest(updateShopSchema),
    shopController.update
)

router.delete('/:id', authGuard, roleGuard(...SHOP_MANAGE_ROLES), shopController.delete)


module.exports = router;
