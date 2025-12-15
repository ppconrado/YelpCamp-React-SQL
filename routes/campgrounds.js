const express = require('express');
const router = express.Router(); // criacao do Router objetp
const campgrounds = require('../controllers/campgrounds.prisma.js');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const Campground = require('../models/campground');

// 1 - ROUTE ROOT "/campgrounds/" - GET listagem e POST criar acampamento
router
  .route('/')
  .get(catchAsync(campgrounds.index))
  .post(
    isLoggedIn,
    upload.array('image'),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

// Rota de criação de acampamento será tratada pelo POST em "/"
// router.get("/new", isLoggedIn, campgrounds.renderNewForm);

// 3 - ROUTE "/campgrounds/:id"  - GET, PUT e DELETE
router
  .route('/:id')
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array('image'),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

// Rota de edição de acampamento será tratada pelo PUT em "/:id"
// router.get(
//   "/:id/edit",
//   isLoggedIn,
//   isAuthor,
//   catchAsync(campgrounds.renderEditForm)
// );

module.exports = router;
