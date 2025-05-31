const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');
  console.log('Auth middleware - Token received:', token);

  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded:', decoded);

    // Handle different token payload structures
    if (decoded.user) {
      req.user = decoded.user; // e.g., { id: "681334b70d98263348c3f4fe" }
    } else if (decoded.id) {
      req.user = { id: decoded.id }; // e.g., { id: "681334b70d98263348c3f4fe" }
    } else {
      console.log('Auth middleware - Invalid token payload:', decoded);
      throw new Error('Invalid token payload');
    }

    console.log('Auth middleware - User set:', req.user);
    console.log('Token verified for user:', req.user.id);
    next();
  } catch (err) {
    console.error('Auth middleware - Token verification error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};