import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Trash2, Box, Layers, Check, Search, ChevronRight } from "lucide-react";
import { fetchInventory, addProduct, deleteProduct } from "../services/api";
import { PRESET_CATEGORIES, PRESET_PRODUCTS } from "../data/presetProducts";

export default function InventoryDashboard({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [addingId, setAddingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom Form State
  const [customForm, setCustomForm] = useState({
    productId: "",
    name: "",
    stock: 10,
    price: 49.99,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchInventory();
      setProducts(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Quick-Add Preset with '+' button
  const handleQuickAdd = async (item) => {
    try {
      setAddingId(item.productId);
      await addProduct({
        productId: item.productId,
        name: item.name,
        stock: item.stock,
        price: item.price,
      });

      showToast(`+ Added '${item.name}' (${item.stock} units) to PostgreSQL & MongoDB`, "success");

      // Brief delay for Kafka sync to complete, then reload MongoDB store
      setTimeout(() => {
        loadProducts();
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAddingId(null);
    }
  };

  // Custom Form Submit
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customForm.productId || !customForm.name) {
      showToast("SKU and Name are required", "error");
      return;
    }

    try {
      setAddingId("custom");
      await addProduct({
        productId: customForm.productId.trim().toUpperCase(),
        name: customForm.name.trim(),
        stock: Number(customForm.stock),
        price: Number(customForm.price),
      });

      showToast(`+ Added custom item '${customForm.productId}' to inventory`, "success");
      setCustomForm({ productId: "", name: "", stock: 10, price: 49.99 });
      setShowCustomForm(false);

      setTimeout(() => {
        loadProducts();
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAddingId(null);
    }
  };

  // Delete product
  const handleDelete = async (productId) => {
    if (!window.confirm(`Delete product ${productId} from inventory?`)) return;
    try {
      await deleteProduct(productId);
      showToast(`Deleted product '${productId}' from PostgreSQL & MongoDB`, "info");
      setTimeout(() => {
        loadProducts();
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Filter preset items by category and search
  const filteredPresets = PRESET_PRODUCTS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.productId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-black text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Inventory Engine</span>
            <span className="font-mono text-xs text-zinc-600">/</span>
            <span className="font-mono text-xs text-zinc-300">CQRS Write Pipeline</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
            Stock Catalog &amp; Provisioning
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Select items from Electronics, Clothing, or Accessories below and click <strong className="text-white">+</strong> to add stock directly into PostgreSQL. Kafka automatically syncs the MongoDB read store.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCustomForm ? "Close Custom Form" : "Custom Item"}</span>
          </button>

          <button
            onClick={loadProducts}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Read Store</span>
          </button>
        </div>
      </div>

      {/* Optional Custom Form Drawer */}
      {showCustomForm && (
        <div className="mt-6 p-6 rounded-xl border border-zinc-800 bg-zinc-950/80 mb-6">
          <h3 className="text-sm font-medium text-white mb-4">Add Custom Product to PostgreSQL</h3>
          <form onSubmit={handleCustomSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">SKU / ID</label>
              <input
                type="text"
                placeholder="e.g. ELEC-PRO-10"
                value={customForm.productId}
                onChange={(e) => setCustomForm({ ...customForm, productId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-md text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Product Title</label>
              <input
                type="text"
                placeholder="Product name"
                value={customForm.name}
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-md text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Units (Stock)</label>
              <input
                type="number"
                min="0"
                value={customForm.stock}
                onChange={(e) => setCustomForm({ ...customForm, stock: e.target.value })}
                required
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Unit Price ($)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customForm.price}
                  onChange={(e) => setCustomForm({ ...customForm, price: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={addingId === "custom"}
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-md hover:bg-zinc-200 transition-colors shrink-0"
                >
                  {addingId === "custom" ? "..." : "+ Add"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 1: QUICK-ADD PRESET CATALOG (Electronics, Clothing, Accessories) */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-900 hover:border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Preset Items Grid with Prominent '+' Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPresets.map((item) => {
            const isAdding = addingId === item.productId;
            // Check if already in MongoDB
            const existing = products.find((p) => p.productId === item.productId);

            return (
              <div
                key={item.productId}
                className="group p-4 rounded-xl border border-zinc-850 bg-zinc-950/70 hover:border-zinc-700 transition-all flex items-center justify-between"
              >
                <div className="pr-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                      {item.productId}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {item.tag}
                    </span>
                  </div>

                  <h4 className="text-xs font-medium text-white truncate group-hover:text-zinc-200">
                    {item.name}
                  </h4>

                  <div className="flex items-center space-x-3 mt-1.5 font-mono text-[11px]">
                    <span className="text-white font-semibold">${item.price.toFixed(2)}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{item.stock} units</span>
                    {existing && (
                      <span className="text-[10px] text-zinc-300 font-mono">
                        (Active: {existing.stock})
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Add '+' Button */}
                <button
                  onClick={() => handleQuickAdd(item)}
                  disabled={isAdding}
                  title="Click to add item to PostgreSQL & sync to MongoDB"
                  className="w-10 h-10 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isAdding ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Plus className="w-5 h-5 text-black" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: MONGODB READ CATALOG (CQRS Query Store) */}
      <div className="mt-14 pt-8 border-t border-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <h3 className="text-sm font-medium tracking-wide text-white uppercase">
              Current Live Inventory (MongoDB Read Model)
            </h3>
            <span className="font-mono text-xs text-zinc-400">[{products.length} records]</span>
          </div>

          <span className="font-mono text-[11px] text-zinc-400">
            Auto-synced via Kafka: <code className="text-zinc-300">inventory-DBupdate-events</code>
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-500 bg-zinc-950 border border-zinc-900 rounded-xl">
            QUERYING MONGODB READ STORE...
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400 bg-zinc-950 border border-zinc-900 rounded-xl">
            No items present in MongoDB yet. Click the <strong className="text-white">+</strong> button on any item above to provision stock!
          </div>
        ) : (
          <div className="overflow-hidden border border-zinc-800 rounded-xl bg-zinc-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-black font-mono text-zinc-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">SKU / ID</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {products.map((p) => (
                  <tr key={p.productId} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {p.productId}
                    </td>
                    <td className="py-3 px-4 text-zinc-200">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {p.stock > 0 ? (
                        <span className="text-white font-medium">{p.stock} units</span>
                      ) : (
                        <span className="text-zinc-400 line-through">0 (Sold Out)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      ${Number(p.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(p.productId)}
                        className="px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="Delete from PostgreSQL & sync to MongoDB"
                      >
                        Delete
                      </button>
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
