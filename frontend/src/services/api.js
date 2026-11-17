import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4001/api",
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("doptech_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("doptech_token");
      localStorage.removeItem("doptech_user");
      window.dispatchEvent(new Event("doptech:logout"));
    }
    return Promise.reject(err);
  },
);
export default api;
