const prisma = require('../lib/prisma');

// Admin endpoint to backfill timestamps for records that are missing them
// This is primarily for data migration purposes
async function backfillTimestamps(req, res) {
  const adminToken = process.env.ADMIN_BACKFILL_TOKEN;
  const provided = req.headers['x-admin-token'] || req.query.token;

  if (!adminToken) {
    return res
      .status(503)
      .json({ error: 'ADMIN_BACKFILL_TOKEN not configured on server' });
  }
  if (provided !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = String(req.query.dryRun || 'false').toLowerCase() === 'true';

  // In PostgreSQL with Prisma, createdAt and updatedAt are managed by the schema
  // with @default(now()) and @updatedAt, so they should always exist.
  // This endpoint is kept for compatibility but may not be needed.

  if (dryRun) {
    const campgroundsCount = await prisma.campground.count();
    const reviewsCount = await prisma.review.count();
    return res.json({
      dryRun: true,
      message: 'PostgreSQL with Prisma automatically manages timestamps',
      counts: {
        totalCampgrounds: campgroundsCount,
        totalReviews: reviewsCount,
      },
    });
  }

  return res.json({
    ok: true,
    message:
      'No backfill needed - PostgreSQL with Prisma automatically manages timestamps',
    campgrounds: { matched: 0, modified: 0 },
    reviews: { matched: 0, modified: 0 },
  });
}

module.exports = {
  backfillTimestamps,
};
