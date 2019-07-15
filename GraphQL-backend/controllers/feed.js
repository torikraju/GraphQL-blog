const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

const io = require('../socket');

const { throwError, sendError, clearImage } = require('../util/appUtil');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query['page'] || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().populate('creator').sort({ createdAt: -1 }).skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: 'Fetched posts successfully.',
      posts,
      totalItems
    });
  }
  catch (err) {
    sendError(err, next, 500);
  }
};

exports.createPost = (req, res, next) => {
  const image = req.file;
  if (!image) throwError('No image provided', 422);

  const errors = validationResult(req);
  if (!errors.isEmpty()) throwError('Validation failed, entered data is incorrect.', 422);
  const { title, content } = req.body;
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl: image.path.replace(/\\/g, '/'),
    creator: req.userId
  });
  post.save()
    .then(() => User.findById(req.userId))
    .then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then(() => {
      io.getIO().emit('posts', { actions: 'create', post });
      res.status(201).json({
        message: 'Post created successfully!',
        post,
        creator: { _id: creator._id, name: creator.name }
      });
    })
    .catch(err => sendError(err, next, 500));
};

exports.getPost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) throwError('Could not found post.', 404);
    res.status(200).json({ message: 'post fetched', post });
  }
  catch (err) {
    sendError(err, next, 500);
  }
};

exports.updatePost = (req, res, next) => {
  const { postId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) throwError('Validation failed, entered data is incorrect.', 422);
  const { title, content } = req.body;
  let imageUrl = req.body.image;
  if (req.file) imageUrl = req.file.path;
  if (!imageUrl) throwError('No image provided', 422);
  Post.findById(postId).populate('creator')
    .then(post => {
      if (!post) throwError('Could not found post.', 404);
      if (post.creator._id.toString() !== req.userId) throwError('Not authorize', 403);
      if (imageUrl !== post.imageUrl) clearImage(post.imageUrl);

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then(result => {
      io.getIO().emit('posts', { actions: 'update', post: result });
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => sendError(err, next, 500));
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) throwError('Could not found post.', 404);
    if (post.creator.toString() !== req.userId) throwError('Not authorize', 403);
    clearImage(post.imageUrl);
    await post.remove();
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit('posts', { actions: 'delete', post: postId });
    res.status(200).json({ message: 'Deleted post' });
  }
  catch (err) {
    sendError(err, next, 500);
  }
};
