<script setup>
import { computed, onMounted, ref } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const page = usePage();
const mobileNavOpen = ref(false);

const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Orders', href: '/orders' },
    { name: 'New Order', href: '/orders/create' },
    { name: 'Items', href: '/items' },
    { name: 'Categories', href: '/categories' },
    { name: 'Sales', href: '/sales' },
];

const currentPath = computed(() => page.url.split('?')[0]);

const isActive = (href) => currentPath.value === href;

const toggleMobileNav = () => {
    mobileNavOpen.value = !mobileNavOpen.value;
};

const handleLogout = () => {
    auth.logout();
};

onMounted(() => {
    auth.ensureAuthenticated();

    router.on('finish', () => {
        mobileNavOpen.value = false;
    });
});
</script>

<template>
    <div class="min-h-screen bg-slate-100">
        <header class="border-b border-slate-200 bg-white shadow-sm">
            <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center gap-4">
                    <button
                        type="button"
                        class="rounded-lg border border-transparent p-2 text-slate-500 transition hover:border-slate-200 hover:text-slate-700 lg:hidden"
                        @click="toggleMobileNav"
                        aria-label="Toggle navigation"
                    >
                        <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M3.75 5.25h16.5M3.75 12h16.5M3.75 18.75h16.5" />
                        </svg>
                    </button>
                    <Link href="/dashboard" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <span class="inline-flex size-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold uppercase text-white">R</span>
                        <span>Raidhaan Admin</span>
                    </Link>
                </div>

                <nav class="hidden items-center gap-1 lg:flex">
                    <Link
                        v-for="item in navigation"
                        :key="item.name"
                        :href="item.href"
                        class="rounded-lg px-3 py-2 text-sm font-medium transition"
                        :class="[
                            isActive(item.href)
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        ]"
                    >
                        {{ item.name }}
                    </Link>
                </nav>

                <div class="flex items-center gap-3">
                    <div class="hidden flex-col text-right lg:flex">
                        <span class="text-sm font-semibold text-slate-900">
                            {{ auth.state.user?.name ?? 'Unknown User' }}
                        </span>
                        <span class="text-xs text-slate-500">
                            {{ auth.state.user?.email }}
                        </span>
                    </div>
                    <button
                        type="button"
                        class="rounded-lg border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        @click="handleLogout"
                    >
                        Sign out
                    </button>
                </div>
            </div>

            <div
                v-if="mobileNavOpen"
                class="border-t border-slate-200 bg-white shadow-inner lg:hidden"
            >
                <nav class="flex flex-col px-4 py-3">
                    <Link
                        v-for="item in navigation"
                        :key="item.name"
                        :href="item.href"
                        class="rounded-lg px-3 py-2 text-sm font-semibold transition"
                        :class="[
                            isActive(item.href)
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        ]"
                    >
                        {{ item.name }}
                    </Link>
                </nav>
            </div>
        </header>

        <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <slot />
        </main>
    </div>
</template>
