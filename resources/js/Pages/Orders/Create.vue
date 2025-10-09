<script setup>
import { onMounted, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout.vue';
import OrderForm from '../../Components/OrderForm.vue';
import { useAuthStore } from '../../stores/auth.js';
import { printOrderReceipt } from '../../services/printService.js';

const auth = useAuthStore();

const submitting = ref(false);
const error = ref('');

const handleSubmit = async (payload) => {
    submitting.value = true;
    error.value = '';

    try {
        const { data } = await axios.post('/orders', payload);

        if (data?.order?.id) {
            await printOrderReceipt(data.order.id);
        }

        router.visit('/orders');
    } catch (requestError) {
        error.value =
            requestError.response?.data?.message ??
            requestError.response?.data?.errors?.phone_number?.[0] ??
            requestError.response?.data?.errors?.order?.[0] ??
            'Failed to create the order.';
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    auth.ensureAuthenticated();
});
</script>

<template>
    <AppLayout>
        <section class="space-y-6">
            <header class="border-b border-slate-200 pb-4">
                <h1 class="text-2xl font-semibold text-slate-900">Create order</h1>
                <p class="text-sm text-slate-500">
                    Generate a new order with customer and delivery details in one place.
                </p>
            </header>

            <OrderForm
                mode="create"
                :submitting="submitting"
                :error="error"
                @submit="handleSubmit"
            />
        </section>
    </AppLayout>
</template>
