const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statuCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                name: name
            });
            return user.save();
        })
        .then(result => {
            return res.status(201).json({
                message: 'User created!',
                userId: result._id
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statuCode = 500;
            }
            next(err);
        });
};