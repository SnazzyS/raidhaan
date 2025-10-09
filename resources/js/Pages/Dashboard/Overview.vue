<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { Link } from '@inertiajs/vue3';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout.vue';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const loading = ref(true);
const error = ref('');

const stats = reactive({
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    categories: 0,
    items: 0,
    salesTotal: 0,
});

const recentOrders = ref([]);

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'MVR',
        minimumFractionDigits: 2,
    }).format(amount ?? 0);

const formatDate = (dateTime) =>
    new Intl.DateTimeFormat('en', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateTime));

const loadDashboard = async () => {
    loading.value = true;
    error.value = '';

    try {
        const [ordersRes, categoriesRes, itemsRes, salesRes] = await Promise.all([
            axios.get('/orders'),
            axios.get('/categories'),
            axios.get('/items'),
            axios.get('/sales'),
        ]);

        const orders = ordersRes.data ?? [];
        const categories = categoriesRes.data ?? [];
        const items = itemsRes.data ?? [];
        const sales = salesRes.data ?? [];

        stats.pendingOrders = orders.filter((order) => order.status === 'pending').length;
        stats.completedOrders = orders.filter((order) => order.status === 'completed').length;
        stats.cancelledOrders = orders.filter((order) => order.status === 'cancelled').length;
        stats.categories = categories.length;
        stats.items = items.length;
        stats.salesTotal = sales.reduce((sum, sale) => sum + Number(sale.total ?? 0), 0);

        recentOrders.value = orders.slice(0, 5);
    } catch (requestError) {
        error.value = requestError.response?.data?.message ?? 'Unable to load dashboard data.';
    } finally {
        loading.value = false;
    }
};

const summaryCards = computed(() => [
    {
        name: 'Pending orders',
        value: stats.pendingOrders,
        helper: 'Awaiting processing',
        accent: 'bg-amber-500/10 text-amber-600',
        badge: 'Pending',
    },
    {
        name: 'Completed today',
        value: stats.completedOrders,
        helper: 'Marked as fulfilled',
        accent: 'bg-emerald-500/10 text-emerald-600',
        badge: 'Completed',
    },
    {
        name: 'Cancelled',
        value: stats.cancelledOrders,
        helper: 'Requires follow-up',
        accent: 'bg-rose-500/10 text-rose-600',
        badge: 'Cancelled',
    },
    {
        name: 'Items live',
        value: stats.items,
        helper: `${stats.categories} categories`,
        accent: 'bg-slate-900/10 text-slate-900',
        badge: 'Inventory',
    },
]);

onMounted(async () => {
    auth.ensureAuthenticated();
    await loadDashboard();
});
</script>

<template>
    <AppLayout>
        <section class="space-y-6">
            <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
                    <p class="text-sm text-slate-500">
                        Track incoming orders, inventory health, and daily sales performance.
                    </p>
                </div>
                <div class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    Today’s takings
                    <span class="ml-2 text-base font-bold text-slate-900">{{ formatCurrency(stats.salesTotal) }}</span>
                </div>
            </header>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article
                    v-for="card in summaryCards"
                    :key="card.name"
                    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <p class="text-sm font-semibold text-slate-500">{{ card.name }}</p>
                    <p class="mt-4 text-3xl font-bold text-slate-900">{{ card.value }}</p>
                    <p class="mt-2 text-sm text-slate-500">{{ card.helper }}</p>
                    <span class="mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" :class="card.accent">
                        {{ card.badge }}
                    </span>
                </article>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <header class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-semibold text-slate-900">Latest orders</h2>
                            <p class="text-sm text-slate-500">Snapshot of the five most recent orders.</p>
                        </div>
                        <Link href="/orders" class="text-sm font-semibold text-slate-900 hover:underline">
                            View all
                        </Link>
                    </header>

                    <div v-if="loading" class="mt-6 space-y-3">
                        <div class="h-12 w-full animate-pulse rounded-xl bg-slate-100"></div>
                        <div class="h-12 w-full animate-pulse rounded-xl bg-slate-100"></div>
                        <div class="h-12 w-full animate-pulse rounded-xl bg-slate-100"></div>
                    </div>

                    <div v-else-if="recentOrders.length === 0" class="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No orders yet. New orders will appear here as soon as they’re created.
                    </div>

                    <ul v-else class="mt-6 space-y-4">
                        <li
                            v-for="order in recentOrders"
                            :key="order.id"
                            class="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                        >
                            <div>
                                <p class="text-sm font-semibold text-slate-900">
                                    {{ order.order_number }}
                                </p>
                                <p class="text-xs text-slate-500">
                                    {{ order.customer?.phone_number ?? 'N/A' }} •
                                    {{ formatDate(order.created_at) }}
                                </p>
                            </div>
                            <div class="flex flex-col items-end">
                                <span
                                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize"
                                    :class="{
                                        'bg-amber-100 text-amber-700': order.status === 'pending',
                                        'bg-emerald-100 text-emerald-700': order.status === 'completed',
                                        'bg-rose-100 text-rose-700': order.status === 'cancelled',
                                    }"
                                >
                                    {{ order.status }}
                                </span>
                                <span class="mt-2 text-sm font-semibold text-slate-900">
                                    {{ formatCurrency(order.total_amount) }}
                                </span>
                            </div>
                        </li>
                    </ul>
                </section>

                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <header class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-semibold text-slate-900">Inventory overview</h2>
                            <p class="text-sm text-slate-500">Stay ahead of low-stock items and keep menus fresh.</p>
                        </div>
                        <Link href="/items" class="text-sm font-semibold text-slate-900 hover:underline">
                            Manage items
                        </Link>
                    </header>

                    <div class="mt-6 grid gap-4">
                        <div class="rounded-xl border border-slate-200 px-4 py-3">
                            <p class="text-sm font-semibold text-slate-900">Items live</p>
                            <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.items }}</p>
                            <p class="text-xs text-slate-500">Across {{ stats.categories }} categories.</p>
                        </div>
                        <div class="rounded-xl border border-slate-200 px-4 py-3">
                            <p class="text-sm font-semibold text-slate-900">Daily sales</p>
                            <p class="mt-1 text-2xl font-bold text-slate-900">{{ formatCurrency(stats.salesTotal) }}</p>
                            <p class="text-xs text-slate-500">Sum of today’s recorded sales entries.</p>
                        </div>
                    </div>

                    <div
                        v-if="error"
                        class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                    >
                        {{ error }}
                    </div>
                </section>
            </div>
        </section>
    </AppLayout>
</template>
