const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }
        const email = req.body.email;
        const name = req.body.name;
        const password = req.body.password;
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPassword,
            name: name
        });
        const result = await user.save();
        res.status(201).json({
            message: 'User created!',
            userId: result._id
        })
    }
    catch(err) {
        if (!err.statusCode) {
            err.statuCode = 500;
        }
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try {
        const user = await User.findOne({ email: email});
        if (!user) {
            const error = new Error('User with this email was not found');
            error.statuCode = 404;
            throw error;
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Invalid password!')
            error.statuCode = 401;
            throw error;
        }
        const token = await jwt.sign(
            {
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            },
            'thesecrettoken',
            {
                expiresIn: '1h'
            }
        );
        res.status(200).json({
            token: token,
            userId: loadedUser._id.toString()
        });
    }
    catch(err) {
        if (!err.statuCode) {
            err.statuCode = 500;
        }
        next(err);
    }
};

exports.getStatus = async (req, res, next) => {
    try{
        const user = await User.findById(req.userId);
        res.status(200).json({
            status: user.status
        })
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    const updatedStatus = req.body.status;
    try{
        const user = await User.findById(req.userId);
        user.status = updatedStatus;
        await user.save();
        res.status(201).json({
            message: "Updated status successfully"
        });
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};