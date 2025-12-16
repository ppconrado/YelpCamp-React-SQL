if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Validar variáveis de ambiente antes de iniciar
const { validateEnv } = require('./utils/validateEnv');
validateEnv();

// VARIAVEIS DE INICIALIZACAO
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const path = require('path');
const fs = require('fs');
const { version, name } = require('./package.json');
// const mongoose = require('mongoose'); // REMOVIDO: Usando Prisma com PostgreSQL
// const ejsMate = require("ejs-mate"); // REMOVIDO: Não usaremos mais EJS
const session = require('express-session');
const flash = require('connect-flash'); // banner de mensagens
const ExpressError = require('./utils/ExpressError');

const methodOverride = require('method-override');
// USER AUTHENTICATION
const passport = require('passport');
const LocalStrategy = require('passport-local'); // username e password - auth
// const User = require('./models/user'); // REMOVIDO: Usando Prisma com PostgreSQL
//
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
// EXPRESS ROUTES
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

// CONEXAO PARA SALVAR UMA EXPRESS SESSION NO MongoDB (MERN)
// const MongoDBStore = require('connect-mongo')(session); // REMOVIDO: Usando PostgreSQL

// BANCO DE DADOS (dev e prod)
// const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'; // REMOVIDO: Usando PostgreSQL

// CONECTANDO MONGOOSE
// mongoose.connect(dbUrl); // REMOVIDO: Usando Prisma com PostgreSQL

// logica de confirmacao da conexao com o DB.
// const db = mongoose.connection; // REMOVIDO: Usando Prisma com PostgreSQL
// db.on('error', console.error.bind(console, 'erro de conexao:'));
// db.once('open', () => {
//   console.log('Banco de Dados conectado');
// });

// EXPRESS
const app = express();

// Trust proxy - necessary for secure cookies behind Render proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// REQUEST LOGGING
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Formato detalhado para produção
} else {
  app.use(morgan('dev')); // Formato colorido para desenvolvimento
}

// RATE LIMITING - Protege contra abuso de API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // apenas 5 tentativas de login/registro por 15min
  message: {
    error: 'Muitas tentativas de autenticação, tente novamente em 15 minutos.',
  },
  skipSuccessfulRequests: true, // não conta requisições bem-sucedidas
});

// CONFIGURAÇÃO DO REACT E CORS
const allowedOrigins = [
  'http://localhost:5173', // Dev local
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:5181',
  'http://localhost:5182',
  'http://localhost:5183',
  'http://localhost:5184',
  'http://localhost:5185', // Vite pode usar qualquer porta disponível
  process.env.FRONTEND_URL, // Produção (Vercel)
].filter(Boolean); // Remove undefined se FRONTEND_URL não estiver definida

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem origin (como Postman) ou de origens permitidas
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Permite o envio de cookies (sessão)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  })
);
// Aceita JSON do frontend (login/registro e APIs REST)
app.use(express.json());
// MIDDLEWARE // express parse the body da requisicao - POST form application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
// SERVE ARQUIVOS ESTÁTICOS DO BACKEND (public)
app.use(express.static(path.join(__dirname, 'public')));
// MONGO SANITIZE
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);
// COOKIE dev e prod
const secret =
  process.env.SECRET || 'Cuidado com a exposicao da senha de acesso!';
// MONGODB EXPRESS SESSION
// const store = new MongoDBStore({ // REMOVIDO: Usando PostgreSQL
//   url: dbUrl,
//   secret, // cookie
//   touchAfter: 24 * 60 * 60, // lazy store
// });

// MONGO EXPRESS SESSION - CONFIGURACAO
// store.on('error', function (e) {
//   console.log('ERRO NO ARMAZENAMENTO DA SESSION no DB', e);
// });

const sessionConfig = {
  // store, // REMOVIDO: Usando sessão em memória temporariamente
  name: 'yelpcamp.sid', // Nome mais específico para o cookie
  secret,
  resave: false,
  saveUninitialized: true, // Precisa ser true para criar sessão no login
  proxy: process.env.NODE_ENV === 'production', // Trust proxy in production (Render)
  // cookie
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS em produção
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-site em produção
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/', // Garantir que o cookie está disponível em todas as rotas
  },
};
// EXPRESS SESSION
app.use(session(sessionConfig));
// FLASH MESSAGES - AVISOS
app.use(flash());

