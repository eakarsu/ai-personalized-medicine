const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Adverse Event Signals',
    disclaimer: 'Clinical decision support only. Not medical advice.',
    summary: { activeSignals: 5, seriousFlags: 1, medicationsReviewed: 12, reviewPriority: 'Pharmacist review' },
    signals: [
      { medication: 'Warfarin', signal: 'INR volatility after antibiotic start', severity: 'High', action: 'Review interaction and monitoring interval' },
      { medication: 'Simvastatin', signal: 'Myalgia note plus CYP3A4 inhibitor', severity: 'Medium', action: 'Assess alternative statin' },
      { medication: 'Metformin', signal: 'eGFR downward trend', severity: 'Medium', action: 'Recheck renal dosing threshold' },
    ],
    safeguards: [
      'Require clinician acknowledgement before medication plan changes.',
      'Link signal evidence to lab result, genotype, and medication timeline.',
      'Suppress duplicate alerts inside an active review window.',
    ],
  });
});

module.exports = router;
