import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Brain,
  BarChart3,
  RefreshCw,
  UserRound,
  AlertCircle,
  LineChart,
  Circle,
} from "lucide-react";
import { API_COGNITIVE_URL, formatDate } from "../config";
import { getPatientCognitiveTestsByType } from "../../../services/userService";
import { useTheme } from "../../ThemeContext";

const sortTestTypes = (a, b) => {
  const priority = { FAQ: 0, MMSE: 1, ADAS: 2 };
  const pa = priority[a] ?? 99;
  const pb = priority[b] ?? 99;
  if (pa !== pb) return pa - pb;
  return a.localeCompare(b);
};

const getPredictionErrorMessage = (error) => {
  const status = error?.response?.status;
  const responseData = error?.response?.data;
  const responseText =
    typeof responseData === "string"
      ? responseData
      : JSON.stringify(responseData || "");

  if (status === 403 && /site disabled|web app is stopped/i.test(responseText)) {
    return "Cognitive prediction API is unavailable because the Azure web app is stopped (403 Site Disabled). Start the backend app service or point /api/cognitive to a running endpoint.";
  }

  if (status === 403) {
    return "Cognitive prediction API denied this request (403). Check backend authorization and deployment status.";
  }

  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Prediction request failed."
  );
};

export default function CognitiveTestsSection({ patients }) {
  const { isLight } = useTheme();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [testsByType, setTestsByType] = useState({});
  const [predictionByType, setPredictionByType] = useState({});
  const [predictingByType, setPredictingByType] = useState({});
  const [historyError, setHistoryError] = useState("");
  const heading = isLight ? "text-[#102a37]" : "text-white";
  const muted = isLight ? "text-[#365565]" : "text-slate-400";
  const subtle = isLight ? "text-[#517080]" : "text-slate-500";
  const panel = isLight
    ? "bg-[#d8eee9]/92 border-teal-900/10 shadow-[0_24px_58px_rgba(15,23,42,0.10)]"
    : "bg-slate-900/60 border-slate-800 shadow-cyan-900/10";
  const chip = isLight
    ? "bg-[#eaf7f4] border-teal-900/10 text-[#315666]"
    : "bg-slate-800/80 border-slate-700 text-slate-200";

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  useEffect(() => {
    const load = async () => {
      if (!selectedPatientId) {
        setTestsByType({});
        setPredictionByType({});
        return;
      }

      setLoadingHistory(true);
      setHistoryError("");
      setPredictionByType({});

      try {
        const grouped = await getPatientCognitiveTestsByType(
          selectedPatient || { id: selectedPatientId }
        );
        setTestsByType(grouped);
      } catch (error) {
        console.error("Failed to load cognitive tests:", error);
        setHistoryError("Failed to load cognitive test history for this patient.");
        setTestsByType({});
      } finally {
        setLoadingHistory(false);
      }
    };

    load();
  }, [selectedPatientId, selectedPatient]);

  const testTypes = useMemo(
    () => Object.keys(testsByType).sort(sortTestTypes),
    [testsByType]
  );

  const totalRecords = useMemo(
    () => testTypes.reduce((sum, type) => sum + (testsByType[type]?.history?.length || 0), 0),
    [testTypes, testsByType]
  );

  const runPrediction = async (testType) => {
    const group = testsByType[testType];
    if (!group || !Array.isArray(group.pastScores) || group.pastScores.length < 1) {
      return;
    }

    setPredictingByType((prev) => ({ ...prev, [testType]: true }));

    try {
      const payload = {
        test_type: testType,
        past_scores: group.pastScores,
      };

      const response = await axios.post(API_COGNITIVE_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setPredictionByType((prev) => ({
        ...prev,
        [testType]: {
          ok: true,
          data: response.data || {},
        },
      }));
    } catch (error) {
      const message = getPredictionErrorMessage(error);

      setPredictionByType((prev) => ({
        ...prev,
        [testType]: {
          ok: false,
          error: message,
        },
      }));
    } finally {
      setPredictingByType((prev) => ({ ...prev, [testType]: false }));
    }
  };

  const runAllPredictions = async () => {
    for (const testType of testTypes) {
      await runPrediction(testType);
    }
  };

  const getCardTone = (testType) => {
    if (isLight) {
      if (testType === "FAQ") {
        return "from-amber-50 via-[#d8eee9] to-[#eaf7f4] border-amber-300/70";
      }
      if (testType === "MMSE") {
        return "from-cyan-50 via-[#d8eee9] to-[#eaf7f4] border-cyan-300/70";
      }
      if (testType === "ADAS") {
        return "from-purple-50 via-[#d8eee9] to-[#eaf7f4] border-purple-300/70";
      }
      return "from-blue-50 via-[#d8eee9] to-[#eaf7f4] border-teal-900/10";
    }

    if (testType === "FAQ") {
      return "from-amber-500/20 via-slate-900 to-slate-900 border-amber-400/30";
    }
    if (testType === "MMSE") {
      return "from-cyan-500/20 via-slate-900 to-slate-900 border-cyan-400/30";
    }
    if (testType === "ADAS") {
      return "from-purple-500/20 via-slate-900 to-slate-900 border-purple-400/30";
    }
    return "from-blue-500/10 via-slate-900 to-slate-900 border-slate-700";
  };

  const renderTestCard = (testType, index) => {
    const group = testsByType[testType];
    if (!group) return null;

    const prediction = predictionByType[testType];
    const canPredict = group.pastScores.length >= 1;
    const latestScore = group.pastScores[group.pastScores.length - 1];

    return (
      <div
        key={testType}
        className={`bg-gradient-to-br ${getCardTone(
          testType
        )} border rounded-2xl p-5 shadow-lg transition-all duration-300 ${
          isLight
            ? "shadow-[0_16px_38px_rgba(15,23,42,0.08)] hover:border-teal-700/35"
            : "shadow-slate-950/50 hover:border-cyan-400/40"
        }`}
      >
        <div className={`flex items-start justify-between gap-3 pb-4 border-b ${
          isLight ? "border-teal-900/10" : "border-slate-800/80"
        }`}>
          <div className="space-y-1.5">
            <h4 className={`${heading} font-semibold text-lg tracking-wide flex items-center`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-[11px] mr-2 ${
                isLight
                  ? "bg-[#eaf7f4] border-teal-900/10 text-[#315666]"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}>
                {index + 1}
              </span>
              {testType}
            </h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className={`px-2 py-1 rounded-md border ${chip}`}>
                Records: {group.history.length}
              </span>
              <span className={`px-2 py-1 rounded-md border ${chip}`}>
                Scores: {group.pastScores.length}
              </span>
              {Number.isFinite(latestScore) && (
                <span className={`px-2 py-1 rounded-md border ${
                  isLight
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
                }`}>
                  Latest: {latestScore}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => runPrediction(testType)}
            disabled={!canPredict || !!predictingByType[testType]}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center"
          >
            {predictingByType[testType] ? (
              <>
                <RefreshCw size={14} className="mr-2 animate-spin" />
                Running...
              </>
            ) : (
              "Predict Future Scores"
            )}
          </button>
        </div>

        <div className={`mt-3 text-xs ${muted}`}>
          Past scores: <span className={`${heading} font-semibold`}>{group.pastScores.join(", ") || "None"}</span>
        </div>

        <div className="mt-4 space-y-2 max-h-40 overflow-auto pr-1">
          {group.history.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg px-3 py-2.5 text-xs flex items-center justify-between ${
                isLight
                  ? "bg-[#eaf7f4] border-teal-900/10 text-[#294654]"
                  : "bg-slate-800/70 border-slate-700 text-slate-300"
              }`}
            >
              <span className="truncate pr-2">{item.classification || item.testType}</span>
              <span className={subtle}>
                Score: {Number.isFinite(item.score) ? item.score : "N/A"} · {formatDate(item.completedAtRaw)}
              </span>
            </div>
          ))}
        </div>

        {!canPredict && (
          <div className="mt-3 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 flex items-center">
            <AlertCircle size={14} className="mr-2" />
            No valid score found yet for this test type.
          </div>
        )}

        {prediction && prediction.ok && (
          <div className={`mt-4 border rounded-xl p-3 text-sm space-y-2 ${
            isLight
              ? "border-emerald-200 bg-emerald-50/80 text-[#294654]"
              : "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900 text-slate-200"
          }`}>
            <p className={`${isLight ? "text-emerald-800" : "text-emerald-300"} font-semibold flex items-center`}>
              <LineChart size={14} className="mr-1.5" /> Prediction response
            </p>
            {Array.isArray(prediction.data.future_scores) && (
              <p className={`text-xs ${muted}`}>
                Future scores: {prediction.data.future_scores.join(", ")}
              </p>
            )}
            {Array.isArray(prediction.data.future_timeline) && (
              <p className={`text-xs ${muted}`}>
                Future timeline: {prediction.data.future_timeline.join(", ")}
              </p>
            )}
            {prediction.data.ai_inference && (
              <p className={`text-xs break-words ${subtle}`}>{prediction.data.ai_inference}</p>
            )}
            {prediction.data.graph_base64_image && (
              <img
                src={prediction.data.graph_base64_image}
                alt={`${testType} progression graph`}
                className={`mt-2 rounded-lg border ${isLight ? "border-teal-900/10" : "border-slate-700"}`}
              />
            )}
          </div>
        )}

        {prediction && !prediction.ok && (
          <div className={`mt-4 border rounded-xl p-3 text-xs break-words ${
            isLight
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-red-500/30 bg-gradient-to-br from-red-500/10 to-slate-900 text-red-300"
          }`}>
            {prediction.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${isLight ? "cog-light text-slate-900" : ""}`}>
      {isLight && (
        <style>{`
          .cog-light .bg-gradient-to-br.from-slate-900,
          .cog-light .bg-gradient-to-br.from-amber-500\\/20,
          .cog-light .bg-gradient-to-br.from-cyan-500\\/20,
          .cog-light .bg-gradient-to-br.from-purple-500\\/20,
          .cog-light .bg-gradient-to-br.from-blue-500\\/10 {
            background: linear-gradient(135deg, #e8f6f3 0%, #e5f4f7 54%, #e8f0fb 100%) !important;
          }

          .cog-light .bg-slate-900\\/60,
          .cog-light .bg-slate-900\\/50,
          .cog-light .bg-slate-900\\/40,
          .cog-light .bg-slate-800,
          .cog-light .bg-slate-800\\/90,
          .cog-light .bg-slate-800\\/80,
          .cog-light .bg-slate-800\\/70 {
            background: rgba(232, 246, 243, 0.95) !important;
          }

          .cog-light .border-slate-800,
          .cog-light .border-slate-800\\/80,
          .cog-light .border-slate-700,
          .cog-light .border-slate-700\\/60 {
            border-color: #e2e8f0 !important;
          }

          .cog-light .border-cyan-700\\/30,
          .cog-light .border-cyan-400\\/30,
          .cog-light .border-cyan-500\\/30 {
            border-color: #bae6fd !important;
          }

          .cog-light .border-amber-400\\/30,
          .cog-light .border-yellow-500\\/30 {
            border-color: #fde68a !important;
          }

          .cog-light .border-purple-400\\/30 {
            border-color: #ddd6fe !important;
          }

          .cog-light .text-white,
          .cog-light .text-slate-200,
          .cog-light .text-slate-300 {
            color: #0f172a !important;
          }

          .cog-light .text-slate-400 {
            color: #475569 !important;
          }

          .cog-light .text-slate-500 {
            color: #64748b !important;
          }

          .cog-light .text-cyan-200,
          .cog-light .text-cyan-200\\/90,
          .cog-light .text-cyan-300 {
            color: #0891b2 !important;
          }

          .cog-light .text-emerald-200,
          .cog-light .text-emerald-300 {
            color: #047857 !important;
          }

          .cog-light .text-yellow-300,
          .cog-light .text-yellow-400 {
            color: #b45309 !important;
          }

          .cog-light .text-red-300 {
            color: #dc2626 !important;
          }

          .cog-light .bg-cyan-600\\/20,
          .cog-light .bg-emerald-500\\/20,
          .cog-light .bg-emerald-500\\/10 {
            background: #ecfdf5 !important;
          }

          .cog-light .bg-yellow-500\\/10 {
            background: #fffbeb !important;
          }

          .cog-light .bg-red-500\\/10 {
            background: #fef2f2 !important;
          }

          .cog-light .bg-gradient-to-br.from-emerald-500\\/10 {
            background: #ecfdf5 !important;
          }

          .cog-light .bg-gradient-to-br.from-red-500\\/10 {
            background: #fef2f2 !important;
          }

          .cog-light select {
            background: #f0faf7 !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          }

          .cog-light select:focus {
            border-color: #0891b2 !important;
            box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.14) !important;
          }

          .cog-light .shadow-slate-950\\/50,
          .cog-light .shadow-cyan-900\\/10,
          .cog-light .shadow-xl,
          .cog-light .shadow-lg {
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.075) !important;
          }

          .cog-light .rounded-2xl,
          .cog-light .rounded-xl {
            box-shadow: 0 16px 38px rgba(15, 23, 42, 0.055);
          }

          .cog-light img {
            background: #f0faf7;
          }
        `}</style>
      )}
      <div className={`relative overflow-hidden border rounded-2xl p-6 shadow-xl ${panel}`}>
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 w-36 h-36 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-2">
            <h3 className={`text-xl font-semibold flex items-center ${heading}`}>
              <Brain className={`mr-2 ${isLight ? "text-teal-800" : "text-cyan-300"}`} size={22} />
              Cognitive Tests and Progression Forecasts
            </h3>
            <p className={`text-sm max-w-2xl ${muted}`}>
              Patient-specific history from voiceAssessmentResults with AI forecasting per test type.
            </p>

            <p className={`text-xs ${isLight ? "text-teal-800" : "text-cyan-200/90"}`}>
              Every assessment is displayed with equal priority in a unified clinical view.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className={`px-2.5 py-1 rounded-full text-xs border ${chip}`}>
                Test types: {testTypes.length}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs border ${chip}`}>
                Records: {totalRecords}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs border ${
                isLight
                  ? "bg-cyan-50 border-cyan-200 text-cyan-800"
                  : "bg-cyan-600/20 border-cyan-500/30 text-cyan-200"
              }`}>
                Prediction works with 1+ scores
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <UserRound size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? "text-[#517080]" : "text-slate-400"}`} />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className={`border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none min-w-56 ${
                  isLight
                    ? "bg-[#eaf7f4] border-teal-900/10 text-[#102a37] focus:border-teal-700"
                    : "bg-slate-800/90 border-slate-700 text-white focus:border-cyan-500"
                }`}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={runAllPredictions}
              disabled={testTypes.length === 0 || loadingHistory}
              className={`px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center transition-all ${
                isLight
                  ? "bg-[linear-gradient(135deg,#0f766e,#155e75)] hover:brightness-110 text-white shadow-[0_14px_28px_rgba(15,118,110,0.24)] border border-teal-900/10"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white"
              }`}
            >
              <BarChart3 size={16} className="mr-2" />
              Run All Predictions
            </button>
          </div>
        </div>

        {selectedPatient && (
          <div className={`mt-4 text-xs border rounded-lg px-3 py-2 ${
            isLight
              ? "text-[#365565] bg-[#eaf7f4] border-teal-900/10"
              : "text-slate-300 bg-slate-900/40 border-slate-700/60"
          }`}>
            Selected: <span className="text-slate-200">{selectedPatient.name}</span> · Patient ID: <span className="text-slate-200">{selectedPatient.id}</span>
            {selectedPatient.userId && (
              <span>
                {" "}· User ID: <span className="text-slate-200">{selectedPatient.userId}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {loadingHistory && (
        <div className={`border rounded-xl p-6 flex items-center ${
          isLight
            ? "bg-[#d8eee9]/92 border-teal-900/10 text-[#365565] shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
            : "bg-slate-900/60 border-slate-800 text-slate-300"
        }`}>
          <RefreshCw size={16} className="mr-2 animate-spin" />
          Loading patient cognitive test history...
        </div>
      )}

      {historyError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {historyError}
        </div>
      )}

      {!loadingHistory && !historyError && testTypes.length === 0 && selectedPatientId && (
        <div className={`border rounded-xl p-6 text-sm ${
          isLight
            ? "bg-[#d8eee9]/92 border-teal-900/10 text-[#365565] shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
            : "bg-slate-900/50 border-slate-800 text-slate-400"
        }`}>
          No cognitive test data found for this patient in voiceAssessmentResults.
        </div>
      )}

      {testTypes.length > 0 && (
        <div className="relative">
          <div className={`absolute left-3 top-4 bottom-4 w-px bg-gradient-to-b ${
            isLight ? "from-teal-700/40 via-teal-900/15 to-transparent" : "from-cyan-500/40 via-slate-700 to-transparent"
          }`} />
          <div className="space-y-4 pl-8">
            {testTypes.map((testType, index) => (
              <div key={testType} className="relative">
                <Circle size={10} className={`absolute -left-[29px] top-6 ${
                  isLight ? "text-teal-700 fill-teal-700/80" : "text-cyan-300 fill-cyan-300/80"
                }`} />
                {renderTestCard(testType, index)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
