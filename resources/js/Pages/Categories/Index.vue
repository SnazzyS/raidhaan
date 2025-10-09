<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();

const categories = ref([]);
const loading = ref(false);
const error = ref('');

const form = reactive({
    id: null,
    name: '',
});

const submitting = ref(false);

const isEditing = computed(() => form.id !== null);

const loadCategories = async () => {
    loading.value = true;
    error.value = '';

    try {
        const { data } = await axios.get('/categories');
        categories.value = data ?? [];
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            'Unable to load categories. Please try again.';
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    form.id = null;
    form.name = '';
    error.value = '';
};

const handleSubmit = async () => {
    submitting.value = true;
    error.value = '';

    const payload = {
        name: form.name,
    };

    try {
        if (isEditing.value) {
            await axios.put(`/categories/${form.id}`, payload);
        } else {
            await axios.post('/categories', payload);
        }

        await loadCategories();
        resetForm();
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            requestError.response?.data?.errors?.name?.[0] ??
            'Unable to save the category.';
    } finally {
        submitting.value = false;
    }
};

const startEditing = (category) => {
    form.id = category.id;
    form.name = category.name;
};

const deleteCategory = async (categoryId) => {
    if (
        !window.confirm(
            'Deleting this category will uncategorise its items. Continue?',
        )
    ) {
        return;
    }

    try {
        await axios.delete(`/categories/${categoryId}`);
        categories.value = categories.value.filter((category) => category.id !== categoryId);
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            'Unable to delete the category.';
    }
};

onMounted(async () => {
    auth.ensureAuthenticated();
    await loadCategories();
});
</script>

<template>
    <AppLayout>
        <section class="space-y-6">
            <header class="border-b border-slate-200 pb-4">
                <h1 class="text-2xl font-semibold text-slate-900">Categories</h1>
                <p class="text-sm text-slate-500">
                    Organise menu items by category to make order entry faster.
                </p>
            </header>

            <div class="grid gap-6 lg:grid-cols-3">
                <section class="lg:col-span-2">
                    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div class="border-b border-slate-200 px-6 py-4">
                            <h2 class="text-lg font-semibold text-slate-900">Category list</h2>
                            <p class="text-sm text-slate-500">
                                {{ categories.length }} categories in total.
                            </p>
                        </div>

                        <div v-if="loading" class="space-y-4 px-6 py-6">
                            <div class="h-6 w-1/2 animate-pulse rounded bg-slate-100"></div>
                            <div class="h-6 w-2/3 animate-pulse rounded bg-slate-100"></div>
                            <div class="h-6 w-1/4 animate-pulse rounded bg-slate-100"></div>
                        </div>

                        <ul v-else class="divide-y divide-slate-200">
                            <li
                                v-if="categories.length === 0"
                                class="px-6 py-6 text-center text-sm text-slate-500"
                            >
                                No categories created yet. Use the form to add the first one.
                            </li>
                            <li
                                v-for="category in categories"
                                :key="category.id"
                                class="flex flex-col border-slate-100 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p class="text-base font-semibold text-slate-900">
                                        {{ category.name }}
                                    </p>
                                    <p class="text-xs text-slate-500">
                                        {{ category.items?.length ?? 0 }} items
                                    </p>
                                </div>
                                <div class="mt-3 flex flex-wrap gap-2 sm:mt-0">
                                    <button
                                        type="button"
                                        class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                        @click="startEditing(category)"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                        @click="deleteCategory(category.id)"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <header class="mb-4">
                        <h2 class="text-lg font-semibold text-slate-900">
                            {{ isEditing ? 'Update category' : 'Create category' }}
                        </h2>
                        <p class="text-sm text-slate-500">
                            Categories help group items on receipts and in the POS.
                        </p>
                    </header>

                    <form class="space-y-4" @submit.prevent="handleSubmit">
                        <div>
                            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Name
                            </label>
                            <input
                                v-model.trim="form.name"
                                type="text"
                                required
                                minlength="2"
                                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                placeholder="e.g. Beverages"
                            />
                        </div>

                        <div
                            v-if="error"
                            class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                        >
                            {{ error }}
                        </div>

                        <div class="flex flex-col gap-2">
                            <button
                                type="submit"
                                class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
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
                                <span>{{ isEditing ? 'Update category' : 'Create category' }}</span>
                            </button>

                            <button
                                v-if="isEditing"
                                type="button"
                                class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                @click="resetForm"
                            >
                                Cancel edit
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </section>
    </AppLayout>
</template>
