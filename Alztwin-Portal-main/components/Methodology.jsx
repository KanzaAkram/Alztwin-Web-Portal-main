import React from "react";
import { Cpu, Database, Server, Layers } from "lucide-react";
import { useTheme } from "./ThemeContext";

const STACK_ITEMS = [
  { icon: Server,   title: "Backend & Processing",   desc: "FastAPI microservices orchestrate AI pipeline execution, real-time IoT ingestion, and secure medical data processing at scale." },
  { icon: Database, title: "Data Architecture",       desc: "Firebase Firestore provides a real-time, scalable NoSQL backbone for patient records, time-series sensor data, and clinical notes." },
  { icon: Cpu,      title: "AI & ML Engine",          desc: "Custom PyTorch models trained on longitudinal MRI data, combined with an RAG retrieval engine for evidence-based recommendations." },
  { icon: Layers,   title: "Frontend & Visualization",desc: "React-powered dashboard with Three.js 3D brain rendering and Recharts for real-time cognitive trajectory analysis." },
];

export const Methodology = () => {
  const { isLight } = useTheme();

  return (
    <section id="methodology" className={`py-24 relative overflow-hidden border-t ${
      isLight ? "bg-white border-gray-200 text-gray-900" : "bg-slate-950 text-white border-slate-900"
    }`}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-slate-900 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] opacity-20"></div>
        <div className={`absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse-slow ${
          isLight ? "bg-emerald-100/60" : "bg-blue-600/10"
        }`}></div>
        <div className={`absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse-slow ${
          isLight ? "bg-teal-100/50" : "bg-indigo-600/10"
        }`} style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full mb-6 border ${
              isLight ? "bg-gray-100 border-gray-200 text-gray-600" : "bg-slate-900/50 border-slate-700/50 text-brand-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLight ? "bg-emerald-500" : "bg-brand-400"}`}></span>
              <span className="text-xs font-medium uppercase tracking-wide">Technical Architecture</span>
            </div>

            <h2 className={`text-3xl md:text-4xl font-bold mb-6 tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
              Built for{" "}
              <span className={isLight ? "text-gray-900" : "text-brand-400"}>Reliability</span>{" "}
              &{" "}
              <span className={isLight ? "text-gray-900" : "text-indigo-400"}>Scale</span>
            </h2>

            <p className={`text-lg mb-10 leading-relaxed ${isLight ? "text-gray-600" : "text-slate-400"}`}>
              AlzTwin utilizes an agile development methodology with a sophisticated tech stack designed for security, scalability, and real-time processing of sensitive medical data.
            </p>

            <div className="space-y-4">
              {STACK_ITEMS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className={`group flex items-start p-4 rounded-xl border transition-all ${
                  isLight
                    ? "bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-50"
                    : "bg-slate-900/30 border-transparent hover:border-slate-700"
                }`}>
                  <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border transition-colors ${
                    isLight
                      ? "bg-gray-100 border-gray-200 group-hover:bg-gray-200 group-hover:border-gray-300"
                      : "bg-slate-800 border-slate-700 group-hover:border-brand-500/30 group-hover:bg-brand-500/10"
                  }`}>
                    <Icon size={20} className={isLight ? "text-emerald-700" : "text-brand-400"} />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>{title}</h3>
                    <p className={`text-sm mt-1 leading-relaxed ${isLight ? "text-gray-500" : "text-slate-400"}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Progress Bars */}
          <div className="flex flex-col gap-4">
            {[
              { label: "MRI Analysis Pipeline",   pct: 94 },
              { label: "IoT Data Ingestion",       pct: 87 },
              { label: "Cognitive AI Accuracy",    pct: 91 },
              { label: "System Uptime",            pct: 99 },
            ].map(({ label, pct }) => (
              <div key={label} className={`rounded-2xl p-6 border ${
                isLight ? "bg-white border-gray-200 shadow-sm" : "bg-slate-900/60 border-slate-800"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-slate-300"}`}>{label}</span>
                  <span className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{pct}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isLight ? "bg-gray-100" : "bg-slate-800"}`}>
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
