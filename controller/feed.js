const path = require('path');
const fs = require('fs');

const Post = require('../models/post');

const { validationResult } = require('express-validator/check');
const { find } = require('../models/post');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find()
        .countDocuments()
        .then(noOfPosts => {
            totalItems = noOfPosts;
            return  Post.find()
                .skip((currentPage-1) * perPage)
                .limit(perPage);    
        })
        .then(posts => {
            res.status(200).json({
                posts: posts,
                totalItems: totalItems
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

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, invalid input')
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file picked');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('No post found, server side error');
                error.statusCode = 404;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save()
        })
        .then(result => {
            return res.status(200).json({ post: result });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('No post found, server side error');
                error.statusCode = 404;
                throw error;
            }
            //check if the user is loggeed in
            clearImage(post.imageUrl);
            return Post.findByIdAndDelete(postId);
        })
        .then(() => {
            return res.status(200).json({ message: 'Post deleted!' });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};