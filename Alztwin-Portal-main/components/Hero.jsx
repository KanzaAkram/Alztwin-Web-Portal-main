import React, { useState, useRef } from "react";
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
  const [brainRotation, setBrainRotation] = useState({ x: 0, y: 0 });
  const [activeMarker, setActiveMarker] = useState(null);
  const brainRef = useRef(null);

  const handleBrainMouseMove = (e) => {
    if (!brainRef.current) return;
    const rect = brainRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (max 12 degrees)
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setBrainRotation({ x: rotateX, y: rotateY });
  };

  const handleBrainMouseLeave = () => {
    setBrainRotation({ x: 0, y: 0 });
    setActiveMarker(null);
  };

  return (
    <section className="relative min-h-[95vh] flex items-center pt-32 pb-20 overflow-hidden bg-slate-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-slate-900 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] opacity-20"></div>

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div className="space-y-8 relative">
            {/* Main Title */}
            <div
              className="space-y-2 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="block text-white">Precision Care via</span>
                <span className="bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.blue.400),theme(colors.blue.100),theme(colors.sky.400),theme(colors.blue.400))] bg-[length:200%_auto] animate-shimmer">
                  Digital Twins
                </span>
              </h1>
            </div>

            {/* Description */}
            <p
              className="text-lg text-slate-400 max-w-xl leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              AlzTwin unifies{" "}
              <span className="text-blue-200">MRI brain modeling</span>,{" "}
              <span className="text-blue-200">IoT monitoring</span>, and{" "}
              <span className="text-blue-200">AI prediction</span> into a
              single, proactive dashboard for Alzheimer's management.
            </p>

            {/* Action Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 pt-2 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <button
                onClick={onSignup}
                className="group relative overflow-hidden rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 hover:scale-[1.02] hover:shadow-blue-500/40"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center space-x-2">
                  <span>Request Clinical Access</span>
                  <ChevronRight size={18} />
                </span>
              </button>

              <button className="flex items-center justify-center space-x-2 rounded-lg border border-slate-700 bg-slate-900/50 px-8 py-4 font-medium text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white hover:border-slate-600">
                <span>View Methodology</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div
              className="pt-8 flex flex-wrap gap-8 opacity-80 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center space-x-2">
                <Shield className="text-emerald-500" size={18} />
                <span className="text-sm text-slate-400">HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="text-purple-500" size={18} />
                <span className="text-sm text-slate-400">Encrypted Data</span>
              </div>
            </div>
          </div>

          {/* Right: 3D Interface Visual */}
          <div
            className="relative h-[600px] flex items-center justify-center perspective-1000 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {/* Floating Elements Wrapper */}
            <div className="relative w-full max-w-md">
              {/* Main Dashboard Card */}
              <div className="relative z-20 bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)] backdrop-blur-xl overflow-hidden animate-float-slow transform rotate-y-[-5deg] hover:rotate-y-0 transition-transform duration-1000">
                {/* Scanning Line Effect */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-30 animate-scan pointer-events-none"></div>

                {/* Window Header */}
                <div className="h-8 bg-slate-800/80 border-b border-slate-700 flex items-center px-4 space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  </div>
                  <div className="ml-auto text-[10px] font-mono text-slate-500">
                    PROTOTYPE v1.1
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-6">
                  {/* Patient Profile Header */}
                  <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      JD
                    </div>
                    <div>
                      <h3 className="text-white font-medium">John Doe</h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span>72 yrs</span>
                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                        <span>Early Onset AD</span>
                      </div>
                    </div>
                    <div className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      STABLE
                    </div>
                  </div>

                  {/* Interactive Brain Visualization Area */}
                  <div
                    ref={brainRef}
                    onMouseMove={handleBrainMouseMove}
                    onMouseLeave={handleBrainMouseLeave}
                    className="relative h-48 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-crosshair perspective-1000"
                  >
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    {/* Inner Rotatable Container */}
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
                        className="w-full h-full object-cover opacity-60 mix-blend-screen grayscale transition-all duration-700 scale-105"
                      />

                      {/* Markers */}
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
                          {/* Ripple */}
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              marker.status === "critical"
                                ? "bg-red-400"
                                : marker.status === "warning"
                                ? "bg-yellow-400"
                                : "bg-emerald-400"
                            }`}
                          ></span>
                          {/* Dot */}
                          <span
                            className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125 ${
                              marker.status === "critical"
                                ? "bg-red-500"
                                : marker.status === "warning"
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                            }`}
                          ></span>

                          {/* Tooltip */}
                          <div
                            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-xl transition-all duration-200 pointer-events-none ${
                              activeMarker === marker.id
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-2"
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {marker.status === "critical" ? (
                                <AlertCircle
                                  size={12}
                                  className="text-red-400"
                                />
                              ) : marker.status === "warning" ? (
                                <Info size={12} className="text-yellow-400" />
                              ) : (
                                <CheckCircle2
                                  size={12}
                                  className="text-emerald-400"
                                />
                              )}
                              <span className="text-xs font-bold text-white uppercase">
                                {marker.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-tight">
                              {marker.detail}
                            </p>
                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45"></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overlay UI */}
                    <div className="absolute top-3 right-3 flex flex-col items-end space-y-1 pointer-events-none">
                      <span className="text-[10px] text-blue-300 font-mono bg-blue-900/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        SAGITTAL VIEW
                      </span>
                      <span className="text-[10px] text-blue-300 font-mono bg-blue-900/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        T1-WEIGHTED
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 pointer-events-none">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-900/50 px-1.5 py-0.5 rounded backdrop-blur-sm border border-slate-800">
                        INTERACTIVE 3D PREVIEW
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity size={14} className="text-blue-400" />
                        <span className="text-[10px] text-slate-400 uppercase">
                          Hippocampal Vol
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        2.8 cm³
                      </div>
                      <div className="text-[10px] text-red-400">-4.2% YoY</div>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain size={14} className="text-purple-400" />
                        <span className="text-[10px] text-slate-400 uppercase">
                          MMSE Score
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white">22/30</div>
                      <div className="text-[10px] text-yellow-400">
                        Moderate Decline
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating "Holographic" Cards */}

              {/* 1. Location Card - Top Right */}
              <div className="absolute -right-12 -top-8 z-30 animate-float-medium">
                <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-slate-600/50 shadow-xl flex items-center space-x-3 w-40">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">
                      Geofence
                    </div>
                    <div className="text-xs font-bold text-white">
                      Home Zone
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Genetics Card - Bottom Left */}
              <div className="absolute -left-12 bottom-20 z-30 animate-float-fast">
                <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-slate-600/50 shadow-xl flex items-center space-x-3 w-44">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Dna size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">
                      Genotype
                    </div>
                    <div className="text-xs font-bold text-white">
                      APOE ε4 Carrier
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Sleep Card - Bottom Right */}
              <div className="absolute -right-4 -bottom-4 z-30 animate-float-slow">
                <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-slate-600/50 shadow-xl flex items-center space-x-3 w-36">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">
                      Sleep Avg
                    </div>
                    <div className="text-xs font-bold text-white">6h 42m</div>
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
