const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const MONGODB_URI = 'mongodb+srv://'+process.env.user+':'+process.env.password+'@cluster0-fzxis.mongodb.net/social-media';

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};

app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image')
);


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({
        message: message,
        data: data
    })
});

mongoose.connect(MONGODB_URI)
    .then(() => {
        const server = app.listen(8080);
        const io = require('./socket').init(server);
        io.on('connection', socket => {
            console.log('Client connected!');
        });
    })
    .then(() => {
        console.log('Connected to port 8080!');
    })
    .catch(err => {
        err.statusCode = 500;
        next(err);
    });