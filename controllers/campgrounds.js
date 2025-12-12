const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
let geocoder;
if (mapBoxToken) {
  geocoder = mbxGeocoding({ accessToken: mapBoxToken });
} else {
  console.warn(
    'MAPBOX_TOKEN não configurado. A geocodificação não funcionará.'
  );
}
const { cloudinary } = require('../cloudinary');

///////////////////// CONTROLLER - VIEW  DA LISTA DE ACAMPAMENTOS ///////////////////
module.exports.index = async (req, res) => {
  // Pagination and sorting
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitRaw = parseInt(req.query.limit, 10);
  const limit = Math.min(50, Math.max(1, isNaN(limitRaw) ? 12 : limitRaw));
  const sort = req.query.sort || '-_id'; // default newest first using ObjectId timestamp

  const skip = (page - 1) * limit;

  // Basic query (can be extended later for filters/search)
  const query = {};

  const [items, total] = await Promise.all([
    Campground.find(query).sort(sort).skip(skip).limit(limit),
    Campground.countDocuments(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  res.json({
    items,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  });
};
///////////////////// CONTROLLER - VIEW DE CRIAR NOVO ACAMPAMENTO ////////////////////
// Não é mais necessário, o formulário será renderizado pelo React
// module.exports.renderNewForm = (req, res) => {
//   res.render("campgrounds/new");
// };
// CONTROLLER - CRIAR NOVO ACAMPAMENTO
module.exports.createCampground = async (req, res, next) => {
  // CRIANDO OBJETO ACAMPAMENTO
  const campground = new Campground(req.body.campground);

  // MAPBOX GEOCODING API - CONVERTE DATA STRING EM COORDENADAS
  // Only geocode if geometry wasn't provided by the frontend
  if (geocoder && !req.body.campground.geometry) {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1, // UMA DICA DO ENDERECO
      })
      .send();
    // - GEOJSON - geometry - COORDENADAS
    if (geoData.body.features && geoData.body.features.length) {
      campground.geometry = geoData.body.features[0].geometry;
    }
  }
  // If geometry was provided by frontend, it's already in campground object from req.body.campground

  // RECEBEMOS AS IMAGENS DO CLOUDINARY
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  // RECEBEMMOS OS DADOS DO USUARIO
  campground.author = req.user._id;
  // SALVAMOS NO BD
  await campground.save();
  // SAIDAS MENSSAGENS RENDERIZACAO
  console.log(campground);
  // Em vez de redirecionar, retorna o acampamento criado e a mensagem flash
  res
    .status(201)
    .json({ campground, message: 'Novo acampamento criado com sucesso!' });
};
//////////////// CONTROLLER - MOSTRAR ACAMPAMENTO /////////////////////////
module.exports.showCampground = async (req, res) => {
  // BUSCA NO DB O DOCUMENTO REFERENTE AO ID
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'author',
      },
    })
    .populate('author');
  // SE NAO EXISTIR O ID NO DB
  if (!campground) {
    // Retorna 404 e a mensagem de erro
    return res
      .status(404)
      .json({ error: 'Não foi possível encontrar este acampamento!' });
  }
  // Retorna o acampamento em JSON
  res.json(campground);
};
///////////////// CONTROLLER - VIEW EDITAR ACAMPAMENTO /////////////////////
module.exports.renderEditForm = async (req, res) => {
  // RECEBE O ID DO ACAMPAMENTO ESCOLHIDO PELO USUARIO
  const { id } = req.params;
  // BUSCA ID ACAMPAMENTO NO BANCO DE DADOS
  const campground = await Campground.findById(id);
  // SE NAO EXISTIR NO DB
  if (!campground) {
    // Retorna 404 e a mensagem de erro
    return res
      .status(404)
      .json({ error: 'Não foi possível encontrar este acampamento!' });
  }
  // Retorna o acampamento em JSON para preencher o formulário de edição no React
  res.json(campground);
};
//////////////// CONTROLLER - ATUALIZAR ACAMPAMENTO ////////////////////////
module.exports.updateCampground = async (req, res) => {
  // RECEBE O ID DO ACAMPAMENTO A SER SALVO
  const { id } = req.params;
  console.log(req.body);
  // SALVA AS ALTERACOES NO DB
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  // RECEBE CONTAINER DAS IMAGENGENS
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  // SALVA ALTERACOES DE IMAGENS - EXISTENTES, NOVAS OU DELETADAS
  campground.images.push(...imgs);
  // SALVA ALTERACOES DE IMAGENS - EXISTENTES, NOVAS OU DELETADAS
  await campground.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  // OPERACAO BEM SUCEDIDA DA REQUISICAO
  // Retorna o acampamento atualizado e a mensagem flash
  res.json({
    campground,
    message: 'O acampamento foi atualizado com sucesso!',
  });
};
////////////////// CONTROLLER - REMOVER ACAMPAMENTO //////////////////////////
module.exports.deleteCampground = async (req, res) => {
  // RECEBE O ID
  const { id } = req.params;
  // REMOVE DO DB
  await Campground.findByIdAndDelete(id);
  // OPERACAO BEM SUCEDIDA DA REQUISICAO
  // Retorna sucesso e a mensagem flash
  res.json({ message: 'O acampamento foi removido com sucesso!' });
};
