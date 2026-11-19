import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, Pause, Layers, Database, Cpu, Check, Activity, ShieldCheck, Zap } from "lucide-react";

export default function Hero({ setActiveTab }) {
  const [activeFlow, setActiveFlow] = useState("all");
  const [isSimulating, setIsSimulating] = useState(true);

  // Auto cycle active flow highlight every 4.5 seconds when simulating
  useEffect(() => {
    if (!isSimulating) return;
    const flows = ["order-req", "db-sync", "order-fail", "all"];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % flows.length;
      setActiveFlow(flows[index]);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="relative pt-16 pb-24 bg-black text-white border-b border-zinc-900 select-none overflow-hidden">
      {/* Subtle background matrix grid */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none" 
        style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: `24px 24px` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* TOP SECTION: PROFESSIONAL EDITORIAL HEADER, NARRATIVE & SPECS           */}
        {/* ========================================================================= */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* Engineering Pill */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/80 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-300 tracking-wider uppercase">
              Distributed Systems Blueprint / v1.0
            </span>
          </div>

          {/* High-End Clean Headline */}
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white leading-[1.12]">
            Asynchronous Event Choreography &amp; <br />
            <span className="font-semibold text-white">CQRS Data Synchronization</span>
          </h1>

          {/* Technical Narrative */}
          <p className="mt-6 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Architected for zero-lock concurrency and high-throughput reliability. Decouples write-intensive inventory mutations in <strong className="text-white font-medium">PostgreSQL</strong> from low-latency query projections in <strong className="text-white font-medium">MongoDB</strong> via <strong className="text-white font-medium">Apache Kafka</strong>, while coordinating distributed multi-service transactions with <strong className="text-white font-medium">Saga Choreography</strong>.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab("inventory")}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <span>Provision Inventory Stock</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-xs hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <span>Open Orders &amp; Saga Ledger</span>
            </button>
          </div>

          {/* Architecture Spec Highlights Strip */}
          <div className="mt-12 pt-8 border-t border-zinc-900/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left font-mono">
            <div className="p-3 rounded-lg border border-zinc-900 bg-zinc-950/40">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Write Database</span>
              <span className="text-xs text-white font-medium">Neon PostgreSQL</span>
            </div>
            <div className="p-3 rounded-lg border border-zinc-900 bg-zinc-950/40">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Read Database</span>
              <span className="text-xs text-white font-medium">MongoDB Atlas</span>
            </div>
            <div className="p-3 rounded-lg border border-zinc-900 bg-zinc-950/40">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Event Broker</span>
              <span className="text-xs text-white font-medium">Apache Kafka (KRaft)</span>
            </div>
            <div className="p-3 rounded-lg border border-zinc-900 bg-zinc-950/40">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Transactions</span>
              <span className="text-xs text-white font-medium">Zero-Lock Saga</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BELOW: ANIMATED ARCHITECTURE CANVAS (Exact Reproduction of the Diagram)  */}
        {/* ========================================================================= */}
        <div className="relative rounded-2xl border border-zinc-850 bg-black p-5 sm:p-8 shadow-2xl">
          
          {/* Canvas Toolbar & Flow Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-900 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Distributed Inventory Systems with CQRS, Saga Choreography
                </h3>
                <p className="font-mono text-[11px] text-zinc-500">
                  Active Simulation: <span className="text-zinc-300 uppercase">{activeFlow === "all" ? "Complete End-to-End Choreography" : activeFlow}</span>
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850 text-[11px] font-mono">
                <button
                  onClick={() => { setActiveFlow("all"); setIsSimulating(false); }}
                  className={`px-3 py-1 rounded transition-colors ${activeFlow === "all" ? "bg-white text-black font-semibold shadow-sm" : "text-zinc-400 hover:text-white"}`}
                >
                  All Flows
                </button>
                <button
                  onClick={() => { setActiveFlow("order-req"); setIsSimulating(false); }}
                  className={`px-3 py-1 rounded transition-colors ${activeFlow === "order-req" ? "bg-white text-black font-semibold shadow-sm" : "text-zinc-400 hover:text-white"}`}
                >
                  Order Req
                </button>
                <button
                  onClick={() => { setActiveFlow("db-sync"); setIsSimulating(false); }}
                  className={`px-3 py-1 rounded transition-colors ${activeFlow === "db-sync" ? "bg-white text-black font-semibold shadow-sm" : "text-zinc-400 hover:text-white"}`}
                >
                  CQRS Sync
                </button>
                <button
                  onClick={() => { setActiveFlow("order-fail"); setIsSimulating(false); }}
                  className={`px-3 py-1 rounded transition-colors ${activeFlow === "order-fail" ? "bg-white text-black font-semibold shadow-sm" : "text-zinc-400 hover:text-white"}`}
                >
                  Order Fail
                </button>
              </div>

              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition-colors"
                title={isSimulating ? "Pause Simulator" : "Auto Simulate"}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="w-full overflow-x-auto pt-6">
            <svg
              viewBox="0 0 1000 500"
              className="w-full min-w-[760px] max-w-full h-auto"
              style={{ maxHeight: "580px" }}
            >
              <defs>
                {/* SVG Arrowhead Marker */}
                <marker
                  id="arrow-white"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#ffffff" />
                </marker>
              </defs>

              {/* Outer Diagram Enclosure Border */}
              <rect
                x="15"
                y="15"
                width="970"
                height="470"
                rx="20"
                fill="none"
                stroke="#27272a"
                strokeWidth="1.5"
              />

              {/* =================================================================== */}
              {/* 1. ORDER SERVICE SECTION (Left Box) */}
              {/* =================================================================== */}

              {/* PostgreSQL Icon & "Database" Label */}
              <g transform="translate(85, 55)">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.41 3.12 7.23L4 22l3.42-.92C8.75 21.64 10.33 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text x="32" y="16" fill="#ffffff" fontSize="15" fontWeight="500" fontFamily="sans-serif">
                  Database
                </text>
              </g>

              {/* Order Service Box */}
              <rect
                x="85"
                y="95"
                width="145"
                height="115"
                rx="14"
                fill="#000000"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text x="157" y="145" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                Order
              </text>
              <text x="157" y="170" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                Service
              </text>

              {/* Bullet Points below Order Service */}
              <g transform="translate(100, 240)" fill="#d4d4d8" fontSize="13" fontFamily="sans-serif">
                <text x="0" y="0">Create order</text>
                <text x="0" y="20">Cancel order</text>
                <text x="0" y="40">Update order</text>
                <text x="0" y="60">Track order</text>
              </g>

              {/* =================================================================== */}
              {/* 2. INVENTORY SERVICE SECTION (Right Box) */}
              {/* =================================================================== */}

              {/* Inventory Service Box */}
              <rect
                x="600"
                y="95"
                width="145"
                height="115"
                rx="14"
                fill="#000000"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text x="672" y="145" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                Inventory
              </text>
              <text x="672" y="170" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                Service
              </text>

              {/* Text to the Right of Inventory Service */}
              <g transform="translate(760, 130)" fill="#d4d4d8" fontSize="14" fontFamily="sans-serif">
                <text x="0" y="0">product inventory</text>
                <text x="0" y="22">stock availability</text>
                <text x="0" y="44">stock updates</text>
              </g>

              {/* =================================================================== */}
              {/* 3. MIDDLE SAGA TOPICS & FLOW PATHS */}
              {/* =================================================================== */}

              {/* TOP KAFKA TOPIC: Order Req topic */}
              <g transform="translate(425, 40)">
                <text x="18" y="0" fill="#ffffff" fontSize="14" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
                  Order Req topic
                </text>
                {/* Kafka Cluster Node Graphic */}
                <g transform="translate(0, 15)">
                  <circle cx="18" cy="18" r="4" fill="#ffffff" />
                  <circle cx="8" cy="30" r="3" fill="#ffffff" />
                  <circle cx="28" cy="30" r="3" fill="#ffffff" />
                  <circle cx="18" cy="38" r="3" fill="#ffffff" />
                  <line x1="18" y1="18" x2="8" y2="30" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="18" y1="18" x2="28" y2="30" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="18" y1="18" x2="18" y2="38" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              </g>

              {/* PATH: Order Service -> Order Req topic -> Inventory Service */}
              <path
                id="path-order-req"
                d="M 230 145 C 310 145, 310 75, 415 75 L 430 75"
                fill="none"
                stroke={activeFlow === "order-req" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />
              <path
                d="M 465 75 L 520 75 C 570 75, 570 145, 595 145"
                fill="none"
                stroke={activeFlow === "order-req" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />

              {/* Animated pulses on Order Req path */}
              {(activeFlow === "order-req" || activeFlow === "all") && (
                <>
                  <motion.circle
                    r="4"
                    fill="#ffffff"
                    animate={{
                      cx: [230, 310, 420],
                      cy: [145, 75, 75],
                    }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  />
                  <motion.circle
                    r="4"
                    fill="#ffffff"
                    animate={{
                      cx: [465, 550, 595],
                      cy: [75, 75, 145],
                    }}
                    transition={{ repeat: Infinity, duration: 2.2, delay: 1.1, ease: "easeInOut" }}
                  />
                </>
              )}

              {/* BOTTOM KAFKA TOPIC: Order fail topic */}
              <g transform="translate(425, 230)">
                <g transform="translate(0, 5)">
                  <circle cx="18" cy="18" r="4" fill="#ffffff" />
                  <circle cx="8" cy="30" r="3" fill="#ffffff" />
                  <circle cx="28" cy="30" r="3" fill="#ffffff" />
                  <circle cx="18" cy="38" r="3" fill="#ffffff" />
                  <line x1="18" y1="18" x2="8" y2="30" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="18" y1="18" x2="28" y2="30" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="18" y1="18" x2="18" y2="38" stroke="#ffffff" strokeWidth="1.5" />
                </g>
                <text x="18" y="65" fill="#ffffff" fontSize="14" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
                  Order fail topic
                </text>
              </g>

              {/* PATH: Inventory Service -> Order fail topic -> Order Service */}
              <path
                d="M 600 170 C 540 170, 540 250, 470 250"
                fill="none"
                stroke={activeFlow === "order-fail" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />
              <path
                d="M 425 250 C 330 250, 330 170, 235 170"
                fill="none"
                stroke={activeFlow === "order-fail" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />

              {/* Animated pulses on Order Fail path */}
              {(activeFlow === "order-fail" || activeFlow === "all") && (
                <>
                  <motion.circle
                    r="4"
                    fill="#ffffff"
                    animate={{
                      cx: [600, 530, 470],
                      cy: [170, 250, 250],
                    }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  />
                  <motion.circle
                    r="4"
                    fill="#ffffff"
                    animate={{
                      cx: [425, 330, 235],
                      cy: [250, 250, 170],
                    }}
                    transition={{ repeat: Infinity, duration: 2.2, delay: 1.1, ease: "easeInOut" }}
                  />
                </>
              )}

              {/* =================================================================== */}
              {/* 4. CQRS DUAL DATABASE SYSTEM (Bottom) */}
              {/* =================================================================== */}

              {/* Flow Down from Inventory Service to Databases */}
              <path
                d="M 672 210 L 672 260 C 672 280, 565 280, 565 310"
                fill="none"
                stroke={activeFlow === "db-sync" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />
              <path
                d="M 672 260 C 672 280, 785 280, 785 310"
                fill="none"
                stroke={activeFlow === "db-sync" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />

              {/* --- DATABASE 1: PostgreSQL (Write DB) --- */}
              <g transform="translate(535, 315)">
                <ellipse cx="30" cy="12" rx="30" ry="12" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                <path d="M 0 12 L 0 50 C 0 62, 60 62, 60 50 L 60 12" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                <ellipse cx="30" cy="30" rx="30" ry="10" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                <ellipse cx="30" cy="50" rx="30" ry="12" fill="none" stroke="#ffffff" strokeWidth="2" />
              </g>

              {/* Label Left of Postgres: Create Update Delete) */}
              <g transform="translate(470, 330)" fill="#d4d4d8" fontSize="13" fontFamily="sans-serif" textAnchor="end">
                <text x="0" y="0">Create</text>
                <text x="0" y="18">Update</text>
                <text x="0" y="36">Delete)</text>
              </g>

              {/* Postgres Elephant Icon below */}
              <g transform="translate(552, 385)">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.41 3.12 7.23L4 22l3.42-.92C8.75 21.64 10.33 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>

              {/* --- MIDDLE KAFKA TOPIC: Database update topic --- */}
              <g transform="translate(660, 330)">
                <g transform="translate(0, 0)">
                  <circle cx="15" cy="12" r="4" fill="#ffffff" />
                  <circle cx="5" cy="24" r="3" fill="#ffffff" />
                  <circle cx="25" cy="24" r="3" fill="#ffffff" />
                  <circle cx="15" cy="32" r="3" fill="#ffffff" />
                  <line x1="15" y1="12" x2="5" y2="24" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="15" y1="12" x2="25" y2="24" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="15" y1="12" x2="15" y2="32" stroke="#ffffff" strokeWidth="1.5" />
                </g>
                <text x="15" y="55" fill="#ffffff" fontSize="13" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
                  Database
                </text>
                <text x="15" y="72" fill="#ffffff" fontSize="13" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
                  update topic
                </text>
              </g>

              {/* Connectors between PostgreSQL -> Database update topic -> MongoDB */}
              <line
                x1="600"
                y1="345"
                x2="650"
                y2="345"
                stroke={activeFlow === "db-sync" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />
              <line
                x1="700"
                y1="345"
                x2="750"
                y2="345"
                stroke={activeFlow === "db-sync" || activeFlow === "all" ? "#ffffff" : "#3f3f46"}
                strokeWidth="1.8"
                markerEnd="url(#arrow-white)"
              />

              {/* Animated pulses on CQRS sync path */}
              {(activeFlow === "db-sync" || activeFlow === "all") && (
                <>
                  <motion.circle
                    r="4"
                    fill="#ffffff"
                    animate={{
                      cx: [672, 565, 565],
                      cy: [210, 270, 315],
                    }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  />
                  <motion.circle
                    r="4"
                    fill="#ffffff"
                    animate={{
                      cx: [600, 650, 700, 755],
                      cy: [345, 345, 345, 345],
                    }}
                    transition={{ repeat: Infinity, duration: 2.5, delay: 1.2, ease: "easeInOut" }}
                  />
                </>
              )}

              {/* --- DATABASE 2: MongoDB (Read DB) --- */}
              <g transform="translate(755, 315)">
                <ellipse cx="30" cy="12" rx="30" ry="12" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                <path d="M 0 12 L 0 50 C 0 62, 60 62, 60 50 L 60 12" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                <ellipse cx="30" cy="30" rx="30" ry="10" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                <ellipse cx="30" cy="50" rx="30" ry="12" fill="none" stroke="#ffffff" strokeWidth="2" />
              </g>

              {/* Label Right of MongoDB: Get requests */}
              <g transform="translate(825, 340)" fill="#d4d4d8" fontSize="13" fontFamily="sans-serif">
                <text x="0" y="0">Get</text>
                <text x="0" y="18">requests</text>
              </g>

              {/* MongoDB Leaf Icon below */}
              <g transform="translate(777, 385)">
                <path
                  d="M12 2C8.5 7 5 12 5 16a7 7 0 0 0 14 0c0-4-3.5-9-7-14z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            </svg>
          </div>

          {/* Bottom Live Explanatory Text */}
          <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 gap-2">
            <div>
              Signal Path: <span className="text-white font-semibold uppercase">{activeFlow === "all" ? "Full Choreography Loop (Order + CQRS Sync)" : activeFlow}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>● White Pulse = Active Event Stream</span>
              <span>Neon Postgres ➔ Kafka ➔ Mongo Atlas</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
