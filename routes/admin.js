const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin');

// POST /api/admin/backfill-timestamps
router.post('/backfill-timestamps', admin.backfillTimestamps);

module.exports = router;
