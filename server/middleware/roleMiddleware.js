/**
 * Role-based authorization middleware
 * Matches req.user.role against allowed roles case-insensitively
 * @param  {...string} roles Allowed roles ('Admin', 'Analyst', etc.)
 */
const authorize = (...roles) => {
  const allowedRoles = roles.flat().map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
