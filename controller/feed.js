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
    //Add this data/post to the database
    res.status(201).json({
        message: 'post created successfully',
        post: {
            _id: new Date().toISOString(),
            title: title,
            content: content,
            creator: {
                name: 'Subjit'
            },
            createdAt: new Date()
        }
    });
};