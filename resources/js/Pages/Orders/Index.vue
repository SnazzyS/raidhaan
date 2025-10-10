<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { Link } from '@inertiajs/vue3';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout.vue';
import { useAuthStore } from '../../stores/auth.js';
import { printOrderReceipt } from '../../services/printService.js';

const auth = useAuthStore();

const orders = ref([]);
const loading = ref(false);
const error = ref('');
const updatingOrderId = ref(null);
const printingOrderId = ref(null);

const filters = reactive({
    search: '',
    status: 'all',
    deliveryType: 'all',
    paymentMethod: 'all',
    from: '',
    to: '',
});

const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const deliveryOptions = [
    { value: 'all', label: 'All delivery types' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'pickup', label: 'Pickup' },
];

const paymentOptions = [
    { value: 'all', label: 'All payment methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'transfer', label: 'Transfer' },
];

const queryParams = computed(() => {
    const params = {};

    if (filters.search) {
        params.search = filters.search;
    }

    if (filters.status !== 'all') {
        params['filter[status]'] = filters.status;
    }

    if (filters.deliveryType !== 'all') {
        params['filter[delivery_type]'] = filters.deliveryType;
    }

    if (filters.paymentMethod !== 'all') {
        params['filter[payment_method]'] = filters.paymentMethod;
    }

    if (filters.from && filters.to) {
        params.from = filters.from;
        params.to = filters.to;
    }

    return params;
});

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

const loadOrders = async () => {
    loading.value = true;
    error.value = '';

    try {
        const { data } = await axios.get('/orders', { params: queryParams.value });
        orders.value = data ?? [];
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ?? 'Failed to fetch orders. Please try again.';
    } finally {
        loading.value = false;
    }
};

const buildOrderPayload = (order, statusOverride = null) => ({
    phone_number: order.customer?.phone_number,
    address: order.customer?.address,
    city: order.customer?.city,
    order: {
        status: statusOverride ?? order.status,
        delivery_type: order.delivery_type,
        payment_method: order.payment_method,
        transfer_reference_number: order.transfer_reference_number,
        items: (order.items ?? []).map((item) => ({
            item_id: item.id,
            quantity: item.pivot?.quantity ?? 1,
        })),
    },
});

const updateOrderStatus = async (orderId, status) => {
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
        return;
    }

    updatingOrderId.value = orderId;

    try {
        const { data } = await axios.get(`/orders/${orderId}`);
        const payload = buildOrderPayload(data, status);
        await axios.put(`/orders/${orderId}`, payload);
        await loadOrders();
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            'Failed to update order. Please retry after reloading the page.';
    } finally {
        updatingOrderId.value = null;
    }
};

const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
        return;
    }

    try {
        await axios.delete(`/orders/${orderId}`);
        orders.value = orders.value.filter((order) => order.id !== orderId);
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ?? 'Failed to delete the order.';
    }
};

const handlePrint = async (orderId) => {
    printingOrderId.value = orderId;

    try {
        await printOrderReceipt(orderId);
    } finally {
        if (printingOrderId.value === orderId) {
            printingOrderId.value = null;
        }
    }
};

onMounted(async () => {
    auth.ensureAuthenticated();
    await loadOrders();
});
</script>

