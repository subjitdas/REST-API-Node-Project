const path = require('path');
const fs = require('fs');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

const { validationResult } = require('express-validator/check');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {    
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort( {createdAt: -1} )
            .skip((currentPage-1) * perPage)
            .limit(perPage);    
        res.status(200).json({
            posts: posts,
            totalItems: totalItems
        });
    }
    catch(error) {
        if(!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    try {
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
        const title = req.body.title;
        const content = req.body.content;
        let creator;
        const post = new Post({
            title: title,
            imageUrl: req.file.path,
            content: content,
            creator: req.userId
        });
        await post.save();
        const user = await User.findById(req.userId);
        creator = user;
        await user.posts.push(post);
        await user.save();
        io.getIO().emit('posts', {
            action: 'create',
            post: {
                ...post._doc,
                creator: {
                    _id: req.userId,
                    name: user.name
                }
            }
        })
        res.status(201).json({
            message: 'post created successfully',
            post: post,
            creator: {
                _id: creator._id,
                name: creator.name
            }
        });
    }
    catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById({ _id: postId }).populate('creator');
        if (!post) {
            const error = new Error('No post found, server side error');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            post: post
        });
    }
    catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    try {
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
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const error = new Error('No post found, server side error');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Unauthorized action!');
            error.statusCode = 403;  //status code for authoriztion issue
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();
        io.getIO().emit('posts', {
            action: 'update',
            post: result
        });
        res.status(200).json({ post: result });
    }
    catch(err) {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('No post found, server side error');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId.toString()) {
            const error = new Error('Unauthorized action!');
            error.statusCode = 403;  //status code for authoriztion issue
            throw error;
        }
        await clearImage(post.imageUrl);
        await Post.findByIdAndDelete(postId);
        const user = await User.findById(req.userId);
        await user.posts.pull(postId);
        await user.save();
        io.getIO().emit('posts', {
            action: 'delete',
            post: postId
        });
        res.status(200).json({ message: 'Post deleted!' });
    }   
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};