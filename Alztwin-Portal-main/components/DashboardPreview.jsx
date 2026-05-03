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
  Line,
  ComposedChart,
} from "recharts";
import { HIPPOCAMPAL_DATA } from "../constants";
import {
  Brain,
  TrendingDown,
  Activity,
  AlertCircle,
  ArrowUpRight,
  Zap,
  Shield,
  Target,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

// Custom dot component for the chart
const CustomActiveDot = (props) => {
  const { cx, cy, fill } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#fff" strokeWidth={2} />
    </g>
  );
};

export const DashboardPreview = () => {
  const { isLight } = useTheme();
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
      className={`py-28 border-t relative z-10 overflow-hidden ${
        isLight
          ? "bg-[radial-gradient(circle_at_18%_8%,rgba(15,118,110,0.14),transparent_30%),radial-gradient(circle_at_84%_14%,rgba(79,70,229,0.10),transparent_32%),linear-gradient(180deg,#dcefed_0%,#e4f2f5_48%,#dfeafb_100%)] border-teal-900/10"
          : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800/50"
      }`}
      ref={sectionRef}
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] ${isLight ? "bg-blue-600/10" : "bg-blue-600/5"}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] ${isLight ? "bg-indigo-600/10" : "bg-indigo-600/5"}`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-gradient-radial via-transparent to-transparent rounded-full ${isLight ? "from-teal-900/10" : "from-blue-900/10"}`}></div>
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section - Enhanced */}
        <div
          className={`mb-16 transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className={`inline-flex items-center space-x-2 border rounded-full px-4 py-2 mb-6 backdrop-blur-sm ${
                isLight ? "home-section-kicker" : "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20"
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-emerald-800" : "text-emerald-400"}`}>
                  Live Analytics Demo
                </span>
              </div>

              {/* Title - Enhanced */}
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1] ${isLight ? "text-[#102a37]" : "text-white"}`}>
                Clinical Decision
                <span className={`block ${
                  isLight
                    ? "bg-[linear-gradient(90deg,#064e3b,#0f766e,#155e75)] bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                }`}>
                  Support System
                </span>
              </h2>

              {/* Description */}
              <p className={`text-lg md:text-xl leading-relaxed ${isLight ? "text-[#294654]" : "text-slate-400"}`}>
                Leverage our{" "}
                <span className={isLight ? "home-inline-highlight" : "text-blue-400 font-medium"}>
                  machine learning models
                </span>{" "}
                to track hippocampal volume and forecast disease progression,
                enabling
                <span className={isLight ? "home-inline-highlight" : "text-white font-medium"}>
                  {" "}
                  timely and tailored interventions
                </span>
                .
              </p>
            </div>

            {/* Stats Cards - Enhanced */}
            <div className="flex flex-wrap gap-4">
              <div className={`group backdrop-blur-xl px-6 py-5 rounded-2xl border shadow-2xl hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 ${
                isLight ? "bg-[#d8eee9]/92 border-teal-900/10" : "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50"
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                    94%
                  </span>
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <ArrowUpRight className="text-emerald-400" size={18} />
                  </div>
                </div>
                <div className={`text-xs font-medium uppercase tracking-widest ${isLight ? "text-[#315666]" : "text-slate-400"}`}>
                  Prediction Accuracy
                </div>
              </div>

              <div className={`group backdrop-blur-xl px-6 py-5 rounded-2xl border shadow-2xl hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 ${
                isLight ? "bg-[#d8eee9]/92 border-teal-900/10" : "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50"
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    24/7
                  </span>
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Activity className="text-blue-400" size={18} />
                  </div>
                </div>
                <div className={`text-xs font-medium uppercase tracking-widest ${isLight ? "text-[#315666]" : "text-slate-400"}`}>
                  IoT Data Sync
                </div>
              </div>

              <div className={`group backdrop-blur-xl px-6 py-5 rounded-2xl border shadow-2xl hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 ${
                isLight ? "bg-[#d8eee9]/92 border-teal-900/10" : "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50"
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    &lt;2s
                  </span>
                  <div className="p-1.5 bg-purple-500/10 rounded-lg">
                    <Zap className="text-purple-400" size={18} />
                  </div>
                </div>
                <div className={`text-xs font-medium uppercase tracking-widest ${isLight ? "text-[#315666]" : "text-slate-400"}`}>
                  Response Time
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Card - Enhanced */}
        <div
          className={`relative backdrop-blur-xl rounded-3xl border overflow-hidden transition-all duration-1000 delay-200 transform ${
            isLight
              ? "bg-[#d8eee9]/92 border-teal-900/15 shadow-[0_34px_95px_rgba(15,23,42,0.16)]"
              : "bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-800/90 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-slate-700/40"
          } ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Decorative top border gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

          <div className={`grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x ${isLight ? "divide-slate-200" : "divide-slate-700/30"}`}>
            {/* Sidebar Stats - Enhanced */}
            <div className={`lg:col-span-4 p-8 space-y-8 ${isLight ? "bg-[#cfe7e2]/70" : "bg-gradient-to-b from-slate-900/50 to-transparent"}`}>
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${isLight ? "text-[#315666]" : "text-slate-300"}`}>
                    <Activity size={14} className="text-blue-400" />
                    Live Vitals
                  </h3>
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Action Required
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Brain Volume Card */}
                  <div className={`group p-4 rounded-2xl border hover:border-blue-500/30 transition-all duration-300 ${
                    isLight
                      ? "bg-[#eaf7f4] border-teal-900/10 shadow-sm"
                      : "bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/30"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Brain size={16} className="text-blue-400" />
                        </div>
                        <span className={`text-sm font-medium ${isLight ? "text-[#294654]" : "text-slate-300"}`}>
                          Brain Volume (Whole)
                        </span>
                      </div>
                      <span className={`font-mono text-xl font-bold ${isLight ? "text-[#102a37]" : "text-white"}`}>
                        1,120{" "}
                        <span className="text-sm text-slate-500">cm³</span>
                      </span>
                    </div>
                    <div className={`relative w-full rounded-full h-2.5 overflow-hidden ${isLight ? "bg-teal-900/12" : "bg-slate-700/50"}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[75%] shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${isLight ? "text-[#315666]" : "text-slate-500"}`}>
                      75% of baseline volume
                    </p>
                  </div>

                  {/* Hippocampal Volume Card */}
                  <div className={`group p-4 rounded-2xl border hover:border-red-500/40 transition-all duration-300 ${
                    isLight
                      ? "bg-red-50/80 border-red-200 shadow-sm"
                      : "bg-gradient-to-br from-red-950/30 to-slate-800/30 border-red-500/20"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <Target size={16} className="text-red-400" />
                        </div>
                        <span className={`text-sm font-medium ${isLight ? "text-[#294654]" : "text-slate-300"}`}>
                          Hippocampal Vol.
                        </span>
                      </div>
                      <span className={`font-mono text-xl font-bold ${isLight ? "text-[#102a37]" : "text-white"}`}>
                        3.1 <span className="text-sm text-slate-500">cm³</span>
                      </span>
                    </div>
                    <div className={`relative w-full rounded-full h-2.5 overflow-hidden ${isLight ? "bg-red-900/12" : "bg-slate-700/50"}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-400 rounded-full w-[60%] shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
                    </div>
                    <p className="text-xs text-red-400 mt-3 flex items-center font-semibold">
                      <TrendingDown size={14} className="mr-1.5" />
                      Accelerated atrophy detected (-2.4%)
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Card - Enhanced */}
              <div className={`relative p-6 rounded-2xl border overflow-hidden group hover:border-indigo-500/40 transition-all duration-300 ${
                isLight
                  ? "bg-gradient-to-br from-indigo-50 via-[#eaf7f4] to-purple-50 border-indigo-200 shadow-sm"
                  : "bg-gradient-to-br from-indigo-950/40 via-slate-800/40 to-purple-950/40 border-indigo-500/20"
              }`}>
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>

                <div className="relative flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 rounded-xl text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-base mb-2 flex items-center gap-2 ${isLight ? "text-[#102a37]" : "text-white"}`}>
                      AI Recommendation
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 rounded-full">
                        NEW
                      </span>
                    </h4>
                    <p className={`text-sm leading-relaxed ${isLight ? "text-[#365565]" : "text-slate-400"}`}>
                      Consider increasing Memantine dosage. Recent gait analysis
                      combined with volume loss indicates{" "}
                      <span className="text-orange-400">
                        elevated fall risk
                      </span>
                      .
                    </p>
                    <button className="mt-4 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center group/btn">
                      View Detailed Report
                      <ArrowUpRight
                        size={14}
                        className="ml-1.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chart Area - Enhanced */}
            <div className="lg:col-span-8 p-8 relative">
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className={`text-2xl font-bold flex items-center gap-3 mb-2 ${isLight ? "text-[#102a37]" : "text-white"}`}>
                    Hippocampal Volume Forecasting
                    <AlertCircle
                      size={18}
                      className="text-slate-500 hover:text-blue-400 transition-colors cursor-help"
                    />
                  </h3>
                  <p className={`text-sm ${isLight ? "text-[#315666]" : "text-slate-500"}`}>
                    Volumetric Trajectory Analysis • Historical + ML Predicted
                  </p>
                </div>
                <div className={`flex items-center space-x-4 backdrop-blur-sm px-5 py-3 rounded-xl border ${
                  isLight
                    ? "bg-[#eaf7f4] border-emerald-200 shadow-sm"
                    : "bg-slate-800/60 border-slate-700/50"
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className={`text-xs font-medium ${isLight ? "text-[#294654]" : "text-slate-300"}`}>
                      Model Active
                    </span>
                  </div>
                  <div className={`w-px h-4 ${isLight ? "bg-teal-900/15" : "bg-slate-700"}`}></div>
                  <div className={`text-xs font-mono ${isLight ? "text-[#315666]" : "text-slate-500"}`}>
                    Last sync: 2m ago
                  </div>
                </div>
              </div>

              {/* Chart Container - Enhanced */}
              <div className={`h-[420px] w-full rounded-2xl p-4 border ${
                isLight
                  ? "bg-[#eaf7f4] border-teal-900/10 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.03)]"
                  : "bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/30"
              }`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={HIPPOCAMPAL_DATA}
                    margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorActualEnhanced"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="50%"
                          stopColor="#3b82f6"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorPredEnhanced"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isLight ? "#cbd5e1" : "#334155"}
                      opacity={isLight ? 0.75 : 0.3}
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 12, fontWeight: 600 }}
                      dy={15}
                    />

                    <YAxis
                      domain={[2600, 3400]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 12, fontWeight: 600 }}
                      width={50}
                      tickFormatter={(value) => `${value}`}
                    />

                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={`backdrop-blur-xl border p-5 rounded-2xl shadow-2xl ${
                              isLight ? "bg-[#eaf7f4] border-slate-200" : "bg-slate-900/95 border-slate-600/50"
                            }`}>
                              <p className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b ${
                                isLight ? "text-slate-500 border-slate-200" : "text-slate-400 border-slate-700"
                              }`}>
                                {label} Analysis
                              </p>
                              {payload.map((pld, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-8 mb-2 last:mb-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        pld.name === "Measured"
                                          ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                                          : "bg-gradient-to-r from-purple-400 to-pink-400"
                                      }`}
                                    ></div>
                                    <span className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                                      {pld.name}
                                    </span>
                                  </div>
                                  <span className={`font-mono text-base font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {pld.value}{" "}
                                    <span className="text-slate-500 text-xs">
                                      cm³
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{
                        stroke: "#60a5fa",
                        strokeWidth: 1,
                        strokeDasharray: "5 5",
                      }}
                    />

                    {/* Critical threshold line */}
                    <ReferenceLine
                      y={2800}
                      stroke="#ef4444"
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      strokeOpacity={0.6}
                      label={{
                        value: "⚠️ Critical Threshold",
                        fill: "#f87171",
                        fontSize: 11,
                        fontWeight: 600,
                        position: "insideTopRight",
                        offset: 10,
                      }}
                    />

                    {/* Projection zone shading */}
                    <ReferenceArea
                      x1="Jul"
                      x2="Sep"
                      fill="#6366f1"
                      fillOpacity={0.08}
                      stroke="#6366f1"
                      strokeOpacity={0.2}
                      strokeDasharray="4 4"
                    />

                    {/* Predicted volume area */}
                    <Area
                      type="monotone"
                      dataKey="predictedVolume"
                      stroke="#a78bfa"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      fill="url(#colorPredEnhanced)"
                      name="Predicted"
                      animationDuration={2000}
                    />

                    {/* Actual volume area */}
                    <Area
                      type="monotone"
                      dataKey="actualVolume"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorActualEnhanced)"
                      name="Measured"
                      animationDuration={1500}
                      activeDot={<CustomActiveDot fill="#3b82f6" />}
                      filter="url(#glow)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Enhanced Legend */}
              <div className={`flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mt-8 text-sm font-medium pt-6 border-t ${isLight ? "text-[#315666] border-teal-900/10" : "text-slate-400 border-slate-800/50"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                    <span className="w-2 h-1 bg-blue-400 rounded-full"></span>
                  </div>
                  <span>MRI Measured Volume</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-purple-400 rounded-full"></span>
                    <span className="w-1 h-0.5 bg-purple-400 rounded-full"></span>
                    <span className="w-2 h-0.5 bg-purple-400 rounded-full"></span>
                  </div>
                  <span>AI Predicted Trajectory</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-4 bg-indigo-500/20 border border-indigo-500/40 rounded"></span>
                  <span>Forecast Zone</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    <span className="w-2 h-0.5 bg-red-400 rounded-full"></span>
                    <span className="w-1 h-0.5 bg-transparent"></span>
                    <span className="w-2 h-0.5 bg-red-400 rounded-full"></span>
                  </div>
                  <span>Risk Threshold</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
