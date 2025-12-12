// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['DB_URL', 'SECRET'];

function validateEnv() {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(
      '❌ ERRO: Variáveis de ambiente obrigatórias não configuradas:'
    );
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error(
      '\nCrie um arquivo .env na raiz do projeto com essas variáveis.'
    );
    process.exit(1);
  }

  // Avisos para variáveis opcionais mas recomendadas
  // Preferir SRV (mongodb+srv) para conexões Atlas para evitar avisos/erros futuros do Node
  if (process.env.DB_URL && process.env.DB_URL.startsWith('mongodb://')) {
    console.warn(
      '⚠️  AVISO: Sua DB_URL usa o esquema mongodb://. Para MongoDB Atlas, prefira mongodb+srv:// (copie em Atlas > Connect > Drivers).\n' +
        '   Exemplo: mongodb+srv://USUARIO:SENHA@SEU-CLUSTER.mongodb.net/NOME_DB?retryWrites=true&w=majority'
    );
  }

  if (!process.env.MAPBOX_TOKEN) {
    console.warn(
      '⚠️  AVISO: MAPBOX_TOKEN não configurado. A geocodificação não funcionará.'
    );
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_KEY ||
    !process.env.CLOUDINARY_SECRET
  ) {
    console.warn(
      '⚠️  AVISO: Credenciais do Cloudinary não configuradas. Upload de imagens não funcionará.'
    );
  }

  console.log('✅ Variáveis de ambiente validadas com sucesso');
}

module.exports = { validateEnv };
