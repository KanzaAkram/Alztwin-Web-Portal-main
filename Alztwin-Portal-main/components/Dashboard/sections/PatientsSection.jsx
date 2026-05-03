import React from "react";
import { Eye, Brain, Clock, Users, AlertTriangle, ScanLine, Gauge } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { getRiskColor } from "../config";

export default function PatientsSection({
  stats,
  filteredPatients,
  selectedFilter,
  setSelectedFilter,
  onViewPatient,
}) {
  const { isLight } = useTheme();

  const statCard = isLight
    ? "bg-[#d8eee9]/92 border border-teal-900/10 shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
    : "bg-slate-900/50 border border-slate-800";
  const panel = isLight
    ? "bg-[#d8eee9]/92 border border-teal-900/10 shadow-[0_24px_58px_rgba(15,23,42,0.10)]"
    : "bg-slate-900/50 border border-slate-800";
  const heading = isLight ? "text-[#102a37]" : "text-white";
  const muted = isLight ? "text-[#365565]" : "text-slate-400";
  const subtle = isLight ? "text-[#517080]" : "text-slate-500";
  const tableHead = isLight
    ? "bg-[#cfe7e2] text-[#315666] border-y border-teal-900/10"
    : "bg-slate-800/50 text-slate-400";
  const rowBase = isLight ? "bg-[#eaf7f4]/42" : "";
  const rowHover = isLight ? "hover:bg-[#cfe7e2]/70" : "hover:bg-slate-800/30";
  const avatar = isLight
    ? "bg-[linear-gradient(135deg,#0f766e,#155e75)] text-white shadow-[0_10px_22px_rgba(15,118,110,0.22)]"
    : "bg-slate-700 text-white";
  const filterIdle = isLight
    ? "bg-[#eaf7f4] text-[#315666] hover:bg-[#cfe7e2] border border-teal-900/10"
    : "bg-slate-800 text-slate-400";
  const filterActive = isLight
    ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] text-white shadow-[0_10px_24px_rgba(15,118,110,0.18)] border border-transparent"
    : "bg-blue-600 text-white";
  const stageTrack = isLight ? "bg-teal-900/12" : "bg-slate-700";
  const actionBtn = isLight
    ? "p-2 text-[#315666] hover:text-teal-950 hover:bg-[#cfe7e2] rounded-lg border border-transparent hover:border-teal-900/10"
    : "p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg";
  const statItems = [
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      valueClass: heading,
      iconClass: isLight ? "text-teal-800 bg-teal-700/10" : "text-blue-400 bg-blue-500/10",
    },
    {
      label: "High Risk",
      value: stats.highRisk,
      icon: AlertTriangle,
      valueClass: "text-red-600",
      iconClass: "text-red-600 bg-red-500/10",
    },
    {
      label: "Active Scans",
      value: stats.scansThisWeek,
      icon: ScanLine,
      valueClass: "text-emerald-700",
      iconClass: "text-emerald-700 bg-emerald-500/10",
    },
    {
      label: "Avg Risk Score",
      value: `${stats.avgRiskScore}%`,
      icon: Gauge,
      valueClass: "text-amber-600",
      iconClass: "text-amber-600 bg-amber-500/10",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statItems.map(({ label, value, icon: Icon, valueClass, iconClass }) => (
          <div key={label} className={`${statCard} rounded-xl p-5 relative overflow-hidden`}>
            {isLight && (
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-700/25 to-transparent" />
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`${subtle} text-[11px] font-semibold uppercase tracking-[0.12em]`}>{label}</p>
                <p className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconClass}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${panel} rounded-xl overflow-hidden`}>
        <div
          className={`p-5 border-b flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center ${
            isLight ? "border-teal-900/10 bg-[#cfe7e2]/45" : "border-slate-800"
          }`}
        >
          <div>
            <h2 className={`text-lg font-semibold ${heading}`}>Patient Registry</h2>
            <p className={`text-sm mt-1 ${muted}`}>
              Review diagnosis status, model confidence, and risk signals.
            </p>
          </div>
          <div className="flex space-x-2">
            {["all", "high", "medium", "low"].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  selectedFilter === f ? filterActive : filterIdle
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${tableHead} text-xs uppercase font-medium`}>
              <tr>
                <th className="px-5 py-3 text-left">Patient</th>
                <th className="px-5 py-3 text-left">AI Diagnosis</th>
                <th className="px-5 py-3 text-left">Stage</th>
                <th className="px-5 py-3 text-left">Risk</th>
                <th className="px-5 py-3 text-left">Confidence</th>
                <th className="px-5 py-3 text-left">Last Analyzed</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={isLight ? "divide-y divide-teal-900/10" : "divide-y divide-slate-800"}>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className={`${rowBase} ${rowHover} transition-colors`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatar}`}
                        >
                          {patient.avatar}
                        </div>
                        <div>
                          <p className={`${heading} font-semibold`}>{patient.name}</p>
                          <p className={`${muted} text-xs`}>{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {patient.lastAnalysisAt ? (
                        <div className="flex items-center space-x-2">
                          <Brain size={14} className={isLight ? "text-teal-800" : "text-cyan-600"} />
                          <span className={`${heading} font-medium`}>{patient.diagnosis}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-amber-700 italic text-xs">
                          Pending AI Analysis
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {typeof patient.stageLevel === "number" ? (
                        <div className="flex items-center space-x-2">
                          <div className={`h-1.5 w-16 rounded-full flex overflow-hidden ${stageTrack}`}>
                            {[0, 1, 2, 3].map((step) => (
                              <div
                                key={step}
                                className={`flex-1 ${
                                  step <= patient.stageLevel
                                    ? step >= 3
                                      ? "bg-red-500"
                                      : step >= 2
                                      ? "bg-orange-400"
                                      : step >= 1
                                      ? "bg-yellow-400"
                                      : "bg-green-500"
                                    : ""
                                } ${isLight ? "border-r border-[#d8eee9] last:border-0" : "border-r border-slate-900 last:border-0"}`}
                              />
                            ))}
                          </div>
                          <span className={`text-xs ${muted}`}>{patient.stageLevel}/3</span>
                        </div>
                      ) : (
                        <span className={`${subtle} text-xs`}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold border ${getRiskColor(
                          patient.riskLevel
                        )}`}
                      >
                        {patient.riskLevel.toUpperCase()}
                        {typeof patient.riskScore === "number" && patient.riskScore > 0 && (
                          <span className="ml-1 opacity-70">{patient.riskScore}%</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {patient.aiConfidence != null ? (
                        <span className={`${heading} font-medium`}>
                          {(patient.aiConfidence * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className={`${subtle} text-xs`}>—</span>
                      )}
                    </td>
                    <td className={`px-5 py-4 text-sm ${muted}`}>
                      {patient.lastAnalysisAt ? (
                        <div className="flex items-center space-x-1">
                          <Clock size={12} className={subtle} />
                          <span>{patient.lastAnalysisAt}</span>
                        </div>
                      ) : (
                        <span className={`${subtle} text-xs`}>{patient.lastScan}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewPatient(patient);
                        }}
                        className={actionBtn}
                        title={`View ${patient.name}`}
                        aria-label={`View ${patient.name}`}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`p-10 text-center ${muted}`}>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#cfe7e2] text-teal-800">
                      <Users size={22} />
                    </div>
                    <p className={`font-semibold ${heading}`}>No patients found</p>
                    <p className={`mt-1 text-sm ${muted}`}>Try a different risk filter or search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
