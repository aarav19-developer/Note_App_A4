import axios from "axios";

// In development, Vite proxy handles /user and /notes — no base URL needed.
// In production (Render), VITE_API_URL is set to the backend Render URL.
const BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;
