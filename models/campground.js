const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
// IMAGES MODEL SCHEMA
const ImageSchema = new Schema({
  url: String,
  filename: String,
});
// IMAGES URLs MODEL SCHEMA
ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

// CAMPGROUND MODEL SCHEMA
const CampgroundSchema = new Schema(
  {
    title: String,
    images: [ImageSchema],
    // GeoJSON - MONGOOSE
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    //
    price: Number,
    description: String,
    location: String,
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  { ...opts, timestamps: true }
);
// POPUP CLUSTER MAP MODEL SCHEMA - mongoose
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
    <p>${this.description.substring(0, 20)}...</p>`;
});
// DELETE CAMPGROUND REVIEW SCHEMA MODEL - mongoose
CampgroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews,
      },
    });
  }
});

// INDEXES para melhor performance nas queries
CampgroundSchema.index({ author: 1 }); // buscar campgrounds por autor
CampgroundSchema.index({ 'geometry.coordinates': '2dsphere' }); // queries geoespaciais
CampgroundSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
}); // busca textual

module.exports = mongoose.model('Campground', CampgroundSchema);
