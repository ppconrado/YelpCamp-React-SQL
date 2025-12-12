import http from './http';
const API_URL = '/campgrounds';

export const getCampgrounds = async ({
  page = 1,
  limit = 12,
  sort = '-_id',
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
  });
  const response = await http.get(`${API_URL}?${params.toString()}`);
  return response.data; // { items, page, limit, total, totalPages, hasNext, hasPrev }
};

// Get all campgrounds locations for map (no pagination)
export const getAllCampgroundsForMap = async () => {
  const response = await http.get(`${API_URL}?limit=1000`); // Get all campgrounds
  return response.data.items; // Return just the items array
};

export const getCampground = async (id) => {
  const response = await http.get(`${API_URL}/${id}`);
  return response.data;
};

export const createCampground = async (campgroundData) => {
  // Nota: Para lidar com upload de arquivos (imagens), o backend espera FormData.
  // O frontend React precisará montar o FormData corretamente.
  const response = await http.post(API_URL, campgroundData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateCampground = async (id, campgroundData) => {
  const response = await http.put(`${API_URL}/${id}`, campgroundData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteCampground = async (id) => {
  const response = await http.delete(`${API_URL}/${id}`);
  return response.data;
};

export const deleteCampgroundImage = async (id, filename) => {
  const response = await http.put(`${API_URL}/${id}`, {
    deleteImages: [filename],
  });
  return response.data;
};
