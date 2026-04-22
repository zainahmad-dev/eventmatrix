/**
 * Authorization Middleware Factories
 * Creates middleware for role-based access control
 */

/**
 * Create middleware that checks if user has required role
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'employee', 'customer')
 * @returns {Function} Express middleware
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    // req.user should already be set by authenticateToken middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Check if user is an admin
 */
function authorizeAdmin(req, res, next) {
  return authorizeRole('admin')(req, res, next);
}

/**
 * Check if user is admin or employee
 */
function authorizeStaff(req, res, next) {
  return authorizeRole('admin', 'employee')(req, res, next);
}

/**
 * Check if user owns the resource (by comparing user ID)
 * @param {string} resourceOwnerId - The ID of the resource owner
 */
function authorizeOwner(resourceOwnerId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Non-admin can only access their own resources
    if (req.user.id !== resourceOwnerId) {
      return res.status(403).json({ error: 'You can only access your own resources.' });
    }

    next();
  };
}

module.exports = {
  authorizeRole,
  authorizeAdmin,
  authorizeStaff,
  authorizeOwner,
};
