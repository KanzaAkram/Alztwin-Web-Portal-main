import React from "react";
import { Cpu, Database, Server, Layers } from "lucide-react";

export const Methodology = () => {
  return (
    <section
      id="methodology"
      className="py-24 bg-slate-950 text-white relative overflow-hidden border-t border-slate-900"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-slate-900 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] opacity-20"></div>

        {/* Ambient Glows */}
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 bg-slate-900/50 border border-slate-700/50 px-3 py-1 rounded-full backdrop-blur-md mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
              <span className="text-xs font-medium text-brand-200 uppercase tracking-wide">
                Technical Architecture
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              Built for <span className="text-brand-400">Reliability</span> &{" "}
              <span className="text-indigo-400">Scale</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              AlzTwin utilizes an agile development methodology with a
              sophisticated tech stack designed for security, scalability, and
              real-time processing of sensitive medical data.
            </p>

            <div className="space-y-6">
              <div className="group flex items-start p-4 rounded-xl bg-slate-900/30 border border-transparent hover:border-slate-700 transition-colors">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 group-hover:border-brand-500/30 group-hover:bg-brand-500/10 transition-colors">
                  <Server size={20} className="text-brand-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">
                    Backend & Processing
                  </h3>
                  <p className="mt-1 text-slate-400 text-sm leading-relaxed">
                    Node.js server architecture handling structured database
                    inputs and orchestrating real-time sensor streams with low
                    latency.
                  </p>
                </div>
              </div>

              <div className="group flex items-start p-4 rounded-xl bg-slate-900/30 border border-transparent hover:border-slate-700 transition-colors">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
                  <Layers size={20} className="text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    AI & MRI Analysis
                  </h3>
                  <p className="mt-1 text-slate-400 text-sm leading-relaxed">
                    PyTorch & FSL pipelines for automated skull-stripping (BET),
                    tissue segmentation (FAST), and volumetric prediction.
                  </p>
                </div>
              </div>

              <div className="group flex items-start p-4 rounded-xl bg-slate-900/30 border border-transparent hover:border-slate-700 transition-colors">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors">
                  <Cpu size={20} className="text-emerald-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    IoT Integration
                  </h3>
                  <p className="mt-1 text-slate-400 text-sm leading-relaxed">
                    Microcontroller-driven wearable ecosystem continuously
                    tracking gait anomalies, heart rate variability, and patient
                    location.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-indigo-500 blur-[60px] opacity-20 rounded-full"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
              <h3 className="text-xl font-bold mb-8 border-b border-slate-800 pb-4 flex items-center">
                <Database className="mr-3 text-brand-400" size={20} />
                Data Flow Pipeline
              </h3>
              <div className="space-y-0 relative">
                {/* Connecting Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800"></div>

                <div className="relative flex items-center pb-8 last:pb-0">
                  <div className="relative z-10 w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-xs font-bold shadow-lg">
                    1
                  </div>
                  <div className="ml-6 flex-1 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <span className="text-sm font-medium text-slate-200">
                      Data Acquisition
                    </span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      IoT Wearables + MRI Imaging
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center pb-8 last:pb-0">
                  <div className="relative z-10 w-10 h-10 rounded-full bg-slate-800 border-2 border-brand-500/50 flex items-center justify-center text-xs font-bold shadow-lg text-brand-400">
                    2
                  </div>
                  <div className="ml-6 flex-1 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-brand-500/30 transition-colors">
                    <span className="text-sm font-medium text-slate-200">
                      Preprocessing & AI
                    </span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Feature Extraction & Volumetric Analysis
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center pb-8 last:pb-0">
                  <div className="relative z-10 w-10 h-10 rounded-full bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center text-xs font-bold shadow-lg text-indigo-400">
                    3
                  </div>
                  <div className="ml-6 flex-1 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                    <span className="text-sm font-medium text-slate-200">
                      Digital Twin Modeling
                    </span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Simulation & Disease Forecasting
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center">
                  <div className="relative z-10 w-10 h-10 rounded-full bg-brand-600 border-2 border-brand-400 flex items-center justify-center text-xs font-bold shadow-lg shadow-brand-500/30">
                    4
                  </div>
                  <div className="ml-6 flex-1 bg-brand-900/20 p-3 rounded-lg border border-brand-500/30">
                    <span className="text-sm font-bold text-brand-100">
                      Clinician Insight
                    </span>
                    <div className="text-xs text-brand-300/70 mt-0.5">
                      Dashboard Visualization & RAG Support
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
