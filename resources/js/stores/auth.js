import { reactive, computed } from 'vue';
import { router } from '@inertiajs/vue3';
import axios from 'axios';
import { tokenKey, userKey } from '../bootstrap';

const initialToken =
    typeof window !== 'undefined' ? window.localStorage.getItem(tokenKey) : null;
const initialUser =
    typeof window !== 'undefined'
        ? JSON.parse(window.localStorage.getItem(userKey) ?? 'null')
        : null;

const state = reactive({
    user: initialUser,
    token: initialToken,
    loading: false,
    error: null,
});

const setToken = (token) => {
    state.token = token;

    if (typeof window !== 'undefined') {
        if (token) {
            window.localStorage.setItem(tokenKey, token);
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            window.localStorage.removeItem(tokenKey);
            delete axios.defaults.headers.common.Authorization;
        }
    }
};

const setUser = (user) => {
    state.user = user;

    if (typeof window !== 'undefined') {
        if (user) {
            window.localStorage.setItem(userKey, JSON.stringify(user));
        } else {
            window.localStorage.removeItem(userKey);
        }
    }
};

const hydrateAxiosAuthorization = () => {
    if (state.token) {
        axios.defaults.headers.common.Authorization = `Bearer ${state.token}`;
    }
};

hydrateAxiosAuthorization();

const login = async (credentials) => {
    try {
        state.loading = true;
        state.error = null;

        const { data } = await axios.post('/login', credentials);

        setToken(data.access_token);
        setUser(data.user);

        return data;
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.response?.data?.errors?.email?.[0] ??
            error.response?.data?.errors?.password?.[0] ??
            'Unable to sign in with those credentials.';

        state.error = message;
        throw error;
    } finally {
        state.loading = false;
    }
};

const logout = async () => {
    try {
        await axios.post('/logout');
    } catch (error) {
        // ignore API errors so local logout still happens
    } finally {
        clearAuth();
        router.visit('/');
    }
};

const clearAuth = () => {
    setToken(null);
    setUser(null);
};

const ensureAuthenticated = () => {
    if (!state.token) {
        router.visit('/');
    }
};

export const useAuthStore = () => {
    const isAuthenticated = computed(() => Boolean(state.token));

    return {
        state,
        isAuthenticated,
        login,
        logout,
        setToken,
        setUser,
        clearAuth,
        ensureAuthenticated,
    };
};
