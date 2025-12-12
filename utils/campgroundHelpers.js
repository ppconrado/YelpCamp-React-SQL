const Campground = require('../models/campground');

/**
 * Busca campgrounds por proximidade geográfica
 * @param {Number} lng - Longitude
 * @param {Number} lat - Latitude
 * @param {Number} maxDistance - Distância máxima em metros (padrão: 50km)
 */
exports.findNearby = async (lng, lat, maxDistance = 50000) => {
  return await Campground.find({
    geometry: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistance,
      },
    },
  }).limit(20);
};

/**
 * Busca textual em campgrounds
 * @param {String} searchText - Texto para buscar em título, descrição e localização
 */
exports.searchCampgrounds = async (searchText) => {
  return await Campground.find(
    {
      $text: { $search: searchText },
    },
    {
      score: { $meta: 'textScore' },
    }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20);
};

/**
 * Paginação de campgrounds
 * @param {Number} page - Número da página (começa em 1)
 * @param {Number} limit - Itens por página (padrão: 10)
 */
exports.paginateCampgrounds = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [campgrounds, total] = await Promise.all([
    Campground.find({})
      .populate('author', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Campground.countDocuments(),
  ]);

  return {
    campgrounds,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};
