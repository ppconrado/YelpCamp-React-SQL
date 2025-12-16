const express = require('express');
const router = express.Router({ mergeParams: true });
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
const reviews = require('../controllers/reviews.prisma');
const catchAsync = require('../utils/catchAsync');

// Criar review para um campground
router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));

// Deletar review de um campground
router.delete(
  '/:reviewId',
  isLoggedIn,
  isReviewAuthor,
  catchAsync(reviews.deleteReview)
);

module.exports = router;
