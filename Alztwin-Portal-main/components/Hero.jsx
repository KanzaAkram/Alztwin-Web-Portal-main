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
          ? "bg-[linear-gradient(180deg,#f8fafc_0%,#f2f7f4_48%,#fbfcfb_100%)]"
          : "bg-slate-950"
      }`}
    >
      <div className="absolute inset-0 z-0">
        <div
          className={`absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] ${
            isLight
              ? "bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:40px_40px] opacity-70"
              : "bg-grid-slate-900 opacity-20"
          }`}
        ></div>
        <div
          className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse-slow ${
            isLight ? "bg-emerald-300/30" : "bg-blue-600/20"
          }`}
        ></div>
        <div
          className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse-slow ${
            isLight ? "bg-cyan-200/30" : "bg-indigo-600/20"
          }`}
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8 relative">
            <div
              className="space-y-2 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span
                  className={`block ${isLight ? "text-slate-950" : "text-white"}`}
                >
                  Precision Care via
                </span>
                {isLight ? (
                  <span className="bg-clip-text text-transparent bg-[linear-gradient(to_right,#0f172a,#0f766e,#0f766e,#155e75)] bg-[length:200%_auto] animate-shimmer">
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
                isLight ? "text-slate-700" : "text-slate-400"
              }`}
              style={{ animationDelay: "0.2s" }}
            >
              AlzTwin unifies{" "}
              <span
                className={isLight ? "text-slate-900 font-semibold" : "text-blue-200"}
              >
                MRI brain modeling
              </span>
              ,{" "}
              <span
                className={isLight ? "text-slate-900 font-semibold" : "text-blue-200"}
              >
                IoT monitoring
              </span>
              , and{" "}
              <span
                className={isLight ? "text-slate-900 font-semibold" : "text-blue-200"}
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
                className={`group relative overflow-hidden rounded-lg px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-[1.02] ${
                  isLight
                    ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] shadow-[0_24px_48px_rgba(15,118,110,0.24)] hover:brightness-110"
                    : "bg-blue-600 shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/40"
                }`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center space-x-2">
                  <span>Request Clinical Access</span>
                  <ChevronRight size={18} />
                </span>
              </button>

              <button
                className={`flex items-center justify-center space-x-2 rounded-lg border px-8 py-4 font-medium backdrop-blur-sm transition-all ${
                  isLight
                    ? "border-slate-300 bg-white/85 text-slate-800 hover:bg-white hover:border-teal-600 shadow-[0_10px_25px_rgba(15,23,42,0.05)]"
                    : "border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                }`}
              >
                <span>View Methodology</span>
              </button>
            </div>

            <div
              className="pt-8 flex flex-wrap gap-8 opacity-80 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center space-x-2">
                <Shield className="text-emerald-600" size={18} />
                <span className={`text-sm ${isLight ? "text-slate-700" : "text-slate-400"}`}>
                  HIPAA Compliant
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="text-emerald-600" size={18} />
                <span className={`text-sm ${isLight ? "text-slate-700" : "text-slate-400"}`}>
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
                    ? "bg-[#fffdfa]/92 border-slate-200 shadow-[0_30px_70px_rgba(15,23,42,0.12)]"
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
                    isLight ? "bg-[#f5f8f6] border-slate-200" : "bg-slate-800/80 border-slate-700"
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
                      isLight ? "bg-[#f4f7f6] border-slate-200" : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 ${
                        isLight
                          ? "bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]"
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
                          isLight ? "opacity-40 mix-blend-multiply" : "opacity-60 mix-blend-screen"
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
                              isLight ? "bg-[#fffdfa]/96 border-slate-200" : "bg-slate-900/90 border-slate-700"
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
                            ? "text-slate-600 bg-white/85 border border-slate-200"
                            : "text-blue-300 bg-blue-900/30"
                        }`}
                      >
                        SAGITTAL VIEW
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm ${
                          isLight
                            ? "text-slate-600 bg-white/85 border border-slate-200"
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
                            ? "text-slate-600 bg-white/85 border-slate-200"
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
                          ? "bg-[#f5f8f6] border-slate-200 hover:border-emerald-300"
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
                          ? "bg-[#f5f8f6] border-slate-200 hover:border-cyan-300"
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
                      ? "bg-[#fffdfa]/92 border-slate-200 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
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
                      ? "bg-[#fffdfa]/92 border-slate-200 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
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
                      ? "bg-[#fffdfa]/92 border-slate-200 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
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
