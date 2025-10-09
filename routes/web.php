<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CategoryController;

Route::get('/', function () {
    if (auth()->check()) {
        return Inertia::render('Dashboard/Overview');
    }

    return Inertia::render('Auth/Login');
})->name('login');

Route::get('/dashboard', fn () => Inertia::render('Dashboard/Overview'))
    ->name('dashboard');

Route::get('/categories', fn () => Inertia::render('Categories/Index'))
    ->name('categories.index');

Route::get('/items', fn () => Inertia::render('Items/Index'))
    ->name('items.index');

Route::get('/orders', fn () => Inertia::render('Orders/Index'))
    ->name('orders.index');

Route::get('/orders/create', fn () => Inertia::render('Orders/Create'))
    ->name('orders.create');

Route::get('/orders/{order}/edit', fn ($order) => Inertia::render('Orders/Edit', [
    'orderId' => (int) $order,
]))->name('orders.edit');

Route::get('/sales', fn () => Inertia::render('Sales/Index'))
    ->name('sales.index');

Route::prefix('api')->middleware('api')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('categories', [CategoryController::class, 'index']);
        Route::post('categories', [CategoryController::class, 'store']);
        Route::put('categories/{category}', [CategoryController::class, 'update']);
        Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

        Route::get('items', [ItemController::class, 'index']);
        Route::post('items', [ItemController::class, 'store']);
        Route::put('items/{item}', [ItemController::class, 'update']);
        Route::delete('items/{item}', [ItemController::class, 'destroy']);

        Route::get('orders/cancelled', [OrderController::class, 'cancelledOrders']);

        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::put('orders/{order}', [OrderController::class, 'update']);
        Route::delete('orders/{order}', [OrderController::class, 'destroy']);

        Route::get('sales', [SaleController::class, 'index']);
    });

    Route::get('orders/{order}/receipt', [OrderController::class, 'generateReceipt']);
});
