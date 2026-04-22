import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Sparkles,
  Pill,
  AlertTriangle,
  ClipboardList,
  Activity,
  BookOpen,
  ExternalLink,
  Loader2,
  ShieldAlert,
  RefreshCw,
  Info,
  History,
  Clock,
  Brain,
  TrendingDown,
} from "lucide-react";
import {
  API_RAG_URL,
  mapStageToRag,
} from "./config";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

const toList = (v) =>
  Array.isArray(v)
    ? v
    : typeof v === "string"
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const extractVitalsFromPatient = (patient) => {
  const deviceData = patient?.deviceData;
  let latest = {};
  if (deviceData && typeof deviceData === "object") {
    const keys = Object.keys(deviceData);
    if (keys.length > 0) {
      const sorted = [...keys].sort((a, b) => {
        const na = parseInt(a.replace(/^\D+/g, ""), 10) || 0;
        const nb = parseInt(b.replace(/^\D+/g, ""), 10) || 0;
        return na - nb;
      });
      const candidate = deviceData[sorted[sorted.length - 1]];
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        latest = candidate;
      } else {
        latest = deviceData;
      }
    }
  }

  // Blood pressure parsing
  let systolic = 120;
  let diastolic = 80;
  const bp = latest.bloodPressure || patient?.bloodPressure;
  if (typeof bp === "string" && bp.includes("/")) {
    const [s, d] = bp.split("/").map((x) => parseInt(x, 10));
    if (!Number.isNaN(s)) systolic = s;
    if (!Number.isNaN(d)) diastolic = d;
  }

  // Sleep hours (extract number from string or use number)
  let sleepHours = 7;
  const sh = latest.sleepHours ?? patient?.sleepHours ?? latest.sleepQuality;
  if (typeof sh === "number") sleepHours = sh;
  else if (typeof sh === "string") {
    const m = sh.match(/(\d+(?:\.\d+)?)/);
    if (m) sleepHours = parseFloat(m[1]);
  }

  // Sleep quality label
  let sleepQuality = "average";
  if (sleepHours < 5) sleepQuality = "poor";
  else if (sleepHours < 7) sleepQuality = "fair";
  else sleepQuality = "good";
  if (typeof latest.sleepQuality === "string") {
    sleepQuality = latest.sleepQuality;
  }

  return {
    sleep_quality: sleepQuality,
    sleep_hours: sleepHours,
    systolic_bp: systolic,
    diastolic_bp: diastolic,
    heart_rate_bpm: parseInt(latest.heartRate || patient?.heartRate || 75, 10),
  };
};

