const express = require('express');
const { body } = require('express-validator/check');

const authController = require('../controller/auth');
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put('/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .custom( async (value, { req }) => {
                try {
                    const user = await User.findOne({ email: value });
                    if(user) {
                        const error = new Error("Email already exists");
                        error.statusCode = 403;
                        throw error;
                    }
                }
                catch(error) {
                    throw error;
                }
            })
            .normalizeEmail(),
        body('password')
            .trim()
            .isLength({ min: 5 }),
        body('name')
            .trim()
            .not().isEmpty()
    ],
    authController.signup
);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getStatus);

router.patch('/status',
    isAuth,
    [
        body('status')
            .trim()
            .isLength({ max: 50 })
    ],
    authController.updateStatus
);


module.exports = router;