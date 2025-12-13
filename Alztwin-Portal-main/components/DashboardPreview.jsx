import React, { useState, useEffect, useRef } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ReferenceArea,
} from "recharts";
import { HIPPOCAMPAL_DATA } from "../constants";
import {
  Brain,
  TrendingDown,
  Activity,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

export const DashboardPreview = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section
      id="analytics"
      className="py-24 bg-slate-950 border-t border-slate-900 relative z-10 overflow-hidden"
      ref={sectionRef}
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={`grid lg:grid-cols-2 gap-12 items-end mb-16 transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div>
            <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Live Demo
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Clinical Decision Support
            </h2>
            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              Leverage our machine learning models to track hippocampal volume
              and forecast disease progression, enabling timely and tailored
              interventions.
            </p>
          </div>
          <div className="flex gap-4 lg:justify-end">
            <div className="bg-slate-900/80 backdrop-blur px-6 py-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-4xl font-bold text-white tracking-tight">
                  94%
                </span>
                <ArrowUpRight className="text-emerald-500" size={20} />
              </div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
                Prediction Accuracy
              </div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur px-6 py-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-4xl font-bold text-blue-500 tracking-tight">
                  24/7
                </span>
                <Activity className="text-blue-500" size={20} />
              </div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
                IoT Data Sync
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-800/60 overflow-hidden ring-1 ring-white/5 transition-all duration-1000 delay-300 transform ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-12 scale-95"
          }`}
        >
          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60">
            {/* Sidebar Stats */}
            <div className="lg:col-span-4 p-8 space-y-8 bg-slate-900/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Live Vitals
                  </h3>
                  <div className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                    Action Required
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">
                        Brain Volume (Whole)
                      </span>
                      <span className="font-mono text-white text-lg">
                        1,120 cm³
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full w-[75%] shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">
                        Hippocampal Vol.
                      </span>
                      <span className="font-mono text-white text-lg">
                        3.1 cm³
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full w-[60%] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    </div>
                    <p className="text-xs text-red-400 mt-2 flex items-center font-medium animate-pulse">
                      <TrendingDown size={14} className="mr-1.5" />
                      Accelerated atrophy (-2.4%)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">
                      AI Recommendation
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Consider increasing Memantine dosage. Recent gait analysis
                      combined with volume loss indicates elevated fall risk.
                    </p>
                    <button className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center">
                      View Detailed Report{" "}
                      <ArrowUpRight size={12} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="lg:col-span-8 p-8 bg-slate-950/50 relative">
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Hippocampal Forecasting
                    <AlertCircle
                      size={16}
                      className="text-slate-500 hover:text-white transition-colors cursor-help"
                    />
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Volumetric Trajectory Analysis (Historical + Projected)
                  </p>
                </div>
                <div className="flex items-center space-x-6 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      Model Active
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Updated: 2m ago
                  </div>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={HIPPOCAMPAL_DATA}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorActual"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorPred"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#94a3b8"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#94a3b8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#1e293b"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      dy={15}
                    />
                    <YAxis
                      domain={[2600, 3400]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      width={40}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl ring-1 ring-white/10">
                              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                                {label} Analysis
                              </p>
                              {payload.map((pld, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-6 mb-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        pld.name === "Measured"
                                          ? "bg-blue-500"
                                          : "bg-slate-400"
                                      }`}
                                    ></div>
                                    <span
                                      className={`text-sm font-medium ${
                                        pld.name === "Measured"
                                          ? "text-white"
                                          : "text-slate-300"
                                      }`}
                                    >
                                      {pld.name}
                                    </span>
                                  </div>
                                  <span className="font-mono text-sm text-white">
                                    {pld.value} cm³
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{
                        stroke: "#475569",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />

                    <ReferenceLine
                      y={2800}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                      label={{
                        value: "Critical Threshold",
                        fill: "#ef4444",
                        fontSize: 10,
                        position: "insideBottomRight",
                        offset: 10,
                      }}
                    />

                    {/* Shading for projection area */}
                    <ReferenceArea
                      x1="Jul"
                      x2="Sep"
                      fill="#1e293b"
                      fillOpacity={0.3}
                    />

                    <Area
                      type="monotone"
                      dataKey="predictedVolume"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#colorPred)"
                      name="Predicted"
                      animationDuration={2000}
                    />
                    <Area
                      type="monotone"
                      dataKey="actualVolume"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorActual)"
                      name="Measured"
                      animationDuration={1500}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#60a5fa" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend / Info */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-6 text-xs font-medium text-slate-500 border-t border-slate-800/50 pt-6">
                <div className="flex items-center">
                  <span className="w-3 h-1 bg-blue-600 rounded-full mr-2 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></span>
                  MRI Measured Volume
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-1 border-t-2 border-dashed border-slate-400 mr-2"></span>
                  AI Predicted Trajectory
                </div>
                <div className="flex items-center">
                  <span className="w-20 h-4 bg-slate-800/50 border border-slate-700/50 rounded mr-2"></span>
                  Projection Zone
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
