import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

// attach the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if the token is expired or invalid, log the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthForm =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/admin-login");

    if (err.response?.status === 401 && !isAuthForm) {
      const inAdmin = window.location.pathname.startsWith("/admin");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = inAdmin ? "/admin/login" : "/auth";
    }
    return Promise.reject(err);
  }
);

export default api;