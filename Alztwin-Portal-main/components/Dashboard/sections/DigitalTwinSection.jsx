import React, { useMemo } from "react";
import {
  Brain,
  Upload,
  Move,
  Zap,
  TrendingUp,
  Activity,
  ChevronRight,
  BarChart3,
  Smartphone,
  TrendingDown,
  Minus,
  Pill,
  Plus,
  FileText,
  Stethoscope,
  CheckCircle,
  Info,
  History,
  Eye,
} from "lucide-react";
import ThreeBrainView from "../ThreeBrainView";
import RagRecommendationPanel from "../RagRecommendationPanel";

const STAGE_LADDER = [
  { stage: "Normal", color: "green" },
  { stage: "MCI", color: "yellow" },
  { stage: "Mild AD", color: "orange" },
  { stage: "Moderate AD", color: "red" },
  { stage: "Severe AD", color: "red" },
];

const DEVICE_FIELD_META = {
  sleepQuality: { label: "Sleep Quality", icon: "😴" },
  activityLevel: { label: "Activity Level", icon: "🚶" },
  steps: { label: "Steps", icon: "🚶" },
  heartRate: { label: "Heart Rate", icon: "❤️", suffix: " bpm" },
  temperature: { label: "Temperature", icon: "🌡️", suffix: " °C" },
  stressLevel: { label: "Stress Level", icon: "😰" },
  bloodPressure: { label: "Blood Pressure", icon: "🩺" },
  oxygenSaturation: { label: "Oxygen Saturation", icon: "🫁" },
  medication: { label: "Medication", icon: "💊" },
};

const numericOr = (v, fallback) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const getActiveStageIndex = (patient) => {
  if (!patient) return -1;
  if (typeof patient.stageLevel === "number") return patient.stageLevel;
  if (patient.stage) {
    const idx = STAGE_LADDER.findIndex(
      (s) => s.stage.toLowerCase() === patient.stage.toLowerCase()
    );
    if (idx >= 0) return idx;
  }
  return -1;
};

const EmptyBlock = ({ children }) => (
  <div className="text-center text-slate-500 text-sm py-6">{children}</div>
);

