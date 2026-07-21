'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const pool = require('../db');

async function main() {
  if (process.env.NODE_ENV !== 'test' && process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('Refusing clinical identity provisioning without explicit acknowledgement');
  }
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const tenantId = String(process.env.TENANT_ID || process.env.GOVERNANCE_TENANT_ID || '').trim();
  if (!email || !email.includes('@') || password.length < 12 || !tenantId) {
    throw new Error('Explicit ADMIN_EMAIL, strong ADMIN_PASSWORD, and TENANT_ID are required');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO clinical_identities(id,tenant_id,email,password_hash,role)
     VALUES($1,$2,$3,$4,'clinician')
     ON CONFLICT (tenant_id,email) DO UPDATE SET
       password_hash=EXCLUDED.password_hash,role='clinician',disabled_at=NULL`,
    [`runtime-${crypto.randomUUID()}`, tenantId, email, passwordHash],
  );
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
