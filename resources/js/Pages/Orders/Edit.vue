<script setup>
import { onMounted, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout.vue';
import OrderForm from '../../Components/OrderForm.vue';
import { useAuthStore } from '../../stores/auth.js';

const props = defineProps({
    orderId: {
        type: Number,
        required: true,
    },
});

const auth = useAuthStore();

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const order = ref(null);

const loadOrder = async () => {
    try {
        const { data } = await axios.get(`/orders/${props.orderId}`);
        order.value = data;
        error.value = '';
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ?? 'Unable to load this order.';
    } finally {
        loading.value = false;
    }
};

const handleSubmit = async (payload) => {
    submitting.value = true;
    error.value = '';

    try {
        await axios.put(`/orders/${props.orderId}`, payload);
        router.visit('/orders');
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            requestError.response?.data?.errors?.order?.[0] ??
            'Failed to update the order.';
    } finally {
        submitting.value = false;
    }
};

onMounted(async () => {
    auth.ensureAuthenticated();
    await loadOrder();
});
</script>

<template>
    <AppLayout>
        <section class="space-y-6">
            <header class="border-b border-slate-200 pb-4">
                <h1 class="text-2xl font-semibold text-slate-900">Update order</h1>
                <p class="text-sm text-slate-500">
                    Adjust the order items, fulfilment details, or mark completion.
                </p>
            </header>

            <div v-if="loading" class="space-y-4">
                <div class="h-10 w-1/2 animate-pulse rounded-xl bg-slate-100"></div>
                <div class="h-48 animate-pulse rounded-2xl bg-slate-100"></div>
                <div class="h-48 animate-pulse rounded-2xl bg-slate-100"></div>
            </div>

            <div
                v-else-if="error && !order"
                class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-600"
            >
                {{ error }}
                <button
                    type="button"
                    class="mt-3 inline-flex items-center rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
                    @click="loadOrder"
                >
                    Retry
                </button>
            </div>

            <OrderForm
                v-else
                mode="edit"
                :initial-order="order"
                :submitting="submitting"
                :error="error"
                @submit="handleSubmit"
            />
        </section>
    </AppLayout>
</template>
