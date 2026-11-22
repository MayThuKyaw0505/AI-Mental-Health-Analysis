import axios from "axios";

const baseURL = "http://127.0.0.1:8000/api/";
const api = axios.create({ baseURL, timeout: 15000 });
let refreshPromise = null;
let redirecting = false;
const isPublicAuth = (url = "") =>
  ["auth/login/", "auth/register/", "auth/token/refresh/"].includes(url);

function expireSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  if (!redirecting) {
    redirecting = true;
    window.location.replace("/login?session=expired");
  }
}

api.interceptors.request.use((config) => {
  if (!isPublicAuth(config.url)) {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (
      axios.isCancel(error) ||
      !request ||
      error.response?.status !== 401 ||
      isPublicAuth(request.url)
    ) {
      return Promise.reject(error);
    }
    const refresh = localStorage.getItem("refresh_token");
    if (request._retry || !refresh) {
      expireSession();
      return Promise.reject(error);
    }
    request._retry = true;
    const latestAccess = localStorage.getItem("access_token");
    if (
      latestAccess &&
      request.headers.Authorization !== `Bearer ${latestAccess}`
    ) {
      return api(request);
    }
    try {
      // Dashboard and Journals make concurrent requests. Share one refresh.
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${baseURL}auth/token/refresh/`,
            { refresh },
            { timeout: 15000 },
          )
          .then(({ data }) => {
            // A completed refresh must not log someone back in after logout.
            if (localStorage.getItem("refresh_token") !== refresh)
              throw new axios.CanceledError("Session changed.");
            if (typeof data.access !== "string")
              throw new Error("Invalid authentication response.");
            localStorage.setItem("access_token", data.access);
            return data.access;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const access = await refreshPromise;
      request.headers.Authorization = `Bearer ${access}`;
      return api(request);
    } catch (refreshError) {
      if (
        [401, 403].includes(refreshError.response?.status) &&
        localStorage.getItem("refresh_token") === refresh
      )
        expireSession();
      // A temporary network/database outage should not discard the session.
      return Promise.reject(refreshError);
    }
  },
);

export default api;
