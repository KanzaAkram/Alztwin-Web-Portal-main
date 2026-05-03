import React, { useRef, useState } from "react";
import {
  ChevronRight,
  Activity,
  Shield,
  Brain,
  Database,
  MapPin,
  Dna,
  Clock,
  AlertCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

const BRAIN_MARKERS = [
  {
    id: 1,
    top: "55%",
    left: "35%",
    label: "Hippocampus",
    detail: "Volume loss detected (-4.2%)",
    status: "critical",
  },
  {
    id: 2,
    top: "35%",
    left: "58%",
    label: "Ventricles",
    detail: "Mild enlargement",
    status: "warning",
  },
  {
    id: 3,
    top: "65%",
    left: "60%",
    label: "Temporal Lobe",
    detail: "Metabolism stable",
    status: "stable",
  },
];

export const Hero = ({ onSignup }) => {
  const { isLight } = useTheme();
  const [brainRotation, setBrainRotation] = useState({ x: 0, y: 0 });
  const [activeMarker, setActiveMarker] = useState(null);
  const brainRef = useRef(null);

  const handleBrainMouseMove = (e) => {
    if (!brainRef.current) return;
    const rect = brainRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -12;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    setBrainRotation({ x: rotateX, y: rotateY });
  };

  const handleBrainMouseLeave = () => {
    setBrainRotation({ x: 0, y: 0 });
    setActiveMarker(null);
  };

  return (
    <section
      className={`relative min-h-[95vh] flex items-center pt-32 pb-20 overflow-hidden ${
        isLight
          ? "bg-[radial-gradient(circle_at_16%_18%,rgba(15,118,110,0.22),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(14,116,144,0.18),transparent_32%),linear-gradient(135deg,#dcefed_0%,#e5f4f7_46%,#dfeafb_100%)]"
          : "bg-slate-950"
      }`}
    >
      <div className="absolute inset-0 z-0">
        <div
          className={`absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] ${
            isLight
              ? "bg-[linear-gradient(rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.07)_1px,transparent_1px)] bg-[size:44px_44px] opacity-55"
              : "bg-grid-slate-900 opacity-20"
          }`}
        ></div>
        <div
          className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse-slow ${
            isLight ? "bg-emerald-400/24" : "bg-blue-600/20"
          }`}
        ></div>
        <div
          className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse-slow ${
            isLight ? "bg-cyan-400/18" : "bg-indigo-600/20"
          }`}
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8 relative">
            <div
              className="space-y-4 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              {isLight && (
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-700/20 bg-[#d8eee9]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-900 shadow-[0_12px_30px_rgba(15,118,110,0.10)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" />
                  Clinical Digital Twin Platform
                </div>
              )}
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span
                  className={`block ${isLight ? "text-[#102a37]" : "text-white"}`}
                >
                  Precision Care via
                </span>
                {isLight ? (
                  <span className="mt-2 block bg-[linear-gradient(90deg,#064e3b_0%,#0f766e_42%,#155e75_100%)] bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]">
                    Digital Twins
                  </span>
                ) : (
                  <span className="bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.blue.400),theme(colors.blue.100),theme(colors.sky.400),theme(colors.blue.400))] bg-[length:200%_auto] animate-shimmer">
                    Digital Twins
                  </span>
                )}
              </h1>
            </div>

            <p
              className={`text-lg max-w-xl leading-relaxed animate-fade-in-up ${
                isLight ? "text-[#294654]" : "text-slate-400"
              }`}
              style={{ animationDelay: "0.2s" }}
            >
              AlzTwin unifies{" "}
              <span
                className={isLight ? "home-inline-highlight" : "text-blue-200"}
              >
                MRI brain modeling
              </span>
              ,{" "}
              <span
                className={isLight ? "home-inline-highlight" : "text-blue-200"}
              >
                IoT monitoring
              </span>
              , and{" "}
              <span
                className={isLight ? "home-inline-highlight" : "text-blue-200"}
              >
                AI prediction
              </span>{" "}
              into a single, proactive dashboard for Alzheimer's management.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 pt-2 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <button
                onClick={onSignup}
                className={`home-preserve-white group relative overflow-hidden rounded-lg px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-[1.02] ${
                  isLight
                    ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] shadow-[0_24px_48px_rgba(15,118,110,0.24)] hover:brightness-110"
                    : "bg-blue-600 shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/40"
                }`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="home-preserve-white relative flex items-center justify-center space-x-2">
                  <span>Request Clinical Access</span>
                  <ChevronRight size={18} />
                </span>
              </button>

              <button
                className={`flex items-center justify-center space-x-2 rounded-lg border px-8 py-4 font-medium backdrop-blur-sm transition-all ${
                  isLight
                    ? "border-teal-800/20 bg-[#d8eee9]/80 text-teal-950 hover:bg-[#cce9e2] hover:border-teal-700/45 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                    : "border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                }`}
              >
                <span>View Methodology</span>
              </button>
            </div>

            <div
              className="pt-8 flex flex-wrap gap-8 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center space-x-2">
                <Shield className={isLight ? "text-teal-800" : "text-emerald-600"} size={18} />
                <span className={`text-sm font-medium ${isLight ? "text-[#294654]" : "text-slate-400"}`}>
                  HIPAA Compliant
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className={isLight ? "text-teal-800" : "text-emerald-600"} size={18} />
                <span className={`text-sm font-medium ${isLight ? "text-[#294654]" : "text-slate-400"}`}>
                  Encrypted Data
                </span>
              </div>
            </div>
          </div>

          <div
            className="relative h-[600px] flex items-center justify-center perspective-1000 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="relative w-full max-w-md">
              <div
                className={`relative z-20 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden animate-float-slow transform rotate-y-[-5deg] hover:rotate-y-0 transition-transform duration-1000 ${
                  isLight
                    ? "bg-[#d8eee9]/92 border-teal-900/15 shadow-[0_35px_85px_rgba(15,23,42,0.18)]"
                    : "bg-slate-900/90 border-slate-700/80 shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)]"
                }`}
              >
                <div
                  className={`absolute top-0 left-0 w-full h-[2px] z-30 animate-scan pointer-events-none ${
                    isLight
                      ? "bg-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                      : "bg-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                  }`}
                ></div>

                <div
                  className={`h-8 border-b flex items-center px-4 space-x-2 ${
                    isLight ? "bg-[#cfe7e2] border-teal-900/10" : "bg-slate-800/80 border-slate-700"
                  }`}
                >
                  <div className="flex space-x-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${isLight ? "bg-emerald-300" : "bg-slate-600"}`}></div>
                    <div className={`w-2.5 h-2.5 rounded-full ${isLight ? "bg-cyan-300" : "bg-slate-600"}`}></div>
                  </div>
                  <div className={`ml-auto text-[10px] font-mono ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                    PROTOTYPE v1.1
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div
                    className={`flex items-center space-x-4 pb-6 border-b ${
                      isLight ? "border-slate-200" : "border-slate-800"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        isLight
                          ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                          : "bg-gradient-to-br from-blue-500 to-indigo-600"
                      }`}
                    >
                      JD
                    </div>
                    <div>
                      <h3 className={`font-medium ${isLight ? "text-slate-950" : "text-white"}`}>
                        John Doe
                      </h3>
                      <div
                        className={`flex items-center space-x-2 text-xs ${
                          isLight ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        <span>72 yrs</span>
                        <span className={`w-1 h-1 rounded-full ${isLight ? "bg-slate-400" : "bg-slate-600"}`}></span>
                        <span>Early Onset AD</span>
                      </div>
                    </div>
                    <div className="ml-auto text-xs font-mono text-emerald-900 bg-emerald-100 px-2 py-1 rounded border border-emerald-300">
                      STABLE
                    </div>
                  </div>

                  <div
                    ref={brainRef}
                    onMouseMove={handleBrainMouseMove}
                    onMouseLeave={handleBrainMouseLeave}
                    className={`relative h-48 rounded-lg border overflow-hidden cursor-crosshair perspective-1000 ${
                      isLight ? "bg-[#102a37] border-teal-900/20 shadow-inner" : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 ${
                        isLight
                          ? "bg-[linear-gradient(rgba(125,211,252,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.10)_1px,transparent_1px)] bg-[size:20px_20px]"
                          : "bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px]"
                      }`}
                    ></div>
                    <div
                      className="w-full h-full relative transition-transform duration-100 ease-out preserve-3d"
                      style={{
                        transform: `rotateX(${brainRotation.x}deg) rotateY(${brainRotation.y}deg)`,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800"
                        alt="MRI Scan"
                        className={`w-full h-full object-cover grayscale transition-all duration-700 scale-105 ${
                          isLight ? "opacity-55 mix-blend-screen contrast-125" : "opacity-60 mix-blend-screen"
                        }`}
                      />
                      {BRAIN_MARKERS.map((marker) => (
                        <div
                          key={marker.id}
                          className="absolute w-4 h-4 -ml-2 -mt-2 group z-20"
                          style={{
                            top: marker.top,
                            left: marker.left,
                            transform: "translateZ(20px)",
                          }}
                          onMouseEnter={() => setActiveMarker(marker.id)}
                        >
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              marker.status === "critical"
                                ? "bg-red-400"
                                : marker.status === "warning"
                                ? "bg-yellow-400"
                                : "bg-emerald-400"
                            }`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125 ${
                              marker.status === "critical"
                                ? "bg-red-500"
                                : marker.status === "warning"
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                            }`}
                          ></span>
                          <div
                            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 backdrop-blur-md border p-3 rounded-lg shadow-xl transition-all duration-200 pointer-events-none ${
                              isLight ? "bg-[#eaf7f4]/96 border-slate-200" : "bg-slate-900/90 border-slate-700"
                            } ${activeMarker === marker.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {marker.status === "critical" ? (
                                <AlertCircle size={12} className="text-red-400" />
                              ) : marker.status === "warning" ? (
                                <Info size={12} className="text-yellow-400" />
                              ) : (
                                <CheckCircle2 size={12} className="text-emerald-500" />
                              )}
                              <span
                                className={`text-xs font-bold uppercase ${
                                  isLight ? "text-slate-950" : "text-white"
                                }`}
                              >
                                {marker.label}
                              </span>
                            </div>
                            <p
                              className={`text-[10px] leading-tight ${
                                isLight ? "text-slate-700" : "text-slate-300"
                              }`}
                            >
                              {marker.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col items-end space-y-1 pointer-events-none">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm ${
                          isLight
                            ? "text-cyan-950 bg-[#d8eee9]/90 border border-teal-900/10"
                            : "text-blue-300 bg-blue-900/30"
                        }`}
                      >
                        SAGITTAL VIEW
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm ${
                          isLight
                            ? "text-cyan-950 bg-[#d8eee9]/90 border border-teal-900/10"
                            : "text-blue-300 bg-blue-900/30"
                        }`}
                      >
                        T1-WEIGHTED
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 pointer-events-none">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm border ${
                          isLight
                            ? "text-cyan-950 bg-[#d8eee9]/90 border-teal-900/10"
                            : "text-slate-500 bg-slate-900/50 border-slate-800"
                        }`}
                      >
                        INTERACTIVE 3D PREVIEW
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-3 rounded-lg border transition-colors ${
                        isLight
                          ? "bg-[#cfe7e2]/75 border-teal-900/10 hover:border-emerald-600/40"
                          : "bg-slate-800/40 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity
                          size={14}
                          className={isLight ? "text-emerald-600" : "text-blue-400"}
                        />
                        <span
                          className={`text-[10px] uppercase ${
                            isLight ? "text-slate-600" : "text-slate-400"
                          }`}
                        >
                          Hippocampal Vol
                        </span>
                      </div>
                      <div className={`text-lg font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                        2.8 cm3
                      </div>
                      <div className="text-[10px] text-red-400">-4.2% YoY</div>
                    </div>
                    <div
                      className={`p-3 rounded-lg border transition-colors ${
                        isLight
                          ? "bg-[#cfe7e2]/75 border-teal-900/10 hover:border-cyan-600/40"
                          : "bg-slate-800/40 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain size={14} className="text-purple-400" />
                        <span
                          className={`text-[10px] uppercase ${
                            isLight ? "text-slate-600" : "text-slate-400"
                          }`}
                        >
                          MMSE Score
                        </span>
                      </div>
                      <div className={`text-lg font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                        22/30
                      </div>
                      <div className="text-[10px] text-yellow-400">Moderate Decline</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-12 -top-8 z-30 animate-float-medium">
                <div
                  className={`backdrop-blur-md p-3 rounded-xl border shadow-xl flex items-center space-x-3 w-40 ${
                    isLight
                      ? "bg-[#d8eee9]/94 border-teal-900/15 shadow-[0_24px_48px_rgba(15,23,42,0.14)]"
                      : "bg-slate-800/80 border-slate-600/50"
                  }`}
                >
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      Geofence
                    </div>
                    <div className={`text-xs font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                      Home Zone
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-12 bottom-20 z-30 animate-float-fast">
                <div
                  className={`backdrop-blur-md p-3 rounded-xl border shadow-xl flex items-center space-x-3 w-44 ${
                    isLight
                      ? "bg-[#d8eee9]/94 border-teal-900/15 shadow-[0_24px_48px_rgba(15,23,42,0.14)]"
                      : "bg-slate-800/80 border-slate-600/50"
                  }`}
                >
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Dna size={18} />
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      Genotype
                    </div>
                    <div className={`text-xs font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                      APOE e4 Carrier
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 -bottom-4 z-30 animate-float-slow">
                <div
                  className={`backdrop-blur-md p-3 rounded-xl border shadow-xl flex items-center space-x-3 w-36 ${
                    isLight
                      ? "bg-[#d8eee9]/94 border-teal-900/15 shadow-[0_24px_48px_rgba(15,23,42,0.14)]"
                      : "bg-slate-800/80 border-slate-600/50"
                  }`}
                >
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      Sleep Avg
                    </div>
                    <div className={`text-xs font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                      6h 42m
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