export default function RagRecommendationPanel({ patient }) {
  const defaultVitals = useMemo(
    () => extractVitalsFromPatient(patient),
    [patient]
  );

  const [stage, setStage] = useState(
    mapStageToRag(patient?.currentStage || patient?.diagnosis, patient?.stageLevel)
  );
  const [age, setAge] = useState(
    typeof patient?.age === "number" ? patient.age : parseInt(patient?.age, 10) || 70
  );
  const [topK, setTopK] = useState(3);
  const [vitals, setVitals] = useState(defaultVitals);
  const [comorbidities, setComorbidities] = useState(
    (patient?.comorbidities || []).join(", ")
  );
  const [medications, setMedications] = useState(
    (patient?.medications || []).join(", ")
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [latestAi, setLatestAi] = useState(null); // latest stage + progression run

  // Load saved recommendations whenever the patient changes
  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    setActiveHistoryId(null);
    setHistory([]);
    setLatestAi(null);
    if (!patient?.id) return;

    // Fetch latest AI stage/progression analysis
    (async () => {
      try {
        const aiSnap = await getDocs(
          query(
            collection(db, "patients", patient.id, "aiAnalyses"),
            orderBy("createdAt", "desc"),
            limit(1)
          )
        );
        if (cancelled) return;
        let latest = null;
        aiSnap.forEach((d) => {
          latest = { id: d.id, ...d.data() };
        });
        setLatestAi(latest);
      } catch (e) {
        console.warn("Could not load latest AI analysis:", e);
      }
    })();

    (async () => {
      setLoadingHistory(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "patients", patient.id, "ragRecommendations"),
            orderBy("createdAt", "desc")
          )
        );
        if (cancelled) return;
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setHistory(items);
        if (items.length > 0) {
          const latest = items[0];
          setResult(latest.response || null);
          setActiveHistoryId(latest.id);
        }
      } catch (e) {
        console.warn("Could not load treatment-support history:", e);
      }
      if (!cancelled) setLoadingHistory(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [patient?.id]);

  // When we have the latest AI analysis, sync the stage input to match it
  useEffect(() => {
    if (latestAi) {
      const mapped = mapStageToRag(
        latestAi.currentStage || latestAi.stageApi?.stage,
        latestAi.stageLevel
      );
      if (mapped) setStage(mapped);
    }
  }, [latestAi]);

  const viewHistoryItem = (item) => {
    setResult(item.response || null);
    setActiveHistoryId(item.id);
    setError(null);
  };

  const formatTs = (ts) => {
    if (!ts) return "—";
    const ms = ts.seconds ? ts.seconds * 1000 : ts;
    try {
      return new Date(ms).toLocaleString();
    } catch {
      return "—";
    }
  };

  const handleVitalChange = (k, v) => setVitals((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        age: Number(age),
        patient_id: patient?.id || "unknown",
        vitals: {
          sleep_quality: vitals.sleep_quality,
          sleep_hours: Number(vitals.sleep_hours),
          systolic_bp: Number(vitals.systolic_bp),
          diastolic_bp: Number(vitals.diastolic_bp),
          heart_rate_bpm: Number(vitals.heart_rate_bpm),
        },
        stage,
        top_k: Number(topK),
        comorbidities: toList(comorbidities),
        current_medications: toList(medications),
      };

      const res = await axios.post(API_RAG_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setResult(res.data);

      // Persist to Firestore (best-effort) — mobile app reads this as a report
      try {
        if (patient?.id) {
          const rec = res.data?.recommendation || {};
          const record = {
            createdAt: serverTimestamp(),
            patientId: patient.id,
            patientName: patient.name || null,
            stage: res.data?.stage || payload.stage,
            // Flat fields for quick mobile rendering
            treatment: rec.treatment || null,
            dosage: rec.dosage || null,
            rationale: rec.rationale || null,
            cautions: Array.isArray(rec.cautions) ? rec.cautions : [],
            monitoring: Array.isArray(rec.monitoring) ? rec.monitoring : [],
            lifestyleNotes: Array.isArray(rec.lifestyle_notes)
              ? rec.lifestyle_notes
              : [],
            sources: res.data?.sources || [],
            disclaimer: res.data?.disclaimer || null,
            // Full raw docs for fidelity
            payload,
            response: res.data,
          };
          const docRef = await addDoc(
            collection(db, "patients", patient.id, "ragRecommendations"),
            record
          );
          const localItem = {
            id: docRef.id,
            ...record,
            createdAt: { seconds: Math.floor(Date.now() / 1000) },
          };
          setHistory((prev) => [localItem, ...prev]);
          setActiveHistoryId(docRef.id);
        }
      } catch (e) {
        console.warn("Could not save treatment support plan:", e);
      }
    } catch (e) {
      console.error("Treatment support API error:", e);
      setError(e.response?.data?.error || e.message || "Request failed");
    }
    setLoading(false);
  };

  const rec = result?.recommendation;
  const sources = result?.sources || [];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-900/10 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl shadow-cyan-500/5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
            <Sparkles className="text-cyan-300" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Clinical Trials-backed Treatment Support
            </h3>
            <p className="text-xs text-slate-400">
              AI-assisted support plans grounded in published clinical trial and PubMed evidence
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Building Plan…</span>
            </>
          ) : result ? (
            <>
              <RefreshCw size={16} />
              <span>Refresh Plan</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate Support Plan</span>
            </>
          )}
        </button>
      </div>

      {/* AI Context: Current Stage + Progression from latest aiAnalysis */}
      {latestAi && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {/* Current Stage */}
          <div className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Brain size={16} className="text-blue-400" />
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                  AI Current Stage
                </p>
              </div>
              {latestAi.stageApi?.confidence != null && (
                <span className="text-[10px] text-blue-300 font-mono">
                  {(latestAi.stageApi.confidence * 100).toFixed(1)}% confidence
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-white leading-tight mb-1">
              {latestAi.currentStage || latestAi.stageApi?.stage || "—"}
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-1.5 flex-1 bg-slate-800 rounded-full flex overflow-hidden">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 border-r border-slate-900 last:border-0 ${
                      step <= (latestAi.stageLevel ?? 0)
                        ? step >= 3
                          ? "bg-red-500"
                          : step >= 2
                          ? "bg-orange-400"
                          : step >= 1
                          ? "bg-yellow-400"
                          : "bg-green-400"
                        : ""
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500">
                {(latestAi.stageLevel ?? 0)}/3
              </span>
            </div>
            {latestAi.inferenceText && (
              <p className="text-[11px] text-slate-400 italic leading-relaxed line-clamp-3">
                "{latestAi.inferenceText}"
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-2 flex items-center">
              <Clock size={10} className="mr-1" />
              Analyzed {formatTs(latestAi.createdAt)}
            </p>
          </div>

          {/* Future Progression */}
          <div className="bg-slate-900/60 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingDown size={16} className="text-cyan-400" />
                <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                  AI Progression Forecast
                </p>
              </div>
              {latestAi.trajectoryMonths && (
                <span className="text-[10px] text-cyan-300">
                  {latestAi.trajectoryMonths}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-white leading-tight mb-1">
              {latestAi.predictedDecline ||
                (latestAi.progressionApi?.next_stage_prediction?.length
                  ? latestAi.progressionApi.next_stage_prediction.join(" → ")
                  : "Stable")}
            </p>
            {Array.isArray(latestAi.progressionApi?.next_stage_prediction) &&
              latestAi.progressionApi.next_stage_prediction.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {latestAi.progressionApi.next_stage_prediction.map(
                    (s, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      >
                        {s}
                      </span>
                    )
                  )}
                </div>
              )}
            {latestAi.trajInference && (
              <p className="text-[11px] text-slate-400 italic leading-relaxed line-clamp-3">
                "{latestAi.trajInference}"
              </p>
            )}
          </div>
        </div>
      )}

      {!latestAi && patient?.id && (
        <div className="mb-5 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg flex items-start space-x-2">
          <Info size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200/90">
            No AI stage/progression analysis yet. Run the Stage & Progression
            diagnostic first to auto-populate clinical context here.
          </p>
        </div>
      )}

      {/* Input summary (editable) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
          Clinical Inputs (editable)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Field label="Age">
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Stage">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="input-dark"
            >
              <option value="normal">Normal</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </Field>
          <Field label="Evidence Sources (Top K)">
            <input
              type="number"
              min={1}
              max={10}
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Sleep Quality">
            <select
              value={vitals.sleep_quality}
              onChange={(e) => handleVitalChange("sleep_quality", e.target.value)}
              className="input-dark"
            >
              <option value="poor">Poor</option>
              <option value="fair">Fair</option>
              <option value="average">Average</option>
              <option value="good">Good</option>
            </select>
          </Field>
          <Field label="Sleep Hours">
            <input
              type="number"
              step="0.1"
              value={vitals.sleep_hours}
              onChange={(e) => handleVitalChange("sleep_hours", e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Systolic BP">
            <input
              type="number"
              value={vitals.systolic_bp}
              onChange={(e) => handleVitalChange("systolic_bp", e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Diastolic BP">
            <input
              type="number"
              value={vitals.diastolic_bp}
              onChange={(e) => handleVitalChange("diastolic_bp", e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Heart Rate (bpm)">
            <input
              type="number"
              value={vitals.heart_rate_bpm}
              onChange={(e) => handleVitalChange("heart_rate_bpm", e.target.value)}
              className="input-dark"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="Comorbidities (comma-separated)">
            <input
              type="text"
              value={comorbidities}
              onChange={(e) => setComorbidities(e.target.value)}
              className="input-dark"
              placeholder="e.g. hypertension, diabetes"
            />
          </Field>
          <Field label="Current Medications (comma-separated)">
            <input
              type="text"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              className="input-dark"
              placeholder="e.g. metformin, donepezil"
            />
          </Field>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <ShieldAlert className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Empty state (no saved history either) */}
      {!result && !loading && !error && history.length === 0 && !loadingHistory && (
        <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-xl">
          <Sparkles size={28} className="text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">
            No previous support plans. Click{" "}
            <span className="text-cyan-400 font-medium">
              Generate Support Plan
            </span>{" "}
            to synthesize evidence-backed treatment guidance.
          </p>
        </div>
      )}

      {/* Loading history */}
      {loadingHistory && (
        <div className="flex items-center justify-center py-4 text-slate-500 text-xs">
          <Loader2 size={14} className="animate-spin mr-2" />
          Loading saved support plans…
        </div>
      )}

      {/* Viewing-from-history banner */}
      {result && activeHistoryId && history.length > 0 && (() => {
        const active = history.find((h) => h.id === activeHistoryId);
        const isLatest = history[0]?.id === activeHistoryId;
        return (
          <div
            className={`mb-4 flex items-center justify-between p-3 rounded-lg border ${
              isLatest
                ? "bg-cyan-500/5 border-cyan-500/30"
                : "bg-amber-500/5 border-amber-500/30"
            }`}
          >
            <div className="flex items-center space-x-2 text-xs">
              <Clock
                size={14}
                className={isLatest ? "text-cyan-400" : "text-amber-400"}
              />
              <span className="text-slate-400">
                {isLatest ? "Latest saved support plan" : "Viewing past support plan"}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-200 font-medium">
                {formatTs(active?.createdAt)}
              </span>
            </div>
            {!isLatest && (
              <button
                onClick={() => viewHistoryItem(history[0])}
                className="text-[11px] px-2 py-1 rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
              >
                Jump to latest
              </button>
            )}
          </div>
        );
      })()}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="text-cyan-400 animate-spin" size={32} />
          <p className="text-sm text-cyan-300 animate-pulse">
            Synthesizing treatment support from clinical evidence…
          </p>
        </div>
      )}

      {/* Result */}
      {result && rec && (
        <div className="space-y-5">
          {/* Header with stage + patient */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Patient
              </span>
              <span className="text-sm text-white font-medium">
                {result.patient_id}
              </span>
              <span className="mx-2 text-slate-700">·</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Stage
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  result.stage === "severe"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : result.stage === "moderate"
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : result.stage === "mild"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                }`}
              >
                {result.stage}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              {sources.length} evidence source{sources.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Treatment card */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Pill className="text-cyan-300" size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold mb-1">
                  Trials-backed Treatment Option
                </p>
                <h4 className="text-xl font-bold text-white leading-snug mb-3">
                  {rec.treatment}
                </h4>
                {rec.dosage && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      Dosage
                    </p>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {rec.dosage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rationale */}
          {rec.rationale && (
            <div className="bg-slate-900/60 border-l-4 border-blue-500 rounded-r-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info size={14} className="text-blue-400" />
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                  Clinical Rationale
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic">
                {rec.rationale}
              </p>
            </div>
          )}

          {/* Cautions / Monitoring / Lifestyle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <BulletCard
              title="Cautions"
              items={rec.cautions}
              icon={<AlertTriangle size={16} />}
              color="red"
            />
            <BulletCard
              title="Monitoring"
              items={rec.monitoring}
              icon={<Activity size={16} />}
              color="cyan"
            />
            <BulletCard
              title="Lifestyle Notes"
              items={rec.lifestyle_notes}
              icon={<ClipboardList size={16} />}
              color="green"
            />
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                <BookOpen size={16} className="mr-2 text-cyan-400" />
                Clinical Trial & Literature Sources
              </h4>
              <div className="space-y-2">
                {sources.map((s, i) => (
                  <a
                    key={s.doc_id || i}
                    href={s.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg p-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white group-hover:text-cyan-300 font-medium leading-snug line-clamp-2">
                          {s.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                            {s.source}
                          </span>
                          {s.doc_id && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {s.doc_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                        {typeof s.relevance_score === "number" && (
                          <span className="text-[10px] text-cyan-300 font-mono">
                            {(s.relevance_score * 100).toFixed(2)}% match
                          </span>
                        )}
                        <ExternalLink
                          size={12}
                          className="text-slate-500 group-hover:text-cyan-400"
                        />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <AlertTriangle
                size={14}
                className="text-yellow-400 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-yellow-200/90 leading-relaxed">
                {result.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Timeline */}
      {history.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
            <History size={16} className="mr-2 text-cyan-400" />
            Support Plan History
            <span className="ml-2 text-xs text-slate-500 font-normal">
              ({history.length})
            </span>
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {history.map((h, idx) => {
              const isActive = h.id === activeHistoryId;
              const isLatest = idx === 0;
              return (
                <button
                  key={h.id}
                  onClick={() => viewHistoryItem(h)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? "bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            h.stage === "severe"
                              ? "bg-red-500/20 text-red-400"
                              : h.stage === "moderate"
                              ? "bg-orange-500/20 text-orange-400"
                              : h.stage === "mild"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {h.stage || "—"}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                            Latest
                          </span>
                        )}
                        {isActive && !isLatest && (
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                            Viewing
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 flex items-center">
                          <Clock size={10} className="mr-1" />
                          {formatTs(h.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium leading-snug line-clamp-1">
                        {h.treatment || h.response?.recommendation?.treatment || "No treatment recorded"}
                      </p>
                      {h.dosage && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {h.dosage}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-[10px] text-slate-500">
                      {(h.sources || []).length} sources
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Minimal local styles for inputs */}
      <style>{`
        .input-dark {
          width: 100%;
          background: rgb(15 23 42 / 0.7);
          border: 1px solid rgb(51 65 85);
          color: white;
          font-size: 0.875rem;
          padding: 0.4rem 0.6rem;
          border-radius: 0.375rem;
          outline: none;
        }
        .input-dark:focus {
          border-color: rgb(129 140 248);
          box-shadow: 0 0 0 2px rgb(129 140 248 / 0.2);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function BulletCard({ title, items, icon, color }) {
  const list = Array.isArray(items)
    ? items
    : typeof items === "string"
    ? [items]
    : [];
  const palette =
    color === "red"
      ? "border-red-500/30 text-red-400 bg-red-500/5"
      : color === "cyan"
      ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/5"
      : "border-green-500/30 text-green-400 bg-green-500/5";
  return (
    <div className={`rounded-xl border p-4 ${palette}`}>
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <h5 className="text-xs uppercase tracking-wider font-bold">{title}</h5>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-slate-500 italic">None listed.</p>
      ) : (
        <ul className="space-y-1.5 text-sm text-slate-300">
          {list.map((item, i) => (
            <li key={i} className="flex items-start space-x-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
              <span className="leading-relaxed">
                {typeof item === "string" ? item : JSON.stringify(item)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
