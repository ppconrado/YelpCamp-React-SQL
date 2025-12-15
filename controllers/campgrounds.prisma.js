import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { cloudinary } from '../cloudinary/index.js';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mapBoxToken
  ? mbxGeocoding({ accessToken: mapBoxToken })
  : null;

// List campgrounds with pagination
export async function index(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitRaw = parseInt(req.query.limit, 10);
  const limit = Math.min(50, Math.max(1, isNaN(limitRaw) ? 12 : limitRaw));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.campground.findMany({
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      include: { author: true, reviews: true, images: true },
    }),
    prisma.campground.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.json({
    items,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  });
}

// Create new campground
export async function createCampground(req, res) {
  let geometry = req.body.campground.geometry;
  if (geocoder && !geometry) {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();
    if (geoData.body.features && geoData.body.features.length) {
      geometry = geoData.body.features[0].geometry;
    }
  }
  const images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  const campground = await prisma.campground.create({
    data: {
      ...req.body.campground,
      geometry,
      images: { create: images },
      authorId: req.user.id,
    },
    include: { images: true, author: true },
  });
  res
    .status(201)
    .json({ campground, message: 'Novo acampamento criado com sucesso!' });
}

// Show campground by id
export async function showCampground(req, res) {
  const campground = await prisma.campground.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      reviews: { include: { author: true } },
      author: true,
      images: true,
    },
  });
  if (!campground) {
    return res
      .status(404)
      .json({ error: 'Não foi possível encontrar este acampamento!' });
  }
  res.json(campground);
}

// Update campground
export async function updateCampground(req, res) {
  const { id } = req.params;
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  let geometry = req.body.campground.geometry;
  if (geocoder && !geometry) {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();
    if (geoData.body.features && geoData.body.features.length) {
      geometry = geoData.body.features[0].geometry;
    }
  }
  const campground = await prisma.campground.update({
    where: { id: Number(id) },
    data: {
      ...req.body.campground,
      geometry,
      images: { create: imgs },
    },
    include: { images: true, author: true },
  });
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await prisma.image.deleteMany({
      where: {
        filename: { in: req.body.deleteImages },
        campgroundId: Number(id),
      },
    });
  }
  res.json({
    campground,
    message: 'O acampamento foi atualizado com sucesso!',
  });
}

// Delete campground
export async function deleteCampground(req, res) {
  const { id } = req.params;
  await prisma.campground.delete({ where: { id: Number(id) } });
  res.json({ message: 'O acampamento foi removido com sucesso!' });
}
