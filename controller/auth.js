const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email})
        .then(user => {
            if (!user) {
                const error = new Error('User with this email was not found');
                error.statuCode = 404;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Invalid password!')
                error.statuCode = 401;
                throw error;
            }
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                'thesecrettoken',
                {
                    expiresIn: '1h'
                }
            );
            return res.status(200).json({
                token: token,
                userId: loadedUser._id.toString()
            });
        })
        .catch(err => {
            if (!err.statuCode) {
                err.statuCode = 500;
            }
            next(err);
        });
};

exports.getStatus = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            res.status(200).json({
                status: user.status
            })
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.updateStatus = (req, res, next) => {
    const updatedStatus = req.body.status;
    User.findById(req.userId)
        .then(user => {
            user.status = updatedStatus;
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: "Updated status successfully"
            });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};