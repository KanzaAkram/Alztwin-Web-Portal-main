import React from "react";
import { Eye, Brain, Clock } from "lucide-react";
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
    ? "bg-white/88 border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
    : "bg-slate-900/50 border border-slate-800";
  const panel = isLight
    ? "bg-white/90 border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    : "bg-slate-900/50 border border-slate-800";
  const heading = isLight ? "text-slate-950" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-slate-400";
  const subtle = isLight ? "text-slate-500" : "text-slate-500";
  const tableHead = isLight
    ? "bg-slate-100/90 text-slate-700"
    : "bg-slate-800/50 text-slate-400";
  const rowHover = isLight ? "hover:bg-emerald-50/70" : "hover:bg-slate-800/30";
  const avatar = isLight
    ? "bg-[linear-gradient(135deg,#0f766e,#155e75)] text-white"
    : "bg-slate-700 text-white";
  const filterIdle = isLight
    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
    : "bg-slate-800 text-slate-400";
  const filterActive = isLight
    ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] text-white"
    : "bg-blue-600 text-white";
  const stageTrack = isLight ? "bg-slate-200" : "bg-slate-700";
  const actionBtn = isLight
    ? "p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded-lg"
    : "p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`${statCard} rounded-xl p-5`}>
          <p className={`${subtle} text-xs uppercase`}>Total Patients</p>
          <p className={`text-2xl font-bold ${heading}`}>{stats.totalPatients}</p>
        </div>
        <div className={`${statCard} rounded-xl p-5`}>
          <p className={`${subtle} text-xs uppercase`}>High Risk</p>
          <p className="text-2xl font-bold text-red-500">{stats.highRisk}</p>
        </div>
        <div className={`${statCard} rounded-xl p-5`}>
          <p className={`${subtle} text-xs uppercase`}>Active Scans</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.scansThisWeek}</p>
        </div>
        <div className={`${statCard} rounded-xl p-5`}>
          <p className={`${subtle} text-xs uppercase`}>Avg Risk Score</p>
          <p className="text-2xl font-bold text-amber-500">{stats.avgRiskScore}%</p>
        </div>
      </div>

      <div className={`${panel} rounded-xl overflow-hidden`}>
        <div
          className={`p-5 border-b flex justify-between items-center ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <h2 className={`text-lg font-semibold ${heading}`}>Patient Registry</h2>
          <div className="flex space-x-2">
            {["all", "high", "medium", "low"].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1 rounded text-xs uppercase transition-colors ${
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
            <tbody className={isLight ? "divide-y divide-slate-200" : "divide-y divide-slate-800"}>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className={rowHover}>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatar}`}
                        >
                          {patient.avatar}
                        </div>
                        <div>
                          <p className={`${heading} font-medium`}>{patient.name}</p>
                          <p className={`${muted} text-xs`}>{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {patient.lastAnalysisAt ? (
                        <div className="flex items-center space-x-2">
                          <Brain size={14} className="text-cyan-600" />
                          <span className={`${heading} font-medium`}>{patient.diagnosis}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 italic text-xs">
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
                                } ${isLight ? "border-r border-white/70 last:border-0" : "border-r border-slate-900 last:border-0"}`}
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
                        className={`px-2 py-1 rounded text-xs border ${getRiskColor(
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
                      <button onClick={() => onViewPatient(patient.id)} className={actionBtn}>
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`p-8 text-center ${muted}`}>
                    No patients found.
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
