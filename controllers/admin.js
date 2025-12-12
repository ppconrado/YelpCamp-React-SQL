const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');

function getObjectIdTimestamp(id) {
  return new mongoose.Types.ObjectId(id).getTimestamp();
}

async function backfillModel(Model) {
  const missingCreated = await Model.find(
    { createdAt: { $exists: false } },
    { _id: 1 }
  ).lean();
  const missingUpdated = await Model.find(
    { updatedAt: { $exists: false } },
    { _id: 1 }
  ).lean();

  const createdOps = missingCreated.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          createdAt: getObjectIdTimestamp(doc._id),
          updatedAt: getObjectIdTimestamp(doc._id),
        },
      },
    },
  }));

  const updatedOnlyOps = missingUpdated
    .filter(
      (doc) => !missingCreated.find((d) => String(d._id) === String(doc._id))
    )
    .map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { updatedAt: getObjectIdTimestamp(doc._id) } },
      },
    }));

  const ops = [...createdOps, ...updatedOnlyOps];
  if (!ops.length) return { matched: 0, modified: 0 };

  const res = await Model.bulkWrite(ops, { ordered: false });
  return {
    matched: res.nMatched || res.matchedCount || 0,
    modified: res.nModified || res.modifiedCount || 0,
  };
}

module.exports.backfillTimestamps = async (req, res) => {
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

  // Preview counts if dryRun
  if (dryRun) {
    const cgMissing = await Campground.countDocuments({
      createdAt: { $exists: false },
    });
    const rvMissing = await Review.countDocuments({
      createdAt: { $exists: false },
    });
    return res.json({
      dryRun: true,
      counts: { campgroundsMissing: cgMissing, reviewsMissing: rvMissing },
    });
  }

  const cg = await backfillModel(Campground);
  const rv = await backfillModel(Review);

  return res.json({
    ok: true,
    campgrounds: cg,
    reviews: rv,
  });
};
