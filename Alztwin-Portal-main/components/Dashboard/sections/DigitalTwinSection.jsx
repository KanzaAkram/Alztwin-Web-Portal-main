import React, { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Upload,
  Move,
  Moon,
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
  AlertTriangle,
  Heart,
  Info,
  History,
  Eye,
  Shield,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ThreeBrainView from "../ThreeBrainView";
import ClinicalTreatmentSupportPanel from "../RagRecommendationPanel";
import { useTheme } from "../../ThemeContext";
import { SENSOR_DISPLAY_FIELDS } from "../../../data/wearableDeviceDataMock";

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

const SENSOR_FIELD_META = {
  bpm: { label: "BPM", icon: "BPM", suffix: " bpm", decimals: 2 },
  fall: { label: "Fall", icon: "F" },
  latitude: { label: "Latitude", icon: "LAT", decimals: 6 },
  longitude: { label: "Longitude", icon: "LNG", decimals: 6 },
  outOfZone: { label: "Out of Zone", icon: "OZ" },
  pitch: { label: "Pitch", icon: "P", decimals: 2 },
  roll: { label: "Roll", icon: "R", decimals: 2 },
  sleeping: { label: "Sleeping", icon: "SL" },
};

const chartTooltipStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#e2e8f0",
};

const SCORE_TONE_CLASS = {
  slate: { text: "text-slate-300", bar: "bg-slate-500" },
  green: { text: "text-green-400", bar: "bg-green-500" },
  yellow: { text: "text-yellow-400", bar: "bg-yellow-500" },
  red: { text: "text-red-400", bar: "bg-red-500" },
};

const numericOr = (v, fallback) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const toFiniteNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const MS_PER_HOUR = 60 * 60 * 1000;
const MAX_SLEEP_READING_HOURS = 4;
const IDEAL_SLEEP_HOURS = 7.5;

const getLocalDayEndMs = (dateKey, timestampMs) => {
  if (dateKey) {
    const [year, month, day] = String(dateKey).split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day + 1, 0, 0, 0, 0).getTime();
    }
  }
  const date = new Date(timestampMs);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
};

const getSleepScore = (hours) => {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  const score = 100 - Math.abs(hours - IDEAL_SLEEP_HOURS) * 18;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getSleepLabel = (score) => {
  if (score >= 85) return "Good";
  if (score >= 65) return "Fair";
  return "Low";
};

const getCognitiveMaxScore = (testType) =>
  testType === "MMSE" ? 30 : testType === "ADAS" ? 70 : 30;

const getMaxScoreFromEntry = (entry) => {
  if (!entry) return null;
  const raw = entry.maxScore ?? entry.max ?? entry.totalMax ?? entry.scoreMax ?? null;
  return toFiniteNumber(raw);
};

const getMaxScoreFromHistory = (history = []) => {
  const sorted = [...history].sort(
    (a, b) => (b.completedAtMs || 0) - (a.completedAtMs || 0)
  );
  for (const item of sorted) {
    const max = getMaxScoreFromEntry(item);
    if (max != null) return max;
  }
  return null;
};

const getStageIndexFromLabel = (stageLabel) => {
  const normalized = String(stageLabel || "").toLowerCase().trim();
  if (!normalized) return -1;

  const exact = STAGE_LADDER.findIndex(
    (s) => s.stage.toLowerCase() === normalized
  );
  if (exact >= 0) return exact;

  if (normalized === "cn" || normalized.includes("normal")) return 0;
  if (
    normalized.includes("mci") ||
    normalized.includes("smc") ||
    normalized.includes("emci") ||
    normalized.includes("lmci")
  )
    return 1;
  if (normalized.includes("mild")) return 2;
  if (normalized.includes("moderate")) return 3;
  if (normalized.includes("severe")) return 4;
  if (normalized === "ad" || normalized.includes("alzheimer")) return 3;

  return -1;
};

const parseTrajectoryMonths = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, value);
  }
  const match = String(value || "").match(/(\d+)/);
  if (!match) return 12;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
};

