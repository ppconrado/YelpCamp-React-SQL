import axios from 'axios';

// In production, force same-origin (Vercel proxy handles /api → backend)
// In development, use VITE_API_URL or fallback to current origin/localhost
let apiBaseUrl;
if (typeof window !== 'undefined') {
  const origin = window.location.origin;
  if (import.meta.env.PROD) {
    apiBaseUrl = origin;
  } else {
    apiBaseUrl =
      (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
      origin ||
      'http://localhost:3000';
  }
} else {
  apiBaseUrl =
    (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
    'http://localhost:3000';
}

const baseURL = `${apiBaseUrl}/api`;

const http = axios.create({
  baseURL,
  withCredentials: true, // Importante para sessões/cookies
});

export default http;
