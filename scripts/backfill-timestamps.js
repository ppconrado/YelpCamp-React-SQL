/*
  Backfill createdAt/updatedAt for Campground and Review documents that predate
  enabling Mongoose timestamps. Uses ObjectId.getTimestamp() as an approximate
  creation time. Safe and idempotent: only updates docs missing createdAt/updatedAt.
*/
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const mongoose = require('mongoose');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

// Models
const Campground = require('../models/campground');
const Review = require('../models/review');

async function backfillModel(Model, label) {
  // Find documents missing createdAt
  const missingCreated = await Model.find(
    { createdAt: { $exists: false } },
    {
      _id: 1,
    }
  ).lean();

  // Find documents missing updatedAt
  const missingUpdated = await Model.find(
    { updatedAt: { $exists: false } },
    {
      _id: 1,
    }
  ).lean();

  const createdOps = missingCreated.map((doc) => {
    const created = new mongoose.Types.ObjectId(doc._id).getTimestamp();
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { createdAt: created, updatedAt: created } },
      },
    };
  });

  const updatedOnlyOps = missingUpdated
    .filter(
      (doc) => !missingCreated.find((d) => String(d._id) === String(doc._id))
    )
    .map((doc) => {
      const created = new mongoose.Types.ObjectId(doc._id).getTimestamp();
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { updatedAt: created } },
        },
      };
    });

  const ops = [...createdOps, ...updatedOnlyOps];
  if (ops.length === 0) {
    console.log(`[${label}] Nothing to backfill.`);
    return { modified: 0 };
  }

  const res = await Model.bulkWrite(ops, { ordered: false });
  const modified = res.nModified || res.modifiedCount || 0;
  console.log(`[${label}] Backfilled documents: ${modified}`);
  return { modified };
}

async function main() {
  const safeUrl = dbUrl
    ? dbUrl.startsWith('mongodb+srv://')
      ? 'mongodb+srv://<hidden>@<cluster>/<db>'
      : 'mongodb://<hidden>@<host>/<db>'
    : 'N/A';
  console.log('Connecting to MongoDB:', safeUrl);
  await mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  try {
    const cg = await backfillModel(Campground, 'Campground');
    const rv = await backfillModel(Review, 'Review');
    console.log('Done. Summary:', {
      campgrounds: cg.modified,
      reviews: rv.modified,
    });
  } catch (err) {
    console.error('Backfill error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
