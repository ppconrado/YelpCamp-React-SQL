const express = require('express');
const router = express.Router();
const users = require('../controllers/users.prisma');

// 1- ROUTE "/register" - POST - REGISTRAR USUARIO
router.route('/register').post(users.register);

// 2 - ROUTE "/login" - POST - AUTENTICAR USUARIO
router.route('/login').post(users.login);

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
