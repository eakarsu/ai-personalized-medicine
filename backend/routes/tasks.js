'use strict';
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { filterRecords, buildFallbackInsights, insightKinds } = require('../featurePack');
function parsePriority(v) { return v === 'LOW' || v === 'HIGH' ? v : 'NORMAL'; }
function parseStatus(v) { return v === 'OPEN' || v === 'DONE' || v === 'CANCELLED' ? v : null; }
function createTasksRouter(db = pool) {
  const router = express.Router();
  router.use(auth);
  router.get('/', async (req, res) => {
    try {
      const status = parseStatus(String(req.query.status || ''));
      const r = status ? await db.query('SELECT * FROM staff_tasks WHERE status=$1 ORDER BY due_at ASC NULLS LAST, created_at DESC LIMIT 200', [status]) : await db.query('SELECT * FROM staff_tasks ORDER BY status ASC, due_at ASC NULLS LAST, created_at DESC LIMIT 200');
      res.json({ tasks: filterRecords(r.rows, { q: req.query.q, priority: req.query.priority }) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  router.post('/', async (req, res) => {
    try {
      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      if (!title) return res.status(422).json({ error: 'title is required' });
      const dueAt = typeof req.body?.dueAt === 'string' && !Number.isNaN(Date.parse(req.body.dueAt)) ? new Date(req.body.dueAt) : null;
      const r = await db.query('INSERT INTO staff_tasks(title,description,priority,due_at,created_by,assignee_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [title.slice(0, 200), typeof req.body?.description === 'string' ? req.body.description.slice(0, 2000) : null, parsePriority(req.body?.priority), dueAt, String(req.user.id), req.body?.assigneeId != null ? String(req.body.assigneeId) : null]);
      res.status(201).json({ task: r.rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  router.patch('/:id', async (req, res) => {
    try {
      const status = req.body?.status === undefined ? undefined : parseStatus(String(req.body.status));
      if (req.body?.status !== undefined && !status) return res.status(422).json({ error: 'status must be OPEN, DONE, or CANCELLED' });
      const existing = await db.query('SELECT * FROM staff_tasks WHERE id=$1', [req.params.id]);
      if (!existing.rows[0]) return res.status(404).json({ error: 'Task not found' });
      const completedAt = status === 'DONE' ? new Date() : status ? null : existing.rows[0].completed_at;
      const r = await db.query('UPDATE staff_tasks SET status=$1, completed_at=$2, assignee_id=$3, updated_at=NOW() WHERE id=$4 RETURNING *', [status ?? existing.rows[0].status, completedAt, req.body?.assigneeId === undefined ? existing.rows[0].assignee_id : req.body.assigneeId, req.params.id]);
      res.json({ task: r.rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  return router;
}
function createInsightsRouter(db = pool) {
  const router = express.Router();
  router.use(auth);
  router.get('/kinds', (_req, res) => res.json({ kinds: insightKinds(), aiGenerated: false }));
  router.post('/insights', async (req, res) => {
    const kind = String(req.body?.kind || 'record-completeness');
    if (!insightKinds().some((k) => k.id === kind)) return res.status(422).json({ error: 'unknown insight kind', kinds: insightKinds() });
    let records = Array.isArray(req.body?.records) ? req.body.records : null;
    if (!records) {
      try { records = (await db.query('SELECT * FROM patients ORDER BY created_at DESC LIMIT 500')).rows; } catch { records = []; }
    }
    res.json({ result: buildFallbackInsights(records, { kind }) });
  });
  return router;
}
module.exports = { createTasksRouter, createInsightsRouter, parsePriority, parseStatus, tasksRouter: createTasksRouter(), insightsRouter: createInsightsRouter() };
