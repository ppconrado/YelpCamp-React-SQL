const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Helper: Strong password validation
function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.';
  }
  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.';
  }
  return null;
}

async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;
    const validationError = validatePassword(password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(400).json({ error: 'Email ou usuário já cadastrado.' });
    }
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hash },
    });
    // Set user in session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao salvar sessão' });
      }
      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
      };
      res
        .status(201)
        .json({ user: userResponse, message: 'Bem Vindo ao Jose Paulo Camp!' });
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
  // Set user in session
  req.session.userId = user.id;
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao salvar sessão' });
    }
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
    res.json({
      user: userResponse,
      message: 'Bem vindo! Estamos felizes com seu retorno!',
    });
  });
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.clearCookie('yelpcamp.sid');
    res.json({ message: 'Até a próxima aventura!' });
  });
}

module.exports = {
  register,
  login,
  logout,
};
