// API Configuration for different environments
const getApiBaseUrl = (): string => {
  // In production, use the environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  // Fallback for production if env var is not set
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// API Configuration object
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', import.meta.env.MODE);
