exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{ title: 'First post', content: 'This is the first post'}]
    });
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    //Add this data/post to the database
    res.status(201).json({
        message: 'post created successfully',
        post: {
            id: new Date().toISOString(),
            title: title,
            content: content
        }
    });
};