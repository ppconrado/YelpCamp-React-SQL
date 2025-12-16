const { campgroundSchema, reviewSchema } = require('./schemas.js'); // joi
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');

// MIDDLEWARE - AUTENTICACAO DO USUARIO
module.exports.isLoggedIn = (req, res, next) => {
  console.log('isLoggedIn check - sessionID:', req.sessionID);
  console.log('isLoggedIn check - userId:', req.session.userId);
  console.log('isLoggedIn check - user:', req.user);
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
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground.author.equals(req.user._id)) {
    // Retorna JSON em vez de redirecionar
    return res
      .status(403)
      .json({ error: 'Você não tem permissão para fazer isto!' });
  }
  next();
};

// MIDDLEWARE - PERMISSAO PARA O AUTOR DAS AVALIACOES EDITAR
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    // Retorna JSON em vez de redirecionar
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
