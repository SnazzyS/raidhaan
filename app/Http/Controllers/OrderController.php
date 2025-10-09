<?php

namespace App\Http\Controllers;

use App\Actions\Orders\OrderNumberGenerator;
use App\Models\Item;
use App\Models\Order;
use App\Models\Customer;
use Illuminate\Http\Request;
use App\Http\Requests\OrderRequest;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Support\Carbon;

class OrderController extends Controller
{

    public function index(Request $request)
    {

        $orders = QueryBuilder::for(Order::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('delivery_type'),
                AllowedFilter::exact('payment_method'),
            ])
            ->with(['customer', 'items'])
            ->when($request->filled('from') && $request->filled('to'), function ($query) use ($request) {
                $from = Carbon::parse($request->input('from'))->startOfDay();
                $to = Carbon::parse($request->input('to'))->endOfDay();

                $query->whereBetween('created_at', [$from, $to]);
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');

                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($customerQuery) use ($search) {
                            $customerQuery->where('phone_number', 'like', "%{$search}%")
                                ->orWhere('city', 'like', "%{$search}%");
                        })
                        ->orWhereHas('items', function ($itemQuery) use ($search) {
                            $itemQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->get();



        return response()->json($orders);

    }

 
    public function store(OrderRequest $request)
    {
        $validatedData = $request->validated();
        
        $customer = Customer::updateOrCreate(
            ['phone_number' => $validatedData['phone_number']],
            [
                'address' => $validatedData['address'],
                'city' => $validatedData['city'],
            ]
        );

        $totalAmount = 0;

        foreach ($validatedData['order']['items'] as $item) {
            $itemModel = Item::find($item['item_id']);
            $totalAmount += $itemModel['price'] * $item['quantity'];
        }

        $order = new Order();
        $order->customer_id = $customer->id;
        $order->status = $validatedData['order']['status'];
        $order->delivery_type = $validatedData['order']['delivery_type'];
        $order->payment_method = $validatedData['order']['payment_method'];

        $order->order_number = (new OrderNumberGenerator())->execute();

        if (isset($validatedData['order']['transfer_reference_number'])) {
            $order->transfer_reference_number = $validatedData['order']['transfer_reference_number'];
        }

        
        $order->total_amount = $totalAmount;
        $order->save();


        foreach ($validatedData['order']['items'] as $item) {
            $itemModel = Item::findOrFail($item['item_id']);
            $order->items()->attach($itemModel->id, [
                'quantity' => $item['quantity'],
                'price' => $itemModel->price,
            ]);
        }
        
        return response()->json([
            'message' => 'Order created successfully',
            'order' => $order,
        ], 201);
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'items']);
        return response()->json($order);
    }

    public function update(OrderRequest $request, Order $order)
    {
        $validatedData = $request->validated();
    
        $customer = Customer::updateOrCreate(
            ['phone_number' => $validatedData['phone_number']],
            [
                'address' => $validatedData['address'],
                'city' => $validatedData['city'],
            ]
        );

        $totalAmount = 0;

        foreach ($validatedData['order']['items'] as $item) {
            $itemModel = Item::find($item['item_id']);
            $totalAmount += $itemModel['price'] * $item['quantity'];
        }

        $order->customer_id = $customer->id;
        
        $order->status = $validatedData['order']['status'];
    
        $order->delivery_type = $validatedData['order']['delivery_type'] === 'pickup' ? 'pickup' : $validatedData['order']['delivery_type'];
    
        $order->payment_method = $validatedData['order']['payment_method'];
    
        if (isset($validatedData['order']['transfer_reference_number'])) {
            $order->transfer_reference_number = $validatedData['order']['transfer_reference_number'];
        }
    
        $order->total_amount = $totalAmount;

   


        $order->save();

        $order->items()->detach();
    
        foreach ($validatedData['order']['items'] as $item) {
            $itemModel = Item::findOrFail($item['item_id']);
            $order->items()->attach($itemModel->id, [
                'quantity' => $item['quantity'],
                'price' => $itemModel->price,
            ]);
        }
    
        return response()->json([
            'message' => 'Order updated successfully',
            'order' => $order,
        ]);
    }

    public function destroy(Order $order)
    {
        $order->items()->detach();
        $order->delete();

        return response()->json([
            'message' => 'Order deleted successfully',
        ]);
    }

    public function generateReceipt(Order $order)
    {
        $order->load(['customer', 'items']);

        return response()
            ->view('orders.receipt', ['order' => $order])
            ->header('Content-Type', 'text/html');
    }

    public function cancelledOrders(Request $request)
    {
        $query = Order::query()->where('status', 'cancelled');
        
        if ($request->filled('from') && $request->filled('to')) {
            $from = Carbon::parse($request->from)->startOfDay();
            $to = Carbon::parse($request->to)->endOfDay();
            $query->whereBetween('created_at', [$from, $to]);
        } else {
            $query->whereDate('created_at', today());
        }
        
        $cancelledOrders = $query->get();
        
        return response()->json($cancelledOrders);
    }
}
