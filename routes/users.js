const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const users = require('../controllers/users');

// 1- ROUTE "/register" - POST - REGISTRAR USUARIO
router.route('/register').post(catchAsync(users.register));

// 2 - ROUTE "/login - POST  + PASSPORT" - AUTENTICAR USUARIO
router.route('/login').post((req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Autenticação falhou - retorna erro JSON
      return res.status(401).json({
        error: info?.message || 'Username ou password inválidos.',
      });
    }
    // Autenticação bem-sucedida - faz login
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return users.login(req, res);
    });
  })(req, res, next);
});

// 3 - ROUTE "/logout" - GET - SAIR
router.get('/logout', users.logout);

// 4 - ROUTE "/current-user" - GET - Retorna o usuário logado (para o React)
router.get('/current-user', (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ user: null });
  }
});

module.exports = router;
