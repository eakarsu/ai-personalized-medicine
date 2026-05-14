const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const DISCLAIMER = 'Not medical advice — consult a clinician.';

// GET /api/dashboard/stats — aggregated KPIs and recent activity for the dashboard.
// JWT-protected. Read-only. Resilient to missing tables (returns 0 / [] instead of 500).
router.get('/stats', auth, async (_req, res) => {
  const safeCount = async (sql, params = []) => {
    try {
      const r = await pool.query(sql, params);
      return parseInt(r.rows[0]?.count || 0, 10) || 0;
    } catch (_) { return 0; }
  };
  const safeRows = async (sql, params = []) => {
    try {
      const r = await pool.query(sql, params);
      return r.rows;
    } catch (_) { return []; }
  };

  try {
    const [
      patients,
      activeMedications,
      labResultsThisWeek,
      pendingRecommendations,
      genomeMarkers,
      recentActivity,
    ] = await Promise.all([
      safeCount("SELECT COUNT(*)::int AS count FROM patients"),
      safeCount("SELECT COUNT(*)::int AS count FROM medications WHERE status = 'active'"),
      safeCount("SELECT COUNT(*)::int AS count FROM lab_results WHERE test_date >= NOW() - INTERVAL '7 days'"),
      safeCount("SELECT COUNT(*)::int AS count FROM treatment_recommendations WHERE status IN ('active','pending')"),
      safeCount("SELECT COUNT(*)::int AS count FROM genome_markers"),
      safeRows("SELECT id, user_email, action, target, meta, created_at FROM audit_log ORDER BY id DESC LIMIT 10"),
    ]);

    res.json({
      kpis: {
        patients,
        active_medications: activeMedications,
        lab_results_this_week: labResultsThisWeek,
        pending_recommendations: pendingRecommendations,
        genome_markers: genomeMarkers,
      },
      recent_activity: recentActivity,
      synthetic_notice: 'Synthetic data only — for demo use.',
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
