const express = require("express")
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getPaginateCategories)
router.get('/all', categoryController.getAllCategories)

module.exports = router;
