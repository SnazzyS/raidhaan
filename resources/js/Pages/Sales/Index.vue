<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout.vue';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();

const filters = reactive({
    from: '',
    to: '',
});

const sales = ref([]);
const loading = ref(false);
const error = ref('');

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'MVR',
        minimumFractionDigits: 2,
    }).format(amount ?? 0);

const loadSales = async () => {
    loading.value = true;
    error.value = '';

    const params = {};
    if (filters.from && filters.to) {
        params.from = filters.from;
        params.to = filters.to;
    }

    try {
        const { data } = await axios.get('/sales', { params });
        sales.value = data ?? [];
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            'Unable to load sales records.';
    } finally {
        loading.value = false;
    }
};

const totals = computed(() => ({
    count: sales.value.length,
    amount: sales.value.reduce((sum, sale) => sum + Number(sale.total ?? 0), 0),
}));

const resetFilters = () => {
    filters.from = '';
    filters.to = '';
    loadSales();
};

onMounted(async () => {
    auth.ensureAuthenticated();
    await loadSales();
});
</script>

<template>
    <AppLayout>
        <section class="space-y-6">
            <header class="border-b border-slate-200 pb-4">
                <h1 class="text-2xl font-semibold text-slate-900">Sales</h1>
                <p class="text-sm text-slate-500">
                    Review recorded sales totals by payment method and export data.
                </p>
            </header>

            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <form class="grid gap-4 md:grid-cols-2 lg:grid-cols-4" @submit.prevent="loadSales">
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            From
                        </label>
                        <input
                            v-model="filters.from"
                            type="date"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            To
                        </label>
                        <input
                            v-model="filters.to"
                            type="date"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>

                    <div class="flex items-end gap-3 md:col-span-2 lg:col-span-2">
                        <button
                            type="submit"
                            class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            Apply range
                        </button>
                        <button
                            type="button"
                            class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            @click="resetFilters"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                <div class="mt-6 grid gap-4 sm:grid-cols-3">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p class="text-xs uppercase tracking-wide text-slate-500">Records</p>
                        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ totals.count }}</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2">
                        <p class="text-xs uppercase tracking-wide text-slate-500">Total amount</p>
                        <p class="mt-2 text-2xl font-semibold text-slate-900">
                            {{ formatCurrency(totals.amount) }}
                        </p>
                    </div>
                </div>

                <div
                    v-if="error"
                    class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                >
                    {{ error }}
                </div>
            </section>

            <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header class="border-b border-slate-200 px-6 py-4">
                    <h2 class="text-lg font-semibold text-slate-900">Sales records</h2>
                    <p class="text-sm text-slate-500">
                        Each entry represents a confirmed sale linked to an order number.
                    </p>
                </header>

                <div v-if="loading" class="space-y-4 px-6 py-6">
                    <div class="h-6 w-1/2 animate-pulse rounded bg-slate-100"></div>
                    <div class="h-6 w-2/3 animate-pulse rounded bg-slate-100"></div>
                    <div class="h-6 w-1/3 animate-pulse rounded bg-slate-100"></div>
                </div>

                <table v-else class="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                    <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th class="px-6 py-3 text-left font-medium">Order #</th>
                            <th class="px-6 py-3 text-left font-medium">Payment method</th>
                            <th class="px-6 py-3 text-left font-medium">Total</th>
                            <th class="px-6 py-3 text-left font-medium">Recorded on</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr
                            v-if="sales.length === 0"
                            class="bg-slate-50/60"
                        >
                            <td colspan="4" class="px-6 py-6 text-center text-sm text-slate-500">
                                No sales found for the selected period.
                            </td>
                        </tr>
                        <tr
                            v-for="sale in sales"
                            :key="sale.id"
                            class="transition hover:bg-slate-50"
                        >
                            <td class="px-6 py-4 font-semibold text-slate-900">
                                {{ sale.order_number }}
                            </td>
                            <td class="px-6 py-4 capitalize">
                                {{ sale.payment_method }}
                            </td>
                            <td class="px-6 py-4 font-semibold text-slate-900">
                                {{ formatCurrency(sale.total) }}
                            </td>
                            <td class="px-6 py-4 text-xs text-slate-500">
                                {{ new Date(sale.created_at).toLocaleString() }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </section>
    </AppLayout>
</template>
