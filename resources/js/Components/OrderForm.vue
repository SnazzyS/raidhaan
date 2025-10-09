<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
    mode: {
        type: String,
        default: 'create',
    },
    initialOrder: {
        type: Object,
        default: () => null,
    },
    submitting: {
        type: Boolean,
        default: false,
    },
    error: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['submit']);

const customerDefaults = {
    phone_number: props.initialOrder?.customer?.phone_number ?? '',
    address: props.initialOrder?.customer?.address ?? '',
    city: props.initialOrder?.customer?.city ?? '',
};

const orderDefaults = {
    status: props.initialOrder?.status ?? 'pending',
    delivery_type: props.initialOrder?.delivery_type ?? 'delivery',
    payment_method: props.initialOrder?.payment_method ?? 'cash',
    transfer_reference_number: props.initialOrder?.transfer_reference_number ?? '',
};

const loadingItems = ref(false);
const availableItems = ref([]);

const form = reactive({
    ...customerDefaults,
    ...orderDefaults,
    items:
        props.initialOrder?.items?.length
            ? props.initialOrder.items.map((item) => ({
                  item_id: item.id,
                  quantity: item.pivot?.quantity ?? 1,
              }))
            : [
                  {
                      item_id: '',
                      quantity: 1,
                  },
              ],
});

const cityOptions = [
    'male',
    'hulhumale phase 1',
    'hulhumale phase 2',
];

const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

const deliveryOptions = [
    { label: 'Delivery', value: 'delivery' },
    { label: 'Pickup', value: 'pickup' },
];

const paymentOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Card', value: 'card' },
    { label: 'Transfer', value: 'transfer' },
];

const loadItems = async () => {
    loadingItems.value = true;

    try {
        const { data } = await axios.get('/items');
        availableItems.value = data ?? [];
    } finally {
        loadingItems.value = false;
    }
};

const addLineItem = () => {
    form.items.push({
        item_id: '',
        quantity: 1,
    });
};

const removeLineItem = (index) => {
    form.items.splice(index, 1);

    if (form.items.length === 0) {
        addLineItem();
    }
};

const orderTotal = computed(() =>
    form.items.reduce((total, line) => {
        const item = availableItems.value.find((entry) => entry.id === Number(line.item_id));
        return total + (item ? Number(item.price) * Number(line.quantity ?? 1) : 0);
    }, 0),
);

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'MVR',
        minimumFractionDigits: 2,
    }).format(amount ?? 0);

const buildPayload = () => ({
    phone_number: form.phone_number,
    address: form.address,
    city: form.city,
    order: {
        status: form.status,
        delivery_type: form.delivery_type,
        payment_method: form.payment_method,
        transfer_reference_number:
            form.payment_method === 'transfer' ? form.transfer_reference_number : null,
        items: form.items
            .filter((line) => line.item_id)
            .map((line) => ({
                item_id: Number(line.item_id),
                quantity: Number(line.quantity ?? 1),
            })),
    },
});

const handleSubmit = () => {
    emit('submit', buildPayload());
};

watch(
    () => form.payment_method,
    (newValue) => {
        if (newValue !== 'transfer') {
            form.transfer_reference_number = '';
        }
    },
);

onMounted(async () => {
    await loadItems();
});
</script>

<template>
    <form class="space-y-8" @submit.prevent="handleSubmit">
        <section class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <header class="mb-4">
                    <h2 class="text-lg font-semibold text-slate-900">Customer details</h2>
                    <p class="text-sm text-slate-500">
                        Capture delivery information for fulfilment and receipts.
                    </p>
                </header>

                <div class="space-y-4">
                    <div>
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Phone number
                        </label>
                        <input
                            v-model="form.phone_number"
                            type="tel"
                            required
                            minlength="7"
                            maxlength="7"
                            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="7-digit number"
                        />
                    </div>

                    <div>
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Address
                        </label>
                        <textarea
                            v-model="form.address"
                            rows="3"
                            required
                            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="Delivery address"
                        ></textarea>
                    </div>

                    <div>
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            City
                        </label>
                        <select
                            v-model="form.city"
                            required
                            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 capitalize"
                        >
                            <option value="" disabled>Select</option>
                            <option
                                v-for="city in cityOptions"
                                :key="city"
                                :value="city"
                                class="capitalize"
                            >
                                {{ city }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-6">
                <header class="mb-4">
                    <h2 class="text-lg font-semibold text-slate-900">Order metadata</h2>
                    <p class="text-sm text-slate-500">
                        Set fulfilment preferences and payment information.
                    </p>
                </header>

                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                        </label>
                        <select
                            v-model="form.status"
                            required
                            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 capitalize"
                        >
                            <option
                                v-for="status in statusOptions"
                                :key="status.value"
                                :value="status.value"
                                class="capitalize"
                            >
                                {{ status.label }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Delivery type
                        </label>
                        <select
                            v-model="form.delivery_type"
                            required
                            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 capitalize"
                        >
                            <option
                                v-for="option in deliveryOptions"
                                :key="option.value"
                                :value="option.value"
                                class="capitalize"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="sm:col-span-2">
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Payment method
                        </label>
                        <select
                            v-model="form.payment_method"
                            required
                            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 capitalize"
                        >
                            <option
                                v-for="option in paymentOptions"
                                :key="option.value"
                                :value="option.value"
                                class="capitalize"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div
                        v-if="form.payment_method === 'transfer'"
                        class="sm:col-span-2"
                    >
                        <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Transfer reference
                        </label>
                        <input
                            v-model="form.transfer_reference_number"
                            type="text"
                            required
                            placeholder="Transfer reference number"
                            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>
                </div>
            </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6">
            <header class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="text-lg font-semibold text-slate-900">Order items</h2>
                    <p class="text-sm text-slate-500">
                        Add each item and quantity to calculate the total automatically.
                    </p>
                </div>
                <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                    @click="addLineItem"
                >
                    Add item
                </button>
            </header>

            <div class="space-y-4">
                <div
                    v-for="(line, index) in form.items"
                    :key="index"
                    class="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >
                    <div class="grid gap-4 sm:grid-cols-5 sm:items-center">
                        <div class="sm:col-span-3">
                            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Item
                            </label>
                            <select
                                v-model="line.item_id"
                                required
                                :disabled="loadingItems"
                                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                                <option value="" disabled>
                                    {{ loadingItems ? 'Loading items…' : 'Select menu item' }}
                                </option>
                                <option
                                    v-for="item in availableItems"
                                    :key="item.id"
                                    :value="item.id"
                                >
                                    {{ item.name }} — {{ Number(item.price).toFixed(2) }} MVR
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Quantity
                            </label>
                            <input
                                v-model.number="line.quantity"
                                type="number"
                                min="1"
                                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>
                        <div class="flex justify-end">
                            <button
                                type="button"
                                class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                                @click="removeLineItem(index)"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer class="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-slate-500">
                    Items must exist in the items catalogue before they can be added to an order.
                </p>
                <div class="text-right">
                    <p class="text-xs uppercase tracking-wide text-slate-500">Estimated total</p>
                    <p class="text-2xl font-bold text-slate-900">
                        {{ formatCurrency(orderTotal) }}
                    </p>
                </div>
            </footer>
        </section>

        <div
            v-if="error"
            class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
        >
            {{ error }}
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
                <span>{{ submitting ? 'Saving…' : mode === 'create' ? 'Create order' : 'Update order' }}</span>
            </button>
        </div>
    </form>
</template>
