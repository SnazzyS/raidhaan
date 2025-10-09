<script setup>
import { reactive, ref, onMounted } from 'vue';
import { router } from '@inertiajs/vue3';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const form = reactive({
    email: '',
    password: '',
});
const submitting = ref(false);
const formError = ref('');

onMounted(() => {
    if (auth.isAuthenticated.value) {
        router.visit('/dashboard');
    }
});

const submit = async () => {
    submitting.value = true;
    formError.value = '';

    try {
        await auth.login(form);
        router.visit('/dashboard');
    } catch (error) {
        formError.value =
            auth.state.error ?? 'Unable to log in with those credentials.';
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
        <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <div class="mb-8 text-center">
                <div
                    class="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-extrabold text-white"
                >
                    R
                </div>
                <h1 class="text-2xl font-semibold text-slate-900">Welcome back</h1>
                <p class="mt-2 text-sm text-slate-500">
                    Sign in to access the Raidhaan order management console.
                </p>
            </div>

            <form
                class="space-y-6"
                @submit.prevent="submit"
            >
                <div class="space-y-2">
                    <label
                        for="email"
                        class="block text-sm font-medium text-slate-700"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        v-model="form.email"
                        type="email"
                        required
                        autocomplete="email"
                        class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        placeholder="admin@raidhaan.com"
                    />
                </div>

                <div class="space-y-2">
                    <label
                        for="password"
                        class="block text-sm font-medium text-slate-700"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        v-model="form.password"
                        type="password"
                        required
                        autocomplete="current-password"
                        class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        placeholder="••••••••"
                    />
                </div>

                <div
                    v-if="formError"
                    class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                    {{ formError }}
                </div>

                <button
                    type="submit"
                    class="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    :disabled="submitting"
                >
                    <svg
                        v-if="submitting"
                        class="-ml-1 mr-3 size-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                    </svg>
                    <span>{{ submitting ? 'Signing in…' : 'Sign in' }}</span>
                </button>
            </form>

            <p class="mt-6 text-center text-xs text-slate-400">
                Tip: Use the admin credentials from your database seeder (e.g. admin@raidhaan.com).
            </p>
        </div>
    </div>
</template>
