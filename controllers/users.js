const User = require('../models/user');
// Não é mais necessário, o formulário será renderizado pelo React
// module.exports.renderRegister = (req, res) => {
//   res.render("users/register");
// };
// CONTROLLER - CRIAR USUARIO
module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Validação de senha mais forte
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        error:
          'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.',
      });
    }

    const user = new User({ email, username });
    const registeredUser = await User.register(user, password); // salt/hash
    req.login(registeredUser, (err) => {
      if (err) return next(err);

      // Força o salvamento da sessão
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);

        // Em vez de redirecionar, retorna o usuário e a mensagem flash
        res.status(201).json({
          user: registeredUser,
          message: 'Bem Vindo ao Jose Paulo Camp!',
        });
      });
    });
  } catch (e) {
    // Retorna 400 e a mensagem de erro
    res.status(400).json({ error: e.message });
  }
};
// Não é mais necessário, o formulário será renderizado pelo React
// module.exports.renderLogin = (req, res) => {
//   res.render("users/login");
// };
// CONTROLLER - VIEW DE SUCESSO NA AUTORIZACAO DE ACESSO DO USUARIO
module.exports.login = (req, res) => {
  // Força o salvamento da sessão
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao salvar sessão' });
    }

    // Retorna o usuário logado e a mensagem flash
    res.json({
      user: req.user,
      message: 'Bem vindo! Estamos felizes com seu retorno!',
    });
  });
};
// CONTROLLER - VIEW DE SAIDA DO USUARIO DO APLICATIVO
module.exports.logout = (req, res) => {
  req.logout();
  // req.session.destroy();
  // Retorna sucesso e a mensagem flash
  res.json({ message: 'Até a próxima aventura!' });
};
