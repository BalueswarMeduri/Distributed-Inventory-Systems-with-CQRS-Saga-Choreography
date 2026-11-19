import React from "react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-900 bg-black text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-white tracking-tight">ORBIT INVENTORY</span>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">[CQRS / SAGA]</span>
            </div>
            <p className="text-xs text-zinc-500 font-normal max-w-md">
              Node.js, PostgreSQL (Write Store), MongoDB Atlas (Read Store), and Apache Kafka in KRaft mode.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-zinc-400">
            <span>Order Service :4000</span>
            <span className="text-zinc-700">•</span>
            <span>Inventory Service :4001</span>
            <span className="text-zinc-700">•</span>
            <span>Kafka :9092</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900/60 flex items-center justify-between text-[11px] font-mono text-zinc-600">
          <p>© {new Date().getFullYear()} Monochromatic Distributed Architecture.</p>
          <p>Strict CQRS / Saga Choreography</p>
        </div>
      </div>
    </footer>
  );
}
