const Campground = require('../models/campground');
const Review = require('../models/review');

// Criar uma nova review
module.exports.createReview = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    return res
      .status(404)
      .json({ error: 'Não foi possível encontrar este acampamento!' });
  }
  const review = new Review(req.body.review);
  review.author = req.user._id;
  await review.save();
  campground.reviews.push(review);
  await campground.save();
  // Populate author so the client can render username without a full page refresh
  const populatedReview = await Review.findById(review._id).populate({
    path: 'author',
    select: 'username',
  });
  res.status(201).json({
    review: populatedReview,
    message: 'Review adicionada com sucesso!',
  });
};

// Remover uma review
module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    return res
      .status(404)
      .json({ error: 'Não foi possível encontrar este acampamento!' });
  }
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  res.json({ message: 'Review removida com sucesso!' });
};
