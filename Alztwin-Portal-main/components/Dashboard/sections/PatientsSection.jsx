import React from "react";
import { Eye } from "lucide-react";
import { getRiskColor } from "../config";

export default function PatientsSection({
  stats,
  filteredPatients,
  selectedFilter,
  setSelectedFilter,
  onViewPatient,
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase">Total Patients</p>
          <p className="text-2xl font-bold text-white">{stats.totalPatients}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase">High Risk</p>
          <p className="text-2xl font-bold text-white text-red-400">
            {stats.highRisk}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase">Active Scans</p>
          <p className="text-2xl font-bold text-white text-green-400">
            {stats.scansThisWeek}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase">Avg Risk Score</p>
          <p className="text-2xl font-bold text-white text-yellow-400">
            {stats.avgRiskScore}%
          </p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Patient Registry</h2>
          <div className="flex space-x-2">
            {["all", "high", "medium", "low"].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1 rounded text-xs uppercase ${
                  selectedFilter === f
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-medium">
              <tr>
                <th className="px-5 py-3 text-left">Patient</th>
                <th className="px-5 py-3 text-left">Diagnosis</th>
                <th className="px-5 py-3 text-left">Risk</th>
                <th className="px-5 py-3 text-left">Last Scan</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                          {patient.avatar}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {patient.name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {patient.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {patient.diagnosis}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs border ${getRiskColor(
                          patient.riskLevel
                        )}`}
                      >
                        {patient.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {patient.lastScan}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onViewPatient(patient.id)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-slate-500"
                  >
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