export default function DigitalTwinSection({
  patients,
  selectedPatientForDT,
  setSelectedPatientForDT,
  analyzing,
  generating3D = false,
  onFolderUpload,
  onShowNotesModal,
  onRunDiagnostics,
  onOpenCaregiverPreview,
  dtAiHistory = [],
  dtCognitiveTests = {},
}) {
  const progression = selectedPatientForDT?.progression || [];
  const regions = selectedPatientForDT?.regions || [];
  const cognitiveTests = selectedPatientForDT?.cognitiveTests || [];
  const treatmentPlan = selectedPatientForDT?.treatmentPlan || [];
  const recommendations = selectedPatientForDT?.recommendations || [];
  const activeStageIdx = getActiveStageIndex(selectedPatientForDT);

  const deviceMetrics = useMemo(() => {
    const deviceData = selectedPatientForDT?.deviceData;
    if (!deviceData || typeof deviceData !== "object") return [];

    // Pick the latest timestamped entry if deviceData is keyed by timestamps
    const keys = Object.keys(deviceData);
    if (keys.length === 0) return [];
    const sorted = [...keys].sort((a, b) => {
      const na = parseInt(a.replace(/^\D+/g, ""), 10) || 0;
      const nb = parseInt(b.replace(/^\D+/g, ""), 10) || 0;
      return na - nb;
    });
    const latest = deviceData[sorted[sorted.length - 1]];
    const source =
      latest && typeof latest === "object" && !Array.isArray(latest)
        ? latest
        : deviceData;

    return Object.entries(source)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([key, value]) => {
        const meta = DEVICE_FIELD_META[key] || { label: key, icon: "📊" };
        const displayValue =
          typeof value === "number"
            ? `${value}${meta.suffix || ""}`
            : String(value);
        return { key, label: meta.label, icon: meta.icon, value: displayValue };
      });
  }, [selectedPatientForDT]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900/80 via-purple-900/10 to-slate-900/80 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Brain className="mr-2 text-purple-400" size={22} />
          Select Patient for Digital Twin Analysis
        </h3>
        {patients.length === 0 ? (
          <EmptyBlock>No patients available.</EmptyBlock>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatientForDT(patient)}
                className={`p-4 rounded-xl border transition-all duration-300 text-left group ${
                  selectedPatientForDT?.id === patient.id
                    ? "bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20"
                    : "bg-slate-800/50 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg ${
                      selectedPatientForDT?.id === patient.id
                        ? "ring-2 ring-white/30"
                        : ""
                    }`}
                  >
                    {patient.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors">
                      {patient.name}
                    </p>
                    <p className="text-slate-400 text-xs">{patient.diagnosis}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        patient.riskLevel === "high"
                          ? "bg-red-500/20 text-red-400"
                          : patient.riskLevel === "medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {patient.riskLevel?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPatientForDT ? (
        <>
          <div className="lg:col-span-3">
            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden h-[600px] flex flex-col items-center justify-center">
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-500/30">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedPatientForDT?.meshUrl
                        ? "bg-green-400 animate-pulse"
                        : "bg-slate-600"
                    }`}
                  />
                  <span className="text-xs text-white font-medium">
                    {selectedPatientForDT?.meshUrl
                      ? "Interactive VTM Model"
                      : generating3D
                      ? "Auto-Generating..."
                      : selectedPatientForDT?.mriScans?.some(
                          (s) => s.base64Data || s.mriId
                        )
                      ? "Scans Ready"
                      : "Waiting for DICOM"}
                  </span>
                </div>
              </div>

              {generating3D ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
                  <p className="text-purple-400 font-semibold animate-pulse">
                    Reconstructing 3D Neuro-Atlas...
                  </p>
                  {selectedPatientForDT?.mriScans?.some(
                    (s) => s.base64Data || s.mriId
                  ) && (
                    <p className="text-slate-400 text-xs">
                      Auto-generating from {selectedPatientForDT.mriScans.length} stored scan
                      {selectedPatientForDT.mriScans.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              ) : selectedPatientForDT?.meshUrl ? (
                <div className="w-full h-full relative">
                  <ThreeBrainView plyUrl={selectedPatientForDT.meshUrl} />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700 pointer-events-none">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <Move size={12} /> Rotate • Zoom • Pan
                    </span>
                  </div>
                </div>
              ) : selectedPatientForDT?.mriScans?.some(
                (s) => s.base64Data || s.mriId
              ) ? (
                <div className="text-center p-8 z-10">
                  <div className="w-24 h-24 bg-slate-900 rounded-full border-2 border-dashed border-yellow-700/50 flex items-center justify-center mx-auto mb-6">
                    <Brain size={40} className="text-yellow-500/70" />
                  </div>
                  <h4 className="text-white font-bold text-xl mb-2">
                    Scans Found — Awaiting Generation
                  </h4>
                  <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                    {selectedPatientForDT.mriScans.length} MRI scan
                    {selectedPatientForDT.mriScans.length !== 1 ? "s" : ""} are
                    ready. The Digital Twin will generate automatically.
                  </p>
                  <p className="text-slate-500 text-xs mb-4">
                    Or upload a different folder manually:
                  </p>
                  <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 w-max mx-auto text-sm">
                    <Upload size={16} />
                    <span>Upload DICOM Folder</span>
                    <input
                      type="file"
                      className="hidden"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={onFolderUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="text-center p-8 z-10">
                  <div className="w-24 h-24 bg-slate-900 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto mb-6">
                    <Brain size={40} className="text-slate-500" />
                  </div>
                  <h4 className="text-white font-bold text-xl mb-2">
                    No Brain Reconstruction
                  </h4>
                  <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
                    No MRI scans found for this patient. Upload a DICOM folder to
                    generate the Digital Twin.
                  </p>
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 w-max mx-auto">
                    <Upload size={20} />
                    <span>Upload DICOM Folder</span>
                    <input
                      type="file"
                      className="hidden"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={onFolderUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {selectedPatientForDT?.meshInference && (
            <div className="mt-6 bg-slate-800/50 border-l-4 border-purple-500 rounded-xl p-5 shadow-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Zap size={18} className="text-purple-400" />
                <h4 className="text-purple-400 font-bold text-xs uppercase tracking-widest">
                  Volumetric AI Assessment
                </h4>
              </div>
              <p className="text-slate-300 text-sm italic leading-relaxed">
                "{selectedPatientForDT.meshInference}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="mr-2 text-orange-400" size={20} />
                Disease Progression Prediction
              </h3>
              {progression.length === 0 ? (
                <EmptyBlock>
                  No progression prediction available for this patient.
                </EmptyBlock>
              ) : (
                <>
                  <div className="relative h-48">
                    <div className="absolute inset-0 flex items-end justify-between px-4">
                      {progression.map((point, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center flex-1"
                        >
                          <div className="relative w-full flex justify-center mb-2">
                            <div
                              className={`w-8 rounded-t-lg transition-all duration-500 ${
                                point.predicted
                                  ? "bg-gradient-to-t from-orange-600/50 to-orange-400/30 border border-orange-500/30 border-dashed"
                                  : "bg-gradient-to-t from-purple-600 to-blue-500"
                              }`}
                              style={{
                                height: `${numericOr(point.progress, 0) * 1.5}px`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 uppercase">
                            {point.month}
                          </p>
                          <p
                            className={`text-xs font-medium ${
                              point.predicted ? "text-orange-400" : "text-white"
                            }`}
                          >
                            {point.stage}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {numericOr(point.progress, 0)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-600 to-blue-500" />
                        <span className="text-xs text-slate-400">Current</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-orange-500/50 border border-dashed border-orange-500" />
                        <span className="text-xs text-slate-400">Predicted</span>
                      </div>
                    </div>
                    {selectedPatientForDT.predictedDecline && (
                      <p className="text-xs text-slate-500">
                        Decline rate: {selectedPatientForDT.predictedDecline}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-purple-900/20 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Brain className="mr-2 text-purple-400" size={20} />
                Current Stage
              </h3>
              {activeStageIdx < 0 ? (
                <EmptyBlock>No stage recorded for this patient.</EmptyBlock>
              ) : (
                <div className="space-y-3">
                  {STAGE_LADDER.map((item, idx) => {
                    const isActive = idx === activeStageIdx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center space-x-3 p-2 rounded-lg ${
                          isActive
                            ? "bg-yellow-500/10 border border-yellow-500/30"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isActive
                              ? "bg-yellow-400 ring-4 ring-yellow-400/30"
                              : item.color === "green"
                              ? "bg-green-500/30"
                              : item.color === "yellow"
                              ? "bg-yellow-500/30"
                              : item.color === "orange"
                              ? "bg-orange-500/30"
                              : "bg-red-500/30"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isActive
                              ? "text-yellow-400 font-semibold"
                              : "text-slate-400"
                          }`}
                        >
                          {item.stage}
                        </span>
                        {isActive && (
                          <ChevronRight
                            size={14}
                            className="text-yellow-400 ml-auto"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* === AI DIAGNOSTICS PANEL === */}
          <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Activity className="mr-2 text-blue-400" size={22} />
                AI Diagnostics
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCaregiverPreview}
                  disabled={
                    analyzing ||
                    !selectedPatientForDT?.currentStage ||
                    selectedPatientForDT.currentStage === "Pending Analysis"
                  }
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50 border border-slate-700"
                  title="Preview caregiver report"
                >
                  <Eye size={16} />
                  <span>Preview Report</span>
                </button>

                <button
                  onClick={onRunDiagnostics}
                  disabled={analyzing}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                  {analyzing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Activity size={16} />
                  )}
                  <span>{analyzing ? "Analyzing..." : "Run AI Diagnostics"}</span>
                </button>
              </div>
            </div>

            {selectedPatientForDT?.currentStage &&
            selectedPatientForDT.currentStage !== "Pending Analysis" ? (
              <div className="space-y-4">
                {/* Stage Assessment + Trajectory side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Disease Stage Assessment */}
                  <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-white font-semibold flex items-center mb-3">
                      <Brain className="mr-2 text-blue-400" size={18} />
                      Disease Stage Assessment
                    </h4>
                    <div className="h-2 bg-slate-700 rounded-full flex mb-2">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 h-full border-r border-slate-900 last:border-0 ${
                            step <= (selectedPatientForDT.stageLevel || 0)
                              ? "bg-blue-500"
                              : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 uppercase font-medium mb-3">
                      <span>Normal</span><span>MCI</span><span>Mild</span><span>Severe</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700 mb-3">
                      <div>
                        <p className="text-xs text-slate-400 uppercase">Current Stage</p>
                        <p className="text-xl font-bold text-white">{selectedPatientForDT.currentStage}</p>
                      </div>
                      <span className="text-green-400 text-xs font-bold border border-green-400/30 px-2 py-1 rounded">
                        AI Analyzed
                      </span>
                    </div>
                    {selectedPatientForDT.inferenceText && (
                      <div className="p-3 bg-blue-500/10 border-l-2 border-blue-500 rounded">
                        <p className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center">
                          <Info size={12} className="mr-1" /> AI Clinical Insight
                        </p>
                        <p className="text-sm text-slate-300 italic leading-relaxed">
                          "{selectedPatientForDT.inferenceText}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progression Trajectory */}
                  <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-white font-semibold flex items-center mb-3">
                      <TrendingDown className="mr-2 text-purple-400" size={18} />
                      Progression Trajectory
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase mb-1">Predicted Path</p>
                        <p className="text-base font-bold text-white leading-tight">
                          {selectedPatientForDT.predictedDecline || "Stable"}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase mb-1">Est. Timeline</p>
                        <p className="text-base font-bold text-white">
                          {selectedPatientForDT.trajectoryMonths || "12 (Est.)"}
                        </p>
                      </div>
                    </div>
                    {selectedPatientForDT.trajInference && (
                      <div className="p-3 bg-purple-500/10 border-l-2 border-purple-500 rounded">
                        <p className="text-xs text-purple-400 font-bold uppercase mb-1 flex items-center">
                          <TrendingDown size={12} className="mr-1" /> Trajectory Insight
                        </p>
                        <p className="text-sm text-slate-300 italic leading-relaxed">
                          "{selectedPatientForDT.trajInference}"
                        </p>
                      </div>
                    )}
                    {selectedPatientForDT.aiConfidence != null && (
                      <p className="text-xs text-slate-500 mt-3">
                        Model confidence:{" "}
                        <span className="text-slate-300 font-medium">
                          {Math.round(selectedPatientForDT.aiConfidence * 100)}%
                        </span>
                        {selectedPatientForDT.lastAnalysisAt && (
                          <span> · Last run: {selectedPatientForDT.lastAnalysisAt}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Analysis History */}
                {dtAiHistory.length > 0 && (
                  <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-white font-semibold flex items-center mb-3">
                      <History className="mr-2 text-cyan-400" size={18} />
                      Analysis History
                      <span className="ml-2 text-xs text-slate-400 font-normal">
                        ({dtAiHistory.length} {dtAiHistory.length === 1 ? "run" : "runs"})
                      </span>
                    </h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {dtAiHistory.map((h, idx) => {
                        const ts = h.createdAt?.seconds
                          ? new Date(h.createdAt.seconds * 1000).toLocaleDateString()
                          : "—";
                        return (
                          <div
                            key={h.id || idx}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              idx === 0
                                ? "bg-blue-500/10 border-blue-500/30"
                                : "bg-slate-800/50 border-slate-700"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-blue-400" : "bg-slate-500"}`} />
                              <div>
                                <p className="text-white text-sm font-medium">{h.currentStage || "Unknown"}</p>
                                <p className="text-slate-400 text-xs">{ts}</p>
                              </div>
                            </div>
                            {h.predictedDecline && (
                              <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                                {h.predictedDecline}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              {/* Cognitive Test Scores */}
              {Object.keys(dtCognitiveTests).length > 0 && (
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                  <h4 className="text-white font-semibold flex items-center mb-4">
                    <BarChart3 className="mr-2 text-cyan-400" size={18} />
                    Cognitive Test Scores
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(dtCognitiveTests).map(([testType, group]) => {
                      const scores = group.pastScores || [];
                      const latest = scores[scores.length - 1];
                      const maxScore = testType === "MMSE" ? 30 : testType === "ADAS" ? 70 : 30;
                      const pct = latest != null ? Math.round((latest / maxScore) * 100) : null;
                      const color =
                        pct == null ? "slate" : pct >= 70 ? "green" : pct >= 40 ? "yellow" : "red";
                      return (
                        <div key={testType} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400 uppercase font-medium">{testType}</span>
                            <span className={`text-lg font-bold text-${color}-400`}>
                              {latest ?? "—"}<span className="text-xs text-slate-500">/{maxScore}</span>
                            </span>
                          </div>
                          {pct != null && (
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                              <div
                                className={`h-full rounded-full bg-${color}-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                          {scores.length > 1 && (
                            <div className="flex items-end space-x-0.5 h-8">
                              {scores.map((s, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-t ${i === scores.length - 1 ? `bg-${color}-500` : "bg-slate-600"}`}
                                  style={{ height: `${Math.round((s / maxScore) * 100)}%` }}
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {group.history?.length || 0} test{(group.history?.length || 0) !== 1 ? "s" : ""} recorded
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No diagnostic results yet. Click <span className="text-blue-400 font-medium">Run AI Diagnostics</span> to analyze this patient's MRI scans.
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="mr-2 text-blue-400" size={20} />
              Brain Region Analysis
            </h3>
            {regions.length === 0 ? (
              <EmptyBlock>
                No region analysis available for this patient.
              </EmptyBlock>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {regions.map((region, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-800/50 border rounded-xl p-4 transition-all hover:scale-105 ${
                      region.color === "red"
                        ? "border-red-500/30 hover:border-red-500/50"
                        : region.color === "yellow"
                        ? "border-yellow-500/30 hover:border-yellow-500/50"
                        : "border-green-500/30 hover:border-green-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{region.icon || "🧠"}</span>
                      {region.status && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            region.color === "red"
                              ? "bg-red-500/20 text-red-400"
                              : region.color === "yellow"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {region.status}
                        </span>
                      )}
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">
                      {region.region}
                    </h4>
                    {region.desc && (
                      <p className="text-slate-500 text-xs mb-3">{region.desc}</p>
                    )}
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          region.color === "red"
                            ? "bg-gradient-to-r from-red-600 to-red-400"
                            : region.color === "yellow"
                            ? "bg-gradient-to-r from-yellow-600 to-yellow-400"
                            : "bg-gradient-to-r from-green-600 to-green-400"
                        }`}
                        style={{ width: `${numericOr(region.score, 0)}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-slate-400 mt-1">
                      {numericOr(region.score, 0)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="mr-2 text-cyan-400" size={20} />
                Cognitive Test History
              </h3>
              {cognitiveTests.length === 0 ? (
                <EmptyBlock>No cognitive tests recorded.</EmptyBlock>
              ) : (
                <div className="space-y-4">
                  {cognitiveTests.map((test, idx) => {
                    const scores = Array.isArray(test.scores) ? test.scores : [];
                    const max = numericOr(test.max, 30);
                    return (
                      <div key={idx} className="bg-slate-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium text-sm">
                            {test.test}
                          </span>
                          <span className="text-cyan-400 font-bold">
                            {numericOr(test.current, "—")}/{max}
                          </span>
                        </div>
                        {scores.length > 0 && (
                          <>
                            <div className="flex items-end space-x-1 h-12">
                              {scores.map((score, i) => (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center"
                                >
                                  <div
                                    className={`w-full rounded-t ${
                                      i === scores.length - 1
                                        ? "bg-cyan-500"
                                        : "bg-slate-600"
                                    }`}
                                    style={{
                                      height: `${(score / max) * 100}%`,
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-slate-500">
                                Earliest
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Current
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Smartphone className="mr-2 text-green-400" size={20} />
                Device Physiological Data
              </h3>
              {deviceMetrics.length === 0 ? (
                <EmptyBlock>No device data recorded.</EmptyBlock>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {deviceMetrics.map((item) => (
                    <div
                      key={item.key}
                      className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{item.icon}</span>
                        <Minus size={14} className="text-slate-400" />
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {item.value}
                      </p>
                      <p className="text-slate-500 text-xs">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 via-blue-900/10 to-slate-900 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Pill className="mr-2 text-blue-400" size={20} />
                Treatment Notes & Recommendations
              </h3>
              <button
                onClick={onShowNotesModal}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                <Plus size={16} />
                <span>Add Note</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <FileText size={16} className="mr-2 text-purple-400" />
                  Current Treatment Plan
                </h4>
                {treatmentPlan.length === 0 ? (
                  <EmptyBlock>No treatment plan recorded.</EmptyBlock>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-300">
                    {treatmentPlan.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle
                          size={14}
                          className="text-green-400 mt-0.5 flex-shrink-0"
                        />
                        <span>
                          {typeof item === "string" ? item : item.text || ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <Stethoscope size={16} className="mr-2 text-cyan-400" />
                  Clinical Recommendations
                </h4>
                {recommendations.length === 0 ? (
                  <EmptyBlock>No recommendations recorded.</EmptyBlock>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-300">
                    {recommendations.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <ChevronRight
                          size={14}
                          className="text-cyan-400 mt-0.5 flex-shrink-0"
                        />
                        <span>
                          {typeof item === "string" ? item : item.text || ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* RAG-powered Clinician Recommendation */}
          <RagRecommendationPanel patient={selectedPatientForDT} />
        </>
      ) : (
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 border border-purple-500/20 rounded-xl p-16 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
            <Brain size={80} className="relative text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Select a Patient</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Choose a patient above to explore their comprehensive Digital Twin
            analysis including MRI visualization, disease progression, and
            treatment recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
