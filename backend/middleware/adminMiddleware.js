/**
 * Middleware to restrict route access to Admin users only.
 * Must be used AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = adminMiddleware;
