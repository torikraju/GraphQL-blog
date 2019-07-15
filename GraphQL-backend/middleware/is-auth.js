const jwt = require('jsonwebtoken');

const { jwtSecretKey } = require('../util/string');
const { throwError } = require('../util/appUtil');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) throwError('No authentication header found', 401);

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, jwtSecretKey);
  }
  catch (e) {
    e.statusCode = 500;
    throw e;
  }
  if (!decodedToken) throwError('Not authenticated', 401);

  req.userId = decodedToken.userId;
  next();
};
