const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    const result = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows[0]) return res.status(401).json({ error: 'User not found.' });
    if (result.rows[0].is_active === false) return res.status(403).json({ error: 'Account deactivated.' });

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  }
  next();
};

module.exports = { authenticate, authorize };
