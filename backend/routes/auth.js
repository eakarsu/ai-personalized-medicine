'use strict';

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const attempts = new Map();
function loginLimit(req, res, next) {
  const key = `${req.ip}|${String(req.body?.email || '').toLowerCase()}`;
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (recent.length >= 8) return res.status(429).json({ error: 'Too many login attempts' });
  recent.push(now);
  attempts.set(key, recent);
  next();
}

function authConfiguration() {
  const { JWT_SECRET: secret, JWT_ISSUER: issuer, JWT_AUDIENCE: audience } = process.env;
  if (!secret || secret.length < 32 || !issuer || !audience) return null;
  return { secret, issuer, audience };
}

router.post('/login', loginLimit, async (req, res, next) => {
  try {
    const config = authConfiguration();
    const tenantId = String(req.body?.tenantId || req.body?.tenant || req.body?.tenantSlug || process.env.TENANT_ID || process.env.GOVERNANCE_TENANT_ID || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!config) return res.status(503).json({ error: 'Authentication is not configured' });
    if (!tenantId || !email || !password) return res.status(400).json({ error: 'tenantId, email, and password are required' });
    const result = await pool.query('SELECT id,tenant_id,email,password_hash,role,subject_id FROM clinical_identities WHERE tenant_id=$1 AND lower(email)=$2 AND disabled_at IS NULL', [tenantId, email]);
    const identity = result.rows[0];
    if (!identity || !(await bcrypt.compare(password, identity.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
    const claims = { id: identity.id, email: identity.email, role: identity.role, tenantId: identity.tenant_id, subjectId: identity.subject_id || undefined };
    const token = jwt.sign(claims, config.secret, { algorithm: 'HS256', issuer: config.issuer, audience: config.audience, expiresIn: '30m', jwtid: crypto.randomUUID() });
    attempts.delete(`${req.ip}|${email}`);
    res.json({ token, user: claims });
  } catch (error) { next(error); }
});

router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id,tenant_id,email,role,subject_id FROM clinical_identities WHERE id=$1 AND tenant_id=$2 AND disabled_at IS NULL', [req.user.id, req.user.tenantId]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Identity is not active' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

module.exports = router;
