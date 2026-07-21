'use strict';

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_SIZE || 10), connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 15000 });
pool.on('error', (error) => console.error('Unexpected database pool error', error.message));
module.exports = pool;
