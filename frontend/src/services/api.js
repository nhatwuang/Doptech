// import axios from "axios";
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:4001/api",
//   timeout: 15000,
// });
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("doptech_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
// api.interceptors.response.use(
//   (r) => r,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem("doptech_token");
//       localStorage.removeItem("doptech_user");
//       window.dispatchEvent(new Event("doptech:logout"));
//     }
//     return Promise.reject(err);
//   },
// );
// export default api;

import axios from "axios";

// URL Backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

// Khởi tạo Axios instance
const api = axios.create({
  baseURL: API_URL.replace(/\/+$/, ""),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động đính kèm JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("doptech_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý phản hồi từ Backend
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("doptech_token");
      localStorage.removeItem("doptech_user");

      window.dispatchEvent(new Event("doptech:logout"));
    }

    return Promise.reject(error);
  },
);

export default api;