// Middleware to load user from session (replaces Passport deserialization)
app.use(async (req, res, next) => {
  console.log('Session middleware - sessionID:', req.sessionID);
  console.log('Session middleware - userId:', req.session.userId);
  if (req.session.userId) {
    try {
      const { PrismaClient } = require('./generated/prisma');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { id: true, username: true, email: true },
      });
      if (user) {
        req.user = user;
        console.log('User loaded from session:', user.username);
      }
    } catch (err) {
      console.error('Error loading user from session:', err);
    }
  }
  next();
});

// HELMET - protege ao acesso de dados das requisicoes
app.use(helmet());

// MAPA MAPBOX URLs - tilesset
const scriptSrcUrls = [
  'https://stackpath.bootstrapcdn.com',
  'https://api.tiles.mapbox.com',
  'https://api.mapbox.com',
  'https://kit.fontawesome.com',
  'https://cdnjs.cloudflare.com',
  'https://cdn.jsdelivr.net',
];
const styleSrcUrls = [
  'https://kit-free.fontawesome.com',
  'https://stackpath.bootstrapcdn.com',
  'https://api.mapbox.com',
  'https://api.tiles.mapbox.com',
  'https://fonts.googleapis.com',
  'https://use.fontawesome.com',
];
const connectSrcUrls = [
  'https://api.mapbox.com',
  'https://*.tiles.mapbox.com',
  'https://events.mapbox.com',
];

// HELMET configuration - protege ao acesso de dados das requisicoes
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ['blob:'],
      objectSrc: [],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        'https://res.cloudinary.com/ppconrado/', // CONTA do CLOUDINARY!
        'https://images.unsplash.com',
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

// PASSPORT CONFIGURATION - Autenticacao do usuario
app.use(passport.initialize());
app.use(passport.session()); // express session
// passport.use(new LocalStrategy(User.authenticate())); // REMOVIDO: Mongoose local strategy - implementar com Prisma
// passport.serializeUser(User.serializeUser()); // REMOVIDO: mongoose - storage a session
// passport.deserializeUser(User.deserializeUser()); // REMOVIDO: mongoose - unstorage session

// FLASH Message Service ->  partials/flash.ejs - AVISOS
app.use((req, res, next) => {
  // Variaveis locais
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// ROTAS DE API
app.use('/api', apiLimiter); // Rate limit geral para todas as rotas de API
app.use('/api/login', authLimiter); // Rate limit específico para login
app.use('/api/register', authLimiter); // Rate limit específico para registro
app.use('/api', userRoutes);
app.use('/api/campgrounds', campgroundRoutes);
app.use('/api/campgrounds/:id/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Healthcheck & Version endpoints (úteis para Render, monitoramento e debugging)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});
app.head('/health', (req, res) => {
  res.status(200).end();
});
app.get('/version', (req, res) => {
  res.json({ name, version, node: process.version, env: process.env.NODE_ENV });
});

// ROTA DE FALLBACK PARA SERVIR O FRONTEND
// Em produção local/monorepo servimos o build do React (client/dist) SE existir.
// No Render (backend-only), o client/dist não existe; então respondemos com uma mensagem da API.
const clientBuildPath = path.join(__dirname, 'client', 'dist');
const clientIndexPath = path.join(clientBuildPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);

if (process.env.NODE_ENV === 'production' && hasClientBuild) {
  app.use(express.static(clientBuildPath));
  // Só serve o frontend para rotas que NÃO começam com /api
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(clientIndexPath);
  });
} else {
  // Backend-only (ex.: Render Free) ou ambiente de desenvolvimento
  app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'YelpCamp API running' });
  });
}

// Rota 404 para APIs não encontradas (só captura /api/*)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Rota 404 geral (para outras rotas não-API)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found', hint: 'Use /api endpoints' });
});

// TRATAMENTO DE ERROS CENTRALIZADO
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  const message = err.message || 'Oh No, Alguma coisa deu errado!';

  // Log detalhado em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error Stack:', err.stack);
  }

  // Resposta JSON padronizada
  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// SERVER API dev e prod - port config
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Serviço disponível na PORTA ${port}`);
});

// GRACEFUL SHUTDOWN - Encerramento adequado do servidor
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('\n🔄 Recebido sinal de encerramento. Encerrando gracefully...');

  server.close(() => {
    console.log('✅ Servidor HTTP encerrado');

    mongoose.connection.close(false, () => {
      console.log('✅ Conexão MongoDB encerrada');
      process.exit(0);
    });
  });

  // Força o encerramento após 10 segundos se não conseguir fechar gracefully
  setTimeout(() => {
    console.error(
      '❌ Não foi possível encerrar gracefully, forçando encerramento...'
    );
    process.exit(1);
  }, 10000);
}
