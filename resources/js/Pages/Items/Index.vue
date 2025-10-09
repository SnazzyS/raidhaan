<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();

const items = ref([]);
const categories = ref([]);
const loading = ref(false);
const error = ref('');

const form = reactive({
    id: null,
    name: '',
    price: '',
    category_id: '',
});

const submitting = ref(false);

const isEditing = computed(() => form.id !== null);

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'MVR',
        minimumFractionDigits: 2,
    }).format(amount ?? 0);

const resetForm = () => {
    form.id = null;
    form.name = '';
    form.price = '';
    form.category_id = categories.value[0]?.id ?? '';
    error.value = '';
};

const loadData = async () => {
    loading.value = true;
    error.value = '';

    try {
        const [itemsRes, categoriesRes] = await Promise.all([
            axios.get('/items'),
            axios.get('/categories'),
        ]);

        items.value = itemsRes.data ?? [];
        categories.value = categoriesRes.data ?? [];

        if (!form.category_id && categories.value.length) {
            form.category_id = categories.value[0].id;
        }
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ?? 'Unable to load items catalog.';
    } finally {
        loading.value = false;
    }
};

const handleSubmit = async () => {
    submitting.value = true;
    error.value = '';

    const payload = {
        name: form.name,
        price: Number(form.price),
        category_id: Number(form.category_id),
    };

    try {
        if (isEditing.value) {
            await axios.put(`/items/${form.id}`, payload);
        } else {
            await axios.post('/items', payload);
        }

        await loadData();
        resetForm();
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            requestError.response?.data?.errors?.name?.[0] ??
            requestError.response?.data?.errors?.price?.[0] ??
            'Unable to save the item.';
    } finally {
        submitting.value = false;
    }
};

const startEditing = (item) => {
    form.id = item.id;
    form.name = item.name;
    form.price = item.price;
    form.category_id = item.category_id;
};

const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this item? This action cannot be undone.')) {
        return;
    }

    try {
        await axios.delete(`/items/${itemId}`);
        items.value = items.value.filter((entry) => entry.id !== itemId);
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ?? 'Unable to delete the item.';
    }
};

onMounted(async () => {
    auth.ensureAuthenticated();
    await loadData();
});
</script>

<template>
    <AppLayout>
        <section class="space-y-6">
            <header class="border-b border-slate-200 pb-4">
                <h1 class="text-2xl font-semibold text-slate-900">Items</h1>
                <p class="text-sm text-slate-500">
                    Maintain the product catalogue and pricing used when creating orders.
                </p>
            </header>

            <div class="grid gap-6 lg:grid-cols-3">
                <section class="lg:col-span-2">
                    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div class="border-b border-slate-200 px-6 py-4">
                            <h2 class="text-lg font-semibold text-slate-900">Catalogue</h2>
                            <p class="text-sm text-slate-500">
                                {{ items.length }} items across {{ categories.length }} categories.
                            </p>
                        </div>

                        <div v-if="loading" class="space-y-4 px-6 py-6">
                            <div class="h-6 w-1/2 animate-pulse rounded bg-slate-100"></div>
                            <div class="h-6 w-2/3 animate-pulse rounded bg-slate-100"></div>
                            <div class="h-6 w-1/3 animate-pulse rounded bg-slate-100"></div>
                        </div>

                        <table v-else class="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th class="px-6 py-3 text-left font-medium">Item</th>
                                    <th class="px-6 py-3 text-left font-medium">Category</th>
                                    <th class="px-6 py-3 text-left font-medium">Price</th>
                                    <th class="px-6 py-3 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-if="items.length === 0">
                                    <td colspan="4" class="px-6 py-6 text-center text-sm text-slate-500">
                                        No items yet. Use the form to create your first menu item.
                                    </td>
                                </tr>
                                <tr
                                    v-for="item in items"
                                    :key="item.id"
                                    class="transition hover:bg-slate-50"
                                >
                                    <td class="px-6 py-4 font-semibold text-slate-900">
                                        {{ item.name }}
                                    </td>
                                    <td class="px-6 py-4 capitalize">
                                        {{ item.category?.name ?? 'Uncategorised' }}
                                    </td>
                                    <td class="px-6 py-4 font-semibold text-slate-900">
                                        {{ formatCurrency(item.price) }}
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                                @click="startEditing(item)"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                                @click="deleteItem(item.id)"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <header class="mb-4">
                        <h2 class="text-lg font-semibold text-slate-900">
                            {{ isEditing ? 'Update item' : 'Add new item' }}
                        </h2>
                        <p class="text-sm text-slate-500">
                            Set the display name, default price, and category.
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
                                placeholder="Item name"
                            />
                        </div>
                        <div>
                            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Price (MVR)
                            </label>
                            <input
                                v-model="form.price"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Category
                            </label>
                            <select
                                v-model="form.category_id"
                                required
                                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 capitalize"
                            >
                                <option value="" disabled>Select category</option>
                                <option
                                    v-for="category in categories"
                                    :key="category.id"
                                    :value="category.id"
                                >
                                    {{ category.name }}
                                </option>
                            </select>
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
                                <span>{{ isEditing ? 'Update item' : 'Add item' }}</span>
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
