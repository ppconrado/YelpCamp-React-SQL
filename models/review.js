const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// REVIEW MODEL SCHEMA
const reviewSchema = new Schema(
  {
    body: String,
    rating: Number,
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// INDEX para melhor performance ao buscar reviews por autor
reviewSchema.index({ author: 1 });

module.exports = mongoose.model('Review', reviewSchema);