<template>
    <AppLayout>
        <section class="space-y-6">
            <header class="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-slate-900">Orders</h1>
                    <p class="text-sm text-slate-500">
                        Manage new orders, update fulfilment status, and access customer information.
                    </p>
                </div>
                <Link
                    href="/orders/create"
                    class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                    Create order
                </Link>
            </header>

            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <form
                    class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                    @submit.prevent="loadOrders"
                >
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
                        <input
                            v-model.trim="filters.search"
                            type="search"
                            placeholder="Order #, customer phone, city…"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            @keyup.enter="loadOrders"
                        />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                        <select
                            v-model="filters.status"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                            <option
                                v-for="status in statusOptions"
                                :key="status.value"
                                :value="status.value"
                            >
                                {{ status.label }}
                            </option>
                        </select>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery</label>
                        <select
                            v-model="filters.deliveryType"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                            <option
                                v-for="option in deliveryOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</label>
                        <select
                            v-model="filters.paymentMethod"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                            <option
                                v-for="option in paymentOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="flex flex-col gap-2 md:col-span-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Date range</label>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <input
                                v-model="filters.from"
                                type="date"
                                class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                            <input
                                v-model="filters.to"
                                type="date"
                                class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>
                    </div>

                    <div class="flex items-end gap-3 md:col-span-2 xl:col-span-4">
                        <button
                            type="submit"
                            class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            Apply filters
                        </button>
                        <button
                            type="button"
                            class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            @click="
                                filters.search = '';
                                filters.status = 'all';
                                filters.deliveryType = 'all';
                                filters.paymentMethod = 'all';
                                filters.from = '';
                                filters.to = '';
                                loadOrders();
                            "
                        >
                            Reset
                        </button>
                    </div>
                </form>

                <div
                    v-if="error"
                    class="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                >
                    {{ error }}
                </div>

                <div class="mt-6 overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                        <thead>
                            <tr class="text-xs uppercase tracking-wide text-slate-500">
                                <th class="px-4 py-3 font-medium">Order</th>
                                <th class="px-4 py-3 font-medium">Customer</th>
                                <th class="px-4 py-3 font-medium">Items</th>
                                <th class="px-4 py-3 font-medium">Delivery</th>
                                <th class="px-4 py-3 font-medium">Payment</th>
                                <th class="px-4 py-3 font-medium">Total</th>
                                <th class="px-4 py-3 font-medium">Status</th>
                                <th class="px-4 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr
                                v-if="loading"
                                v-for="i in 5"
                                :key="i"
                                class="animate-pulse bg-slate-50/60"
                            >
                                <td colspan="8" class="px-4 py-3">
                                    <div class="h-4 w-full rounded bg-slate-200"></div>
                                </td>
                            </tr>
                            <tr
                                v-else-if="orders.length === 0"
                                class="bg-slate-50/70"
                            >
                                <td colspan="8" class="px-4 py-6 text-center text-sm text-slate-500">
                                    No orders match the selected filters.
                                </td>
                            </tr>
                            <tr
                                v-else
                                v-for="order in orders"
                                :key="order.id"
                                class="transition hover:bg-slate-50"
                            >
                                <td class="px-4 py-4">
                                    <div class="font-semibold text-slate-900">
                                        {{ order.order_number }}
                                    </div>
                                    <div class="text-xs text-slate-500">
                                        {{ formatDate(order.created_at) }}
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <div class="font-medium text-slate-900">
                                        {{ order.customer?.phone_number ?? 'N/A' }}
                                    </div>
                                    <div class="text-xs text-slate-500 capitalize">
                                        {{ order.customer?.city ?? '—' }}
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <ul class="space-y-1 text-xs text-slate-500">
                                        <li v-for="item in order.items" :key="item.id">
                                            <span class="text-slate-900">{{ item.name }}</span>
                                            × {{ item.pivot?.quantity ?? 1 }}
                                        </li>
                                    </ul>
                                </td>
                                <td class="px-4 py-4 capitalize">
                                    {{ order.delivery_type }}
                                </td>
                                <td class="px-4 py-4 capitalize">
                                    {{ order.payment_method }}
                                </td>
                                <td class="px-4 py-4 font-semibold text-slate-900">
                                    {{ formatCurrency(order.total_amount) }}
                                </td>
                                <td class="px-4 py-4">
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
                                </td>
                                <td class="px-4 py-4">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <Link
                                            :href="`/orders/${order.id}/edit`"
                                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                        >
                                            Edit
                                        </Link>
                                        <a
                                            :href="`/api/orders/${order.id}/receipt`"
                                            target="_blank"
                                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                        >
                                            Receipt
                                        </a>
                                        <button
                                            type="button"
                                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                                            :disabled="printingOrderId === order.id"
                                            @click="handlePrint(order.id)"
                                        >
                                            {{ printingOrderId === order.id ? 'Printing…' : 'Print' }}
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                                            :disabled="updatingOrderId === order.id"
                                            @click="updateOrderStatus(order.id, 'completed')"
                                        >
                                            Mark complete
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
                                            :disabled="updatingOrderId === order.id"
                                            @click="updateOrderStatus(order.id, 'cancelled')"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                                            @click="deleteOrder(order.id)"
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
        </section>
    </AppLayout>
</template>
