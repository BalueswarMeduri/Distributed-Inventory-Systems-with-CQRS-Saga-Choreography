import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import InventoryDashboard from "./components/InventoryDashboard";
import OrdersDashboard from "./components/OrdersDashboard";
import Footer from "./components/Footer";
import { checkServicesHealth } from "./services/api";
import { Check, AlertCircle, Info, X } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [health, setHealth] = useState({ orderService: false, inventoryService: false });
  const [toast, setToast] = useState(null);

  // Poll service health every 5 seconds
  useEffect(() => {
    const updateHealth = async () => {
      const h = await checkServicesHealth();
      setHealth(h);
    };

    updateHealth();
    const interval = setInterval(updateHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black">
      {/* Premium Monochromatic Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in duration-200">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
              {toast.type === "error" ? "!" : "✓"}
            </div>
            <div className="flex-1 text-xs font-mono leading-relaxed text-zinc-300">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} health={health} />

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === "home" && <Hero setActiveTab={setActiveTab} />}
        {activeTab === "inventory" && <InventoryDashboard showToast={showToast} />}
        {activeTab === "orders" && <OrdersDashboard showToast={showToast} />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
