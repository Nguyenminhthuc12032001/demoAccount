const jwt = require('jsonwebtoken');

const authToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No access token provided' });
  }

  if (!token.startsWith('Bearer ')) {
    return res.status(403).send('Access denied. Invalid token format.');
  }

  const actualToken = token.split(' ')[1];

  try {
    const verified = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).send('Invalid token');
  }
};

module.exports = authToken;
