'use strict';

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authorization = req.headers.authorization;
  const secret = process.env.JWT_SECRET;
  const issuer = process.env.JWT_ISSUER;
  const audience = process.env.JWT_AUDIENCE;
  if (!secret || secret.length < 32 || !issuer || !audience) return res.status(503).json({ error: 'Authentication is not configured' });
  if (!authorization?.startsWith('Bearer ')) return res.status(401).json({ error: 'Bearer token required' });
  try {
    const user = jwt.verify(authorization.slice(7), secret, { algorithms: ['HS256'], issuer, audience, clockTolerance: 5 });
    if (!user.id || !user.role || !user.tenantId || !user.jti) throw new Error('missing required claims');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
