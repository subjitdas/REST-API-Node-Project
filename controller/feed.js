const Post = require('../models/post');

const { validationResult } = require('express-validator/check');

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [
            {
                _id: '1', 
                title: 'First post', 
                content: 'This is the first post', 
                imageUrl: 'images/book.png',
                creator: {
                    name: 'Subjit'
                },
                createdAt: new Date()
            }
        ]
    });
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, invalid input')
        error.statusCode = 422;
        throw error;
    }
    const post = new Post({
        title: title,
        imageUrl: 'images/book.png',
        content: content,
        creator: {
            name: 'Dummy Creator'
        }
    });
    post.save()
        .then(result => {
            res.status(201).json({
                message: 'post created successfully',
                post: result
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};