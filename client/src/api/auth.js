import http from './http';
const API_URL = '/'; // base já configurada no http (termina com /api)

export const registerUser = async (userData) => {
  const response = await http.post(`${API_URL}register`, userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await http.post(`${API_URL}login`, userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await http.get(`${API_URL}logout`);
  return response.data;
};

export const getCurrentUser = async () => {
  try {
    const response = await http.get(`${API_URL}current-user`);
    return response.data.user;
  } catch {
    return null;
  }
};
