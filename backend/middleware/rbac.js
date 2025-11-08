const pool = require('../config/database');

// Check if user has specific permission
async function hasPermission(userId, requiredPermission) {
  try {
    const connection = await pool.getConnection();
    const [permissions] = await connection.query(
      'SELECT permission FROM librarian_permissions WHERE user_id = ?',
      [userId]
    );
    connection.release();
    
    return permissions.some(p => p.permission === requiredPermission);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// Middleware to check for specific permission
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if librarian has required permission
      if (req.user.role === 'librarian') {
        const hasAccess = await hasPermission(req.user.id, permission);
        if (hasAccess) {
          return next();
        }
      }

      return res.status(403).json({ 
        error: 'Access denied. Required permission: ' + permission 
      });
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// Middleware to require admin or librarian role
function requireStaff(req, res, next) {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    return next();
  }
  return res.status(403).json({ error: 'Staff access required' });
}

// Middleware to check if user is member
function requireMember(req, res, next) {
  if (req.user.role === 'member') {
    return next();
  }
  return res.status(403).json({ error: 'Member access only' });
}

module.exports = {
  requirePermission,
  requireStaff,
  requireMember,
  hasPermission
};