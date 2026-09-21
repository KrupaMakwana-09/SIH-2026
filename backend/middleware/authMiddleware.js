const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const JWT_SECRET = process.env.JWT_SECRET || 'gramin_arogya_secure_sih_2026_jwt_token_key';

// 1. Authenticate JWT Middleware
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      // Check if x-user-id header is provided (internal fallback)
      const internalUserId = req.headers['x-user-id'];
      if (internalUserId) {
        const foundUser = await User.findById(internalUserId).select('-password');
        if (foundUser) {
          req.user = {
            id: foundUser._id.toString(),
            _id: foundUser._id,
            username: foundUser.username,
            name: foundUser.name,
            role: foundUser.role,
            phone: foundUser.phone,
            facilityId: foundUser.facilityId,
            facilityName: foundUser.facilityName
          };
          return next();
        }
      }
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (tokenErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }
  } catch (error) {
    console.error('authenticateJWT error:', error);
    return res.status(500).json({ success: false, message: 'Internal authentication error.' });
  }
};

// 2. Authorize Role Middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    // Admin always has oversight access
    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. Role "${req.user.role}" is not authorized for this operation.`
    });
  };
};

// 3. Safe Audit Logging Helper
const logAudit = async ({ action, req, patientId = '', resource = '', details = {}, status = 'SUCCESS' }) => {
  try {
    const userId = req?.user?.id || req?.user?._id || 'anonymous';
    const userName = req?.user?.name || req?.user?.username || 'System User';
    const userRole = req?.user?.role || 'unspecified';
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    await AuditLog.create({
      action,
      userId: String(userId),
      userName,
      userRole,
      patientId: String(patientId),
      resource,
      details,
      status,
      ip: String(ip),
      timestamp: new Date()
    });
  } catch (err) {
    console.warn('Audit log write note:', err.message);
  }
};

module.exports = {
  authenticateJWT,
  authorizeRole,
  logAudit,
  JWT_SECRET
};
