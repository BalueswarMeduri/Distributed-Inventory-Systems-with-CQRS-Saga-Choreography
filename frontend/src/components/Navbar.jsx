import React from "react";
import { Terminal, Box, ShoppingCart, Server } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, health }) {
  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - High-End Minimalist */}
          <div 
            onClick={() => setActiveTab("home")} 
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-mono font-bold text-sm tracking-tighter">
              OS
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base text-white tracking-tight">ORBIT</span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                / CQRS • SAGA
              </span>
            </div>
          </div>

          {/* Navigation - Minimal Monochromatic Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                activeTab === "home"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                activeTab === "inventory"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Inventory Stock</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                activeTab === "orders"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Orders Ledger</span>
            </button>
          </nav>

          {/* Server Telemetry Status */}
          <div className="hidden lg:flex items-center space-x-3 font-mono text-[11px]">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${health.orderService ? "bg-white" : "bg-red-500"}`} />
              <span>Order :4000</span>
            </div>
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${health.inventoryService ? "bg-white" : "bg-red-500"}`} />
              <span>Inventory :4001</span>
            </div>
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Kafka :9092</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
