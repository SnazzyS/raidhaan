import axios from 'axios';

window.axios = axios;

const resolveApiBaseUrl = () => {
    const configured = import.meta.env.VITE_API_URL;

    if (!configured) {
        return '/api';
    }

    const normalized = configured.replace(/\/$/, '');

    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const apiBaseUrl = resolveApiBaseUrl();

window.axios.defaults.baseURL = apiBaseUrl;
window.axios.defaults.headers.common['Accept'] = 'application/json';
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const tokenKey = 'raidhaan.auth.token';
const userKey = 'raidhaan.auth.user';

if (typeof window !== 'undefined') {
    const storedToken = window.localStorage.getItem(tokenKey);

    if (storedToken) {
        window.axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
    }

    window.axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                window.localStorage.removeItem(tokenKey);
                window.localStorage.removeItem(userKey);
                delete window.axios.defaults.headers.common.Authorization;

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }

            return Promise.reject(error);
        }
    );
}

export { tokenKey, userKey };
