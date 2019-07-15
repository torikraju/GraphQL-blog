const fs = require('fs');
const path = require('path');

const uuid = require('uuid');
const jwt = require('jsonwebtoken');

const { jwtSecretKey, jwtTokenExpiresIn } = require('./string');


exports.throwError = (message, statusCode, data) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (data) error.data = data.array();
  throw error;
};

exports.sendError = (err, next, statusCode) => {
  if (!err.statusCode) err.statusCode = statusCode;
  next(err);
};

exports.getFileExtension = file => {
  const extArray = file.mimetype.split('/');
  return extArray[extArray.length - 1];
};

exports.getUUID = () => uuid.v1()
  .toString()
  .split('-')
  .join('');

exports.clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

exports.createToken = loadedUser => jwt.sign({
  email: loadedUser.email,
  userId: loadedUser._id.toString()
}, jwtSecretKey, { expiresIn: jwtTokenExpiresIn });
