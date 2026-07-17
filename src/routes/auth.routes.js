const express = require("express")
const router = express.Router();
const validateRequest = require('../middlewares/validateRequest.middleware')
const {signUpSchema} = require('../validations/auth.validation')
const authController = require('../controllers/auth.controller');

router.post("/signup", validateRequest(signUpSchema), authController.signup)
router.post("/signin", authController.signIn)



module.exports = router