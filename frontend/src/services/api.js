import axios from "axios";
import { getGuestId } from "../utils/guestSession";

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/`
  : "http://localhost:8000/api/";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  xsrfCookieName: 'csrftoken', 
  xsrfHeaderName: 'X-CSRFToken',
});

api.interceptors.request.use((config) => {
  const guestId = getGuestId();
  if (guestId) {
    config.headers["X-Guest-ID"] = guestId;
  }
  return config;
});

export default api;

