const express = require("express")
const router = express.Router();
const validateRequest = require('../middlewares/validateRequest.middleware')
const {signUpSchema, signInSchema} = require('../validations/auth.validation')
const authController = require('../controllers/auth.controller');

router.post("/signup", validateRequest(signUpSchema), authController.signup)
router.post("/signin", validateRequest(signInSchema), authController.signIn)



module.exports = router