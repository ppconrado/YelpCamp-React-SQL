import http from './http';
const API_URL = '/campgrounds';

export const createReview = async (campgroundId, reviewData) => {
  const response = await http.post(
    `${API_URL}/${campgroundId}/reviews`,
    reviewData
  );
  return response.data;
};

export const deleteReview = async (campgroundId, reviewId) => {
  const response = await http.delete(
    `${API_URL}/${campgroundId}/reviews/${reviewId}`
  );
  return response.data;
};
