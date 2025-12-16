const { campgroundSchema, reviewSchema } = require('./schemas.js'); // joi
const ExpressError = require('./utils/ExpressError');
// Mongoose models removed - using Prisma with PostgreSQL

// MIDDLEWARE - AUTENTICACAO DO USUARIO
module.exports.isLoggedIn = (req, res, next) => {
  // Check if user is in session
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Você precisa estar logado!' });
  }
  next();
};

// MIDDLEWARE - VALIDACAO DOS DADOS DE ENTRADA DO ACAMPAMENTO (Ferramenta Joi)
module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  console.log(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    // Retorna JSON em vez de lançar erro
    return res.status(400).json({ error: msg });
  } else {
    next();
  }
};

// MIDDLEWARE - PERMISSAO PARA O AUTOR DO ACAMPAMNETO EDITAR
module.exports.isAuthor = async (req, res, next) => {
  const { PrismaClient } = require('./generated/prisma');
  const prisma = new PrismaClient();
  const { id } = req.params;
  const campground = await prisma.campground.findUnique({
    where: { id: Number(id) },
    select: { authorId: true },
  });
  if (!campground || campground.authorId !== req.user.id) {
    return res
      .status(403)
      .json({ error: 'Você não tem permissão para fazer isto!' });
  }
  next();
};

// MIDDLEWARE - PERMISSAO PARA O AUTOR DAS AVALIACOES EDITAR
module.exports.isReviewAuthor = async (req, res, next) => {
  const { PrismaClient } = require('./generated/prisma');
  const prisma = new PrismaClient();
  const { id, reviewId } = req.params;
  const review = await prisma.review.findUnique({
    where: { id: Number(reviewId) },
    select: { authorId: true },
  });
  if (!review || review.authorId !== req.user.id) {
    return res
      .status(403)
      .json({ error: 'Você não tem permissão para fazer isto!' });
  }
  next();
};

// MIDDLEWARE - VALIDACAO DOS DADOS DE ENTRADA DAS AVALIACOES (Ferramenta Joi)
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    // Retorna JSON em vez de lançar erro
    return res.status(400).json({ error: msg });
  } else {
    next();
  }
};
