import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  RefreshCw, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  ArrowUpRight
} from "lucide-react";
import { fetchInventory, fetchOrders, createOrder, cancelOrder } from "../services/api";

export default function OrdersDashboard({ showToast }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [buyingId, setBuyingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, orderData] = await Promise.all([fetchInventory(), fetchOrders()]);
      setProducts(invData);
      setOrders(orderData);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto poll orders every 3s to capture Saga status transition live
    const interval = setInterval(async () => {
      try {
        const orderData = await fetchOrders();
        setOrders(orderData);
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleQtyChange = (productId, qty) => {
    setOrderQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, Number(qty)),
    }));
  };

  const handleBuy = async (product) => {
    const qty = orderQuantities[product.productId] || 1;
    try {
      setBuyingId(product.productId);
      const order = await createOrder({
        productId: product.productId,
        quantity: qty,
        price: Number(product.price) * qty,
      });

      showToast(`Order #${order.data.id} created (PENDING). Saga choreography evaluating stock...`, "info");

      setTimeout(async () => {
        try {
          const [invData, orderData] = await Promise.all([fetchInventory(), fetchOrders()]);
          setProducts(invData);
          setOrders(orderData);
        } catch {}
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBuyingId(null);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm(`Cancel order #${orderId}?`)) return;
    try {
      await cancelOrder(orderId);
      showToast(`Order #${orderId} cancelled. Stock compensation sent via Kafka.`, "success");

      setTimeout(async () => {
        try {
          const [invData, orderData] = await Promise.all([fetchInventory(), fetchOrders()]);
          setProducts(invData);
          setOrders(orderData);
        } catch {}
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-white text-[11px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>CONFIRMED</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 text-[11px] font-mono font-medium animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>PENDING</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded border border-rose-900/80 bg-rose-950/50 text-rose-300 text-[11px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>FAILED (OUT OF STOCK)</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded border border-zinc-800 bg-black text-zinc-500 text-[11px] font-mono">
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-mono text-zinc-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-black text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Order Service</span>
            <span className="font-mono text-xs text-zinc-600">/</span>
            <span className="font-mono text-xs text-zinc-300">Saga Choreography</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
            Marketplace &amp; Order Ledger
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Purchase products provisioned in MongoDB. The Order Service persists the order in PostgreSQL with status <code className="text-white">PENDING</code>, then orchestrates inventory reservation via Kafka.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-300 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync State</span>
        </button>
      </div>

      {/* SECTION 1: MARKETPLACE CATALOG (Buy) */}
      <div className="mt-8">
        {/* Info callout for testing Saga failure */}
        <div className="mb-4 p-3 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              <strong className="text-white">Testing Saga Failure:</strong> Products with <code className="text-rose-400 bg-black px-1.5 py-0.5 rounded">0 in stock</code> will trigger Saga reservation failure and mark the order as <code className="text-rose-400 bg-black px-1.5 py-0.5 rounded">FAILED</code>.
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 hidden sm:inline-block">Order Req ➔ Saga Check ➔ Order Fail</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <h3 className="text-sm font-medium tracking-wide text-white uppercase">
              Available Storefront
            </h3>
            <span className="font-mono text-xs text-zinc-400">[{products.length} products]</span>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">Client: User #1</span>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-950 border border-zinc-900 rounded-xl">
            No products available. Switch to the <strong className="text-white">Inventory Stock</strong> tab to add items!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((product) => {
              const qty = orderQuantities[product.productId] || 1;
              const isOut = product.stock <= 0;
              const isBuying = buyingId === product.productId;

              return (
                <div
                  key={product.productId}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                    isOut
                      ? "border-rose-950/80 bg-zinc-950/90 hover:border-rose-900"
                      : "border-zinc-850 bg-zinc-950/80 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                        {product.productId}
                      </span>
                      {isOut ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-900/60 text-rose-300">
                          0 IN STOCK (FAIL TEST)
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-400">
                          {product.stock} in stock
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-medium text-white mb-1">
                      {product.name}
                    </h4>

                    <div className="text-lg font-light text-white font-mono my-2">
                      ${Number(product.price).toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-900 flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono text-zinc-500">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        max={10}
                        value={qty}
                        onChange={(e) => handleQtyChange(product.productId, e.target.value)}
                        className="w-14 px-2 py-1 bg-black border border-zinc-800 rounded text-center text-xs text-white font-mono focus:outline-none focus:border-zinc-600"
                      />
                    </div>

                    <button
                      onClick={() => handleBuy(product)}
                      disabled={isBuying}
                      className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors ${
                        isOut
                          ? "bg-zinc-900 text-rose-200 border border-rose-900/60 hover:bg-rose-950/40"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {isBuying ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{isOut ? "Buy 0-Stock (Test Saga Fail)" : "Buy Product"}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: ORDER LEDGER & SAGA TRANSACTION TRACKING */}
      <div className="mt-14 pt-8 border-t border-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <h3 className="text-sm font-medium tracking-wide text-white uppercase">
              Distributed Orders Ledger (PostgreSQL)
            </h3>
            <span className="font-mono text-xs text-zinc-400">[{orders.length} orders]</span>
          </div>

          <span className="font-mono text-[11px] text-zinc-400 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Saga Choreography active</span>
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-950 border border-zinc-900 rounded-xl">
            No orders placed yet. Purchase an item above to initiate a Saga transaction!
          </div>
        ) : (
          <div className="overflow-hidden border border-zinc-800 rounded-xl bg-zinc-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-black font-mono text-zinc-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Saga Verification</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Compensation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      #{o.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      User #{o.user_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-200">
                      {o.product_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {o.quantity}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      ${Number(o.price).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {o.status !== "CANCELLED" && o.status !== "FAILED" ? (
                        <button
                          onClick={() => handleCancel(o.id)}
                          className="px-2.5 py-1 text-[11px] font-mono border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 rounded transition-colors"
                        >
                          Cancel Order
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-600">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
