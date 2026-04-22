const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches decoded user info to req.user
 */
module.exports = function authenticateToken(req, res, next) {
  // Get token from Authorization header: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer token"

  // If no token, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    // Token valid - attach user info to request
    req.user = user;
    next();
  });
};
