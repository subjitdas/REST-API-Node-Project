const Post = require('../models/post');

const { validationResult } = require('express-validator/check');

exports.getPosts = (req, res, next) => {
    Post.find()
        .then(posts => {
            res.status(200).json({
                posts: posts
            });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
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
    if (!req.file) {
        const error = new Error('Image not found');
        error.statusCode = 422;
        throw error;
    }
    const post = new Post({
        title: title,
        imageUrl: req.file.path,
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

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById({ _id: postId })
        .then(post => {
            if (!post) {
                const error = new Error('No post found, server side error');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                post: post
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};