const getActiveStageIndex = (patient) => {
  if (!patient) return -1;
  if (typeof patient.stageLevel === "number") {
    return Math.max(
      0,
      Math.min(STAGE_LADDER.length - 1, Math.round(patient.stageLevel))
    );
  }

  const candidates = [patient.currentStage, patient.stage, patient.diagnosis];
  for (const candidate of candidates) {
    const idx = getStageIndexFromLabel(candidate);
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
  const { isLight } = useTheme();
  const progression = selectedPatientForDT?.progression || [];
  const regions = selectedPatientForDT?.regions || [];
  const patientCognitiveTests = selectedPatientForDT?.cognitiveTests || [];
  const fallbackCognitiveTests = useMemo(
    () =>
      Object.entries(dtCognitiveTests || {}).map(([testType, group]) => {
        const scores = Array.isArray(group?.pastScores) ? group.pastScores : [];
        const current = scores.length > 0 ? scores[scores.length - 1] : null;
        const historyMax = getMaxScoreFromHistory(group?.history || []);
        const max = historyMax != null ? historyMax : getCognitiveMaxScore(testType);
        return {
          test: testType,
          current,
          max,
          scores,
        };
      }),
    [dtCognitiveTests]
  );
  const cognitiveTests =
    patientCognitiveTests.length > 0 ? patientCognitiveTests : fallbackCognitiveTests;
  const treatmentPlan = selectedPatientForDT?.treatmentPlan || [];
  const recommendations = selectedPatientForDT?.recommendations || [];
  const activeStageIdx = getActiveStageIndex(selectedPatientForDT);
  const [activeDetailTab, setActiveDetailTab] = useState("cognitive");

  useEffect(() => {
    setActiveDetailTab("cognitive");
  }, [selectedPatientForDT?.id]);

  const hasDicom = selectedPatientForDT?.mriScans?.some(
    (s) => s.base64Data || s.mriId
  );
  const hasDiagnostics =
    !!selectedPatientForDT?.currentStage &&
    selectedPatientForDT.currentStage !== "Pending Analysis";
  const hasTreatmentContent =
    treatmentPlan.length > 0 || recommendations.length > 0;

  const detailTabs = [
    {
      id: "cognitive",
      label: "Cognitive",
      icon: BarChart3,
      helper: "Track score trends over time to quickly assess decline, stability, or response to interventions.",
    },
    {
      id: "physiology",
      label: "Physiology",
      icon: Smartphone,
      helper: "Review wearable and device vitals that can explain near-term symptom fluctuation.",
    },
    {
      id: "regions",
      label: "Regions",
      icon: Activity,
      helper: "Inspect regional brain burden to identify which structures are driving risk and progression.",
    },
    {
      id: "treatment",
      label: "Treatment",
      icon: Pill,
      helper: "Consolidate clinician notes and action items into a clear, patient-specific care plan.",
    },
    {
      id: "support",
      label: "Trials-backed Support",
      icon: FileText,
      helper: "Generate treatment support plans backed by clinical trial and literature evidence.",
    },
  ];
  const activeDetailMeta =
    detailTabs.find((tab) => tab.id === activeDetailTab) || detailTabs[0];

  const progressionModel = useMemo(() => {
    if (Array.isArray(progression) && progression.length > 0) {
      return { points: progression, isFallback: false };
    }

    if (!selectedPatientForDT) {
      return { points: [], isFallback: false };
    }

    const resolvedStageIdx =
      activeStageIdx >= 0 ? activeStageIdx : 1;
    const timelineMonths = parseTrajectoryMonths(
      selectedPatientForDT.trajectoryMonths
    );
    const stageAdvance = timelineMonths <= 12 ? 2 : 1;
    const endStageIdx = Math.min(
      STAGE_LADDER.length - 1,
      resolvedStageIdx + stageAdvance
    );

    const startProgressMap = [18, 34, 50, 68, 82];
    const endProgressMap = [35, 52, 70, 85, 95];
    const startProgress = startProgressMap[resolvedStageIdx] ?? 34;
    const endProgress = endProgressMap[endStageIdx] ?? 70;

    const points = [0, 1, 2, 3, 4].map((step) => {
      const ratio = step / 4;
      const monthOffset = Math.max(1, Math.round(timelineMonths * ratio));
      const stageIdx = Math.min(
        STAGE_LADDER.length - 1,
        resolvedStageIdx + Math.round((endStageIdx - resolvedStageIdx) * ratio)
      );

      return {
        month: step === 0 ? "Current" : `+${monthOffset}m`,
        stage: STAGE_LADDER[stageIdx].stage,
        progress: Math.round(
          startProgress + (endProgress - startProgress) * ratio
        ),
        predicted: step > 0,
      };
    });

    return { points, isFallback: true };
  }, [activeStageIdx, progression, selectedPatientForDT]);

  const rawDeviceMetrics = useMemo(() => {
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

  const deviceMetrics = useMemo(() => {
    const deviceData = selectedPatientForDT?.deviceData;
    if (!deviceData || typeof deviceData !== "object") return [];

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

    return SENSOR_DISPLAY_FIELDS.filter(
      (key) => source[key] !== null && source[key] !== undefined && source[key] !== ""
    ).map((key) => {
      const value = source[key];
      const meta = SENSOR_FIELD_META[key] || { label: key, icon: "DATA" };
      const displayValue =
        typeof value === "boolean"
          ? String(value)
          : typeof value === "number"
          ? `${value.toFixed(meta.decimals ?? 0)}${meta.suffix || ""}`
          : String(value);
      return { key, label: meta.label, icon: meta.icon, value: displayValue };
    });
  }, [selectedPatientForDT]);
  const outOfBoundSummary = selectedPatientForDT?.sensorOutOfBoundSummary || {
    sevenDayCount: 0,
    fourteenDayCount: 0,
    totalReadings: 0,
  };
  const sensorTrendData = useMemo(() => {
    const records = Array.isArray(selectedPatientForDT?.sensorData)
      ? selectedPatientForDT.sensorData
      : [];
    return [...records]
      .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0))
      .map((record) => {
        const date = record.timestampMs ? new Date(record.timestampMs) : null;
        return {
          label: date
            ? date.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
              })
            : record.dateKey || "",
          day: record.dateKey || "",
          timestampMs: Number(record.timestampMs || 0),
          bpm: Number(record.bpm || 0),
          pitch: Number(record.pitch || 0),
          roll: Number(record.roll || 0),
          outOfBound: record.outOfBound ? 1 : 0,
          fall: record.fall ? 1 : 0,
          outOfZone: record.outOfZone ? 1 : 0,
          isSleeping: Boolean(record.sleeping),
          sleeping: record.sleeping ? 1 : 0,
        };
      });
  }, [selectedPatientForDT]);
  const dailySensorData = useMemo(() => {
    const daily = new Map();
    const recordsByDay = new Map();
    sensorTrendData.forEach((record) => {
      const key = record.day || record.label;
      const item =
        daily.get(key) || {
          day: key ? key.slice(5) : "",
          dateKey: key,
          bpmTotal: 0,
          bpmCount: 0,
          avgBpm: 0,
          outOfBound: 0,
          fall: 0,
          outOfZone: 0,
          sleeping: 0,
          sleepHours: 0,
          sleepScore: 0,
          sleepLabel: "Low",
        };
      item.bpmTotal += record.bpm;
      item.bpmCount += 1;
      item.avgBpm = Math.round((item.bpmTotal / item.bpmCount) * 10) / 10;
      item.outOfBound += record.outOfBound;
      item.fall += record.fall;
      item.outOfZone += record.outOfZone;
      item.sleeping += record.sleeping;
      daily.set(key, item);

      if (!recordsByDay.has(key)) recordsByDay.set(key, []);
      recordsByDay.get(key).push(record);
    });

    recordsByDay.forEach((records, key) => {
      const item = daily.get(key);
      if (!item) return;
      const sortedRecords = [...records].sort(
        (a, b) => (a.timestampMs || 0) - (b.timestampMs || 0)
      );
      const sleepHours = sortedRecords.reduce((total, record, index) => {
        if (!record.isSleeping || !record.timestampMs) return total;
        const nextReading = sortedRecords[index + 1];
        const endMs =
          nextReading?.timestampMs && nextReading.day === record.day
            ? nextReading.timestampMs
            : getLocalDayEndMs(record.day, record.timestampMs);
        const intervalHours = Math.max(0, (endMs - record.timestampMs) / MS_PER_HOUR);
        return total + Math.min(intervalHours, MAX_SLEEP_READING_HOURS);
      }, 0);
      item.sleepHours = Math.round(sleepHours * 10) / 10;
      item.sleepScore = getSleepScore(item.sleepHours);
      item.sleepLabel = getSleepLabel(item.sleepScore);
    });
    return Array.from(daily.values());
  }, [sensorTrendData]);
  const sleepSummary = useMemo(() => {
    if (dailySensorData.length === 0) {
      return { averageHours: 0, averageScore: 0 };
    }
    const totals = dailySensorData.reduce(
      (acc, record) => ({
        hours: acc.hours + Number(record.sleepHours || 0),
        score: acc.score + Number(record.sleepScore || 0),
      }),
      { hours: 0, score: 0 }
    );
    return {
      averageHours: Math.round((totals.hours / dailySensorData.length) * 10) / 10,
      averageScore: Math.round(totals.score / dailySensorData.length),
    };
  }, [dailySensorData]);
  const sensorTotals = useMemo(
    () => {
      const totals = sensorTrendData.reduce(
        (acc, record) => ({
          readings: acc.readings + 1,
          falls: acc.falls + record.fall,
          outOfBound: acc.outOfBound + record.outOfBound,
          outOfZone: acc.outOfZone + record.outOfZone,
          sleeping: acc.sleeping + record.sleeping,
        }),
        { readings: 0, falls: 0, outOfBound: 0, outOfZone: 0, sleeping: 0 }
      );
      const sleepHours = dailySensorData.reduce(
        (sum, record) => sum + Number(record.sleepHours || 0),
        0
      );
      return {
        ...totals,
        sleepHours: Math.round(sleepHours * 10) / 10,
      };
    },
    [dailySensorData, sensorTrendData]
  );
  const sensorAverages = useMemo(() => {
    if (sensorTrendData.length === 0) {
      return { bpm: 0, pitch: 0, roll: 0 };
    }
    const totals = sensorTrendData.reduce(
      (acc, record) => ({
        bpm: acc.bpm + record.bpm,
        pitch: acc.pitch + record.pitch,
        roll: acc.roll + record.roll,
      }),
      { bpm: 0, pitch: 0, roll: 0 }
    );
    return {
      bpm: Math.round((totals.bpm / sensorTrendData.length) * 10) / 10,
      pitch: Math.round((totals.pitch / sensorTrendData.length) * 10) / 10,
      roll: Math.round((totals.roll / sensorTrendData.length) * 10) / 10,
    };
  }, [sensorTrendData]);
  const sensorPanelClass = isLight
    ? "bg-white border border-slate-200 shadow-[0_18px_42px_rgba(15,23,42,0.07)]"
    : "bg-slate-900/60 border border-slate-800";
  const sensorCardClass = isLight
    ? "bg-slate-50 border border-slate-200"
    : "bg-slate-800/50 border border-slate-700/50";
  const chartGridStroke = isLight ? "#cbd5e1" : "#334155";
  const chartAxisStroke = isLight ? "#64748b" : "#94a3b8";
  const sensorOverview = sensorTrendData.length > 0 && (
    <div className={`${sensorPanelClass} rounded-xl p-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-400 font-semibold">
            Wearable Sensor Overview
          </p>
          <h3 className={`text-lg font-semibold mt-1 ${isLight ? "text-slate-950" : "text-white"}`}>
            Rafay's Safety and Movement Trends
          </h3>
          <p className={`text-sm mt-1 max-w-3xl ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Simple charts for clinicians and caregivers: average heart rate, fall events, zone breaches,
            sleep state, and motion changes from timestamped wearable readings.
          </p>
        </div>
        <div className={`rounded-lg px-3 py-2 text-xs ${isLight ? "bg-cyan-50 text-cyan-800 border border-cyan-200" : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"}`}>
          {sensorTotals.readings} readings across {dailySensorData.length} days
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Avg BPM", value: sensorAverages.bpm.toFixed(1), helper: "Heart rate", color: "text-red-400" },
          { label: "Falls", value: sensorTotals.falls, helper: "fall=true", color: "text-red-400" },
          { label: "Out of Bound", value: sensorTotals.outOfBound, helper: "outOfBound=1", color: "text-amber-400" },
          { label: "Out of Zone", value: sensorTotals.outOfZone, helper: "outOfZone=true", color: "text-green-400" },
          { label: "Sleep Score", value: sleepSummary.averageScore, helper: `${sleepSummary.averageHours.toFixed(1)}h avg`, color: "text-indigo-400" },
        ].map((item) => (
          <div key={item.label} className={`${sensorCardClass} rounded-lg p-3`}>
            <p className={`text-[11px] uppercase ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              {item.label}
            </p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className={`${sensorCardClass} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`font-semibold text-sm ${isLight ? "text-slate-950" : "text-white"}`}>
                BPM Trend
              </p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                Average daily BPM, easier for quick clinical review
              </p>
            </div>
            <Heart className="text-red-400" size={18} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={dailySensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="day" stroke={chartAxisStroke} tick={{ fontSize: 10 }} />
                <YAxis stroke={chartAxisStroke} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="avgBpm" name="Avg BPM" stroke="#fb7185" strokeWidth={3} dot={{ r: 3 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${sensorCardClass} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`font-semibold text-sm ${isLight ? "text-slate-950" : "text-white"}`}>
                Safety Events
              </p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                Daily counts for falls, out-of-bound, and out-of-zone events
              </p>
            </div>
            <AlertTriangle className="text-amber-400" size={18} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="day" stroke={chartAxisStroke} tick={{ fontSize: 10 }} />
                <YAxis stroke={chartAxisStroke} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="outOfBound" name="Out of Bound" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="fall" name="Fall" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="outOfZone" name="Out of Zone" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${sensorCardClass} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`font-semibold text-sm ${isLight ? "text-slate-950" : "text-white"}`}>
                Pitch and Roll Movement
              </p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                Movement changes over each timestamped reading
              </p>
            </div>
            <Activity className="text-purple-400" size={18} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={sensorTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="label" stroke={chartAxisStroke} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis stroke={chartAxisStroke} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="pitch" name="Pitch" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="roll" name="Roll" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${sensorCardClass} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`font-semibold text-sm ${isLight ? "text-slate-950" : "text-white"}`}>
                Daily Sleep Hours
              </p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                Avg {sleepSummary.averageHours.toFixed(1)}h, score {sleepSummary.averageScore}/100
              </p>
            </div>
            <Moon className="text-indigo-400" size={18} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="day" stroke={chartAxisStroke} tick={{ fontSize: 10 }} />
                <YAxis stroke={chartAxisStroke} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <ReferenceLine y={IDEAL_SLEEP_HOURS} stroke="#22c55e" strokeDasharray="4 4" />
                <Bar dataKey="sleepHours" name="Sleep Hours" fill="#818cf8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${isLight ? "dt-light text-slate-900" : ""}`}>
      {isLight && (
        <style>{`
          .dt-light .bg-slate-950,
          .dt-light .bg-slate-950\\/80,
          .dt-light .bg-slate-900,
          .dt-light .bg-slate-900\\/70,
          .dt-light .bg-slate-900\\/50,
          .dt-light .bg-slate-900\\/45,
          .dt-light .bg-slate-900\\/80,
          .dt-light .bg-slate-900\\/90,
          .dt-light .bg-slate-800,
          .dt-light .bg-slate-800\\/80,
          .dt-light .bg-slate-800\\/70,
          .dt-light .bg-slate-800\\/50,
          .dt-light .bg-slate-800\\/40,
          .dt-light .bg-slate-800\\/30 {
            background: rgba(255, 255, 255, 0.94) !important;
          }

          .dt-light .bg-gradient-to-br.from-slate-900,
          .dt-light .bg-gradient-to-br.from-slate-900\\/80,
          .dt-light .bg-gradient-to-r.from-slate-900 {
            background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 55%, #eff6ff 100%) !important;
          }

          .dt-light .border-slate-800,
          .dt-light .border-slate-700,
          .dt-light .border-slate-700\\/50,
          .dt-light .border-slate-600 {
            border-color: #e2e8f0 !important;
          }

          .dt-light .text-white,
          .dt-light .text-slate-300,
          .dt-light .text-slate-200 {
            color: #0f172a !important;
          }

          .dt-light .text-slate-400 {
            color: #475569 !important;
          }

          .dt-light .text-slate-500 {
            color: #64748b !important;
          }

          .dt-light .bg-slate-700,
          .dt-light .bg-slate-700\\/50 {
            background: #f1f5f9 !important;
          }

          .dt-light .border-slate-900 {
            border-color: #ffffff !important;
          }

          .dt-light button.bg-slate-800,
          .dt-light button.bg-slate-800\\/70,
          .dt-light label.bg-slate-700 {
            background: #f8fafc !important;
            color: #334155 !important;
            border-color: #cbd5e1 !important;
          }

          .dt-light button.bg-slate-800:hover,
          .dt-light button.bg-slate-800\\/70:hover,
          .dt-light label.bg-slate-700:hover {
            background: #ecfdf5 !important;
            color: #047857 !important;
            border-color: #6ee7b7 !important;
          }

          .dt-light .rounded-2xl,
          .dt-light .rounded-xl {
            box-shadow: 0 16px 38px rgba(15, 23, 42, 0.055);
          }

          .dt-light input,
          .dt-light select,
          .dt-light textarea {
            background: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }

          .dt-light input:focus,
          .dt-light select:focus,
          .dt-light textarea:focus {
            border-color: #059669 !important;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14) !important;
          }

          .dt-light .shadow-cyan-500\\/10,
          .dt-light .shadow-blue-500\\/20,
          .dt-light .shadow-lg {
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08) !important;
          }

          .dt-light .bg-cyan-500\\/10,
          .dt-light .bg-blue-500\\/10 {
            background: #ecfeff !important;
          }

          .dt-light .bg-purple-500\\/10,
          .dt-light .bg-purple-500\\/20 {
            background: #f5f3ff !important;
          }

          .dt-light .bg-amber-500\\/10,
          .dt-light .bg-yellow-500\\/20 {
            background: #fffbeb !important;
          }

          .dt-light .bg-red-500\\/15,
          .dt-light .bg-red-500\\/20 {
            background: #fef2f2 !important;
          }

          .dt-light .bg-emerald-500\\/15,
          .dt-light .bg-green-500\\/20 {
            background: #ecfdf5 !important;
          }

          .dt-light .text-cyan-300,
          .dt-light .text-cyan-400 {
            color: #0891b2 !important;
          }

          .dt-light .text-blue-300,
          .dt-light .text-blue-400 {
            color: #2563eb !important;
          }

          .dt-light .text-purple-300,
          .dt-light .text-purple-400 {
            color: #7c3aed !important;
          }

          .dt-light .text-emerald-300,
          .dt-light .text-green-300,
          .dt-light .text-green-400 {
            color: #059669 !important;
          }

          .dt-light .text-yellow-300,
          .dt-light .text-yellow-400,
          .dt-light .text-amber-300,
          .dt-light .text-orange-400 {
            color: #d97706 !important;
          }

          .dt-light .text-red-300,
          .dt-light .text-red-400 {
            color: #dc2626 !important;
          }

          .dt-light .ring-cyan-500\\/30 {
            --tw-ring-color: rgba(6, 182, 212, 0.22) !important;
          }

          .dt-light .h-2.bg-slate-700,
          .dt-light .h-1\\.5.bg-slate-700,
          .dt-light .h-1\\.5.bg-slate-800 {
            background: #e2e8f0 !important;
          }
        `}</style>
      )}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-400">
              Step 1 · Patient Context
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-white mt-1 flex items-center">
              <Brain className="mr-2 text-cyan-400" size={22} />
              Select Patient for Digital Twin Analysis
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Choose one patient to load their imaging, progression forecasts, diagnostics,
              and treatment insights in a single workflow.
            </p>
          </div>

          {selectedPatientForDT && (
            <div className="bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 min-w-[260px]">
              <p className="text-xs uppercase tracking-wide text-slate-500">Current Context</p>
              <p className="text-sm font-semibold text-white mt-1">{selectedPatientForDT.name}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedPatientForDT.diagnosis || "No diagnosis"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    selectedPatientForDT.riskLevel === "high"
                      ? "bg-red-500/15 border-red-500/40 text-red-300"
                      : selectedPatientForDT.riskLevel === "medium"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  Risk: {(selectedPatientForDT.riskLevel || "unknown").toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {patients.length === 0 ? (
          <EmptyBlock>No patients available.</EmptyBlock>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatientForDT(patient)}
                className={`p-4 rounded-xl border transition-all duration-300 text-left group ${
                  selectedPatientForDT?.id === patient.id
                    ? "bg-cyan-500/10 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                    : "bg-slate-800/50 border-slate-700 hover:border-cyan-500/40 hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg ${
                      selectedPatientForDT?.id === patient.id
                        ? "ring-2 ring-white/30"
                        : ""
                    }`}
                  >
                    {patient.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm group-hover:text-cyan-300 transition-colors">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Step 1</p>
              <p className="text-sm font-semibold text-white mt-1">Patient Selected</p>
              <p className="text-xs text-slate-400 mt-2">{selectedPatientForDT.name}</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Step 2</p>
              <p className="text-sm font-semibold text-white mt-1">Imaging Readiness</p>
              <p className={`text-xs mt-2 ${hasDicom ? "text-emerald-300" : "text-amber-300"}`}>
                {hasDicom ? "MRI scans available" : "Awaiting DICOM upload"}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Step 3</p>
              <p className="text-sm font-semibold text-white mt-1">AI Diagnostics</p>
              <p className={`text-xs mt-2 ${hasDiagnostics ? "text-emerald-300" : "text-slate-400"}`}>
                {hasDiagnostics ? "Results ready" : "Run diagnostics"}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Step 4</p>
              <p className="text-sm font-semibold text-white mt-1">Care Plan</p>
              <p className={`text-xs mt-2 ${hasTreatmentContent ? "text-emerald-300" : "text-slate-400"}`}>
                {hasTreatmentContent ? "Recommendations recorded" : "Add treatment notes"}
              </p>
            </div>
          </div>

          {sensorOverview}

          <div className="bg-slate-900/45 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-blue-300">
                  Step 2 · Visual Twin
                </p>
                <h3 className="text-lg font-semibold text-white mt-1">3D Brain Reconstruction</h3>
              </div>
              <button
                onClick={onRunDiagnostics}
                disabled={analyzing}
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {analyzing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Activity size={16} />
                )}
                <span>{analyzing ? "Analyzing..." : "Run AI Diagnostics"}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden h-[560px] flex flex-col items-center justify-center">
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
                      : hasDicom
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
                  {hasDicom && (
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
              ) : hasDicom ? (
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
              {progressionModel.points.length > 0 ? (
                <>
                  {progressionModel.isFallback && (
                    <div className="mb-3 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                      Detailed progression points are unavailable, so this chart is an estimated trajectory based on latest stage and timeline.
                    </div>
                  )}

                  <div className="relative h-48">
                    <div className="absolute inset-0 flex items-end justify-between px-4">
                      {progressionModel.points.map((point, idx) => (
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
              ) : (
                <EmptyBlock>
                  No progression prediction available for this patient.
                </EmptyBlock>
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
                      const historyMax = getMaxScoreFromHistory(group?.history || []);
                      const maxScore = historyMax != null ? historyMax : getCognitiveMaxScore(testType);
                      const pct = latest != null ? Math.round((latest / maxScore) * 100) : null;
                      const tone =
                        pct == null ? "slate" : pct >= 70 ? "green" : pct >= 40 ? "yellow" : "red";
                      const toneClass = SCORE_TONE_CLASS[tone] || SCORE_TONE_CLASS.slate;
                      return (
                        <div key={testType} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400 uppercase font-medium">{testType}</span>
                            <span className={`text-lg font-bold ${toneClass.text}`}>
                              {latest ?? "—"}<span className="text-xs text-slate-500">/{maxScore}</span>
                            </span>
                          </div>
                          {pct != null && (
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                              <div
                                className={`h-full rounded-full ${toneClass.bar}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                          {scores.length > 1 && (
                            <div className="flex items-end space-x-0.5 h-8">
                              {scores.map((s, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-t ${i === scores.length - 1 ? toneClass.bar : "bg-slate-600"}`}
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

          <div className="bg-slate-900/45 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">
                  Step 4 · Clinical Detail Workspace
                </p>
                <h3 className="text-lg font-semibold text-white mt-1">Focused Data Review</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {activeDetailMeta.helper ||
                    "Review one data domain at a time to keep decision-making focused and clinically interpretable."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {detailTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const active = activeDetailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDetailTab(tab.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                        active
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-200"
                          : "bg-slate-800/70 border-slate-700 text-slate-300 hover:border-cyan-500/40"
                      }`}
                    >
                      <TabIcon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeDetailTab === "regions" && (
              <div>
                {regions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {regions.map((region, idx) => (
                      <div
                        key={idx}
                        className={`bg-slate-800/50 border rounded-xl p-4 transition-all hover:scale-[1.02] ${
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
                ) : (
                  <EmptyBlock>No region analysis available yet.</EmptyBlock>
                )}
              </div>
            )}

            {activeDetailTab === "cognitive" && (
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
                      const explicitMax = getMaxScoreFromEntry(test);
                      const max = explicitMax != null ? explicitMax : numericOr(test.max, getCognitiveMaxScore(test.test));
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
            )}

            {activeDetailTab === "physiology" && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Smartphone className="mr-2 text-green-400" size={20} />
                  Device Physiological Data
                </h3>
                {deviceMetrics.length === 0 ? (
                  <EmptyBlock>No device data recorded.</EmptyBlock>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold text-sm">
                            Out of Bound Count
                          </p>
                          <p className="text-slate-500 text-xs">
                            Sum of readings where outOfBound = 1
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {outOfBoundSummary.totalReadings} readings
                        </span>
                      </div>
                      {[
                        { label: "7 Day", value: outOfBoundSummary.sevenDayCount },
                        { label: "14 Day", value: outOfBoundSummary.fourteenDayCount },
                      ].map((item) => {
                        const max = Math.max(outOfBoundSummary.fourteenDayCount, 1);
                        return (
                          <div key={item.label} className="mb-3 last:mb-0">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-400">{item.label}</span>
                              <span className="text-white font-semibold">{item.value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${Math.min(100, (item.value / max) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {sensorTrendData.length > 0 && (
                      <>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                          {[
                            { label: "Readings", value: sensorTotals.readings, color: "text-cyan-300" },
                            { label: "Out of Bound", value: sensorTotals.outOfBound, color: "text-amber-300" },
                            { label: "Falls", value: sensorTotals.falls, color: "text-red-300" },
                            { label: "Out of Zone", value: sensorTotals.outOfZone, color: "text-green-300" },
                            { label: "Sleep Score", value: `${sleepSummary.averageScore}/100`, color: "text-indigo-300" },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                            >
                              <p className="text-slate-500 text-xs uppercase">
                                {item.label}
                              </p>
                              <p className={`text-2xl font-bold ${item.color}`}>
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-white font-semibold text-sm">
                                  BPM Visualization
                                </p>
                                <p className="text-slate-500 text-xs">
                                  Average BPM per day from timestamped wearable readings
                                </p>
                              </div>
                              <Heart className="text-red-400" size={18} />
                            </div>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={dailySensorData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                  <Tooltip
                                    contentStyle={{
                                      background: "#0f172a",
                                      border: "1px solid #334155",
                                      borderRadius: 8,
                                      color: "#e2e8f0",
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="avgBpm"
                                    name="Avg BPM"
                                    stroke="#fb7185"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                  />
                                </RechartsLineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-white font-semibold text-sm">
                                  Falls and Out-of-Bound Events
                                </p>
                                <p className="text-slate-500 text-xs">
                                  How many times Rafay fell or went out of bounds each day
                                </p>
                              </div>
                              <AlertTriangle className="text-amber-400" size={18} />
                            </div>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailySensorData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} allowDecimals={false} />
                                  <Tooltip
                                    contentStyle={{
                                      background: "#0f172a",
                                      border: "1px solid #334155",
                                      borderRadius: 8,
                                      color: "#e2e8f0",
                                    }}
                                  />
                                  <Bar dataKey="outOfBound" name="Out of Bound" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                  <Bar dataKey="fall" name="Fall" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-white font-semibold text-sm">
                                  Zone and Sleep Hours
                                </p>
                                <p className="text-slate-500 text-xs">
                                  Avg {sleepSummary.averageHours.toFixed(1)}h, score {sleepSummary.averageScore}/100
                                </p>
                              </div>
                              <Shield className="text-green-400" size={18} />
                            </div>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailySensorData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} allowDecimals={false} />
                                  <Tooltip
                                    contentStyle={{
                                      background: "#0f172a",
                                      border: "1px solid #334155",
                                      borderRadius: 8,
                                      color: "#e2e8f0",
                                    }}
                                  />
                                  <Bar dataKey="outOfZone" name="Out of Zone" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                  <ReferenceLine y={IDEAL_SLEEP_HOURS} stroke="#22c55e" strokeDasharray="4 4" />
                                  <Bar dataKey="sleepHours" name="Sleep Hours" fill="#818cf8" radius={[3, 3, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-white font-semibold text-sm">
                                  Pitch and Roll Movement
                                </p>
                                <p className="text-slate-500 text-xs">
                                  Motion changes recorded by the wearable sensor
                                </p>
                              </div>
                              <Activity className="text-purple-400" size={18} />
                            </div>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={sensorTrendData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                  <XAxis
                                    dataKey="label"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 10 }}
                                    interval="preserveStartEnd"
                                  />
                                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                  <Tooltip
                                    contentStyle={{
                                      background: "#0f172a",
                                      border: "1px solid #334155",
                                      borderRadius: 8,
                                      color: "#e2e8f0",
                                    }}
                                  />
                                  <Line type="monotone" dataKey="pitch" name="Pitch" stroke="#a78bfa" strokeWidth={2} dot={false} />
                                  <Line type="monotone" dataKey="roll" name="Roll" stroke="#38bdf8" strokeWidth={2} dot={false} />
                                </RechartsLineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {sensorTrendData.length > 0 && (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-white font-semibold text-sm">
                                Motion and BPM Trend
                              </p>
                              <p className="text-slate-500 text-xs">
                                Timestamp-based readings from Rafay's patient_logs collection
                              </p>
                            </div>
                            <BarChart3 size={18} className="text-cyan-400" />
                          </div>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsLineChart data={sensorTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                  dataKey="label"
                                  stroke="#94a3b8"
                                  tick={{ fontSize: 10 }}
                                  interval="preserveStartEnd"
                                />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                <Tooltip
                                  contentStyle={{
                                    background: "#0f172a",
                                    border: "1px solid #334155",
                                    borderRadius: 8,
                                    color: "#e2e8f0",
                                  }}
                                />
                                <Line type="monotone" dataKey="bpm" stroke="#fb7185" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="pitch" stroke="#a78bfa" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="roll" stroke="#38bdf8" strokeWidth={2} dot={false} />
                              </RechartsLineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-white font-semibold text-sm">
                                Daily Sensor Flags and Sleep
                              </p>
                              <p className="text-slate-500 text-xs">
                                Counts per date plus estimated sleep hours
                              </p>
                            </div>
                            <Activity size={18} className="text-amber-400" />
                          </div>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dailySensorData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    background: "#0f172a",
                                    border: "1px solid #334155",
                                    borderRadius: 8,
                                    color: "#e2e8f0",
                                  }}
                                />
                                <Bar dataKey="outOfBound" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="outOfZone" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="fall" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                <ReferenceLine y={IDEAL_SLEEP_HOURS} stroke="#22c55e" strokeDasharray="4 4" />
                                <Bar dataKey="sleepHours" name="Sleep Hours" fill="#818cf8" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {deviceMetrics.map((item) => (
                        <div
                          key={item.key}
                          className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-green-300">
                              {item.icon}
                            </span>
                            <Minus size={14} className="text-slate-400" />
                          </div>
                          <p className="text-white font-semibold text-sm">
                            {item.value}
                          </p>
                          <p className="text-slate-500 text-xs">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "treatment" && (
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
            )}

            {activeDetailTab === "support" && (
              <ClinicalTreatmentSupportPanel patient={selectedPatientForDT} />
            )}
          </div>
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
