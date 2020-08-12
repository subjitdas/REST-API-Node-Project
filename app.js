const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');

const MONGODB_URI = 'mongodb+srv://'+process.env.user+':'+process.env.password+'@cluster0-fzxis.mongodb.net/social-media';

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

mongoose.connect(MONGODB_URI)
    .then(() => {
        app.listen(8080, () => {
            console.log('Connected to port 8080!');
        });
    })
    .catch(err => console.log(err));