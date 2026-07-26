import axios from "axios";
import { getGuestId } from "../utils/guestSession";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
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

