const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Create a new review
async function createReview(req, res) {
  const { id } = req.params;
  const campground = await prisma.campground.findUnique({
    where: { id: Number(id) },
  });
  if (!campground) {
    return res
      .status(404)
      .json({ error: 'Não foi possível encontrar este acampamento!' });
  }
  const review = await prisma.review.create({
    data: {
      ...req.body.review,
      campgroundId: Number(id),
      authorId: req.user.id,
    },
    include: {
      author: { select: { id: true, username: true } },
    },
  });
  res.status(201).json({
    review,
    message: 'Review adicionada com sucesso!',
  });
}

// Delete a review
async function deleteReview(req, res) {
  const { id, reviewId } = req.params;
  const campground = await prisma.campground.findUnique({
    where: { id: Number(id) },
  });
  if (!campground) {
    return res
      .status(404)
      .json({ error: 'Não foi possível encontrar este acampamento!' });
  }
  await prisma.review.delete({
    where: { id: Number(reviewId) },
  });
  res.json({ message: 'Review removida com sucesso!' });
}

module.exports = {
  createReview,
  deleteReview,
};
