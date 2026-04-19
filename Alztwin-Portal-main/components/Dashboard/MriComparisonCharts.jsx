import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BarChart3,
  LineChart as LineIcon,
  Radar as RadarIcon,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { formatDate } from "./config";

const STAGE_CLASSES = [
  "NonDemented",
  "VeryMildDemented",
  "MildDemented",
  "ModerateDemented",
];

const CLASS_COLORS = {
  NonDemented: "#10b981",
  VeryMildDemented: "#facc15",
  MildDemented: "#fb923c",
  ModerateDemented: "#ef4444",
};

const formatTs = (ts) => {
  if (!ts) return "—";
  const ms = ts.seconds ? ts.seconds * 1000 : ts;
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
};

const TrendIcon = ({ direction, size = 14 }) => {
  if (direction === "up") return <TrendingUp size={size} className="text-red-400" />;
  if (direction === "down") return <TrendingDown size={size} className="text-green-400" />;
  return <Minus size={size} className="text-slate-400" />;
};

export default function MriComparisonCharts({ aiHistory = [] }) {
  const [view, setView] = useState("bars"); // bars | radar | trend

  const hasAny = aiHistory.length > 0;
  const hasCompare = aiHistory.length >= 2;
  const latest = aiHistory[0];
  const previous = aiHistory[1];

  // --- Per-class distribution comparison (latest vs previous) ---
  const classComparisonData = useMemo(() => {
    if (!hasAny) return [];
    const latestDetails = latest?.stageApi?.details || {};
    const prevDetails = previous?.stageApi?.details || {};
    return STAGE_CLASSES.map((cls) => ({
      stage: cls.replace("Demented", ""),
      Previous: Number(prevDetails[cls] ?? 0),
      Latest: Number(latestDetails[cls] ?? 0),
    }));
  }, [hasAny, latest, previous]);

  // --- Trend over time (oldest → newest) ---
  const trendData = useMemo(() => {
    return [...aiHistory]
      .reverse()
      .map((h, idx) => ({
        idx: idx + 1,
        date: formatTs(h.createdAt),
        stageLevel: h.stageLevel ?? 0,
        confidence:
          h.stageApi?.confidence != null
            ? Number((h.stageApi.confidence * 100).toFixed(2))
            : null,
        riskScore: h.riskScore ?? null,
        stage: h.currentStage || h.stageApi?.stage || "—",
      }));
  }, [aiHistory]);

  // --- Delta summary (latest - previous) ---
  const delta = useMemo(() => {
    if (!hasCompare) return null;
    const latestDetails = latest?.stageApi?.details || {};
    const prevDetails = previous?.stageApi?.details || {};
    const diffs = STAGE_CLASSES.map((cls) => ({
      cls: cls.replace("Demented", ""),
      delta: Number((latestDetails[cls] ?? 0) - (prevDetails[cls] ?? 0)),
    }));
    const stageLevelDelta = (latest.stageLevel ?? 0) - (previous.stageLevel ?? 0);
    const confDelta =
      latest.stageApi?.confidence != null && previous.stageApi?.confidence != null
        ? (latest.stageApi.confidence - previous.stageApi.confidence) * 100
        : null;
    return { diffs, stageLevelDelta, confDelta };
  }, [hasCompare, latest, previous]);

  const dirOf = (v) => (v > 0.001 ? "up" : v < -0.001 ? "down" : "flat");

  if (!hasAny) {
    return (
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold flex items-center mb-3">
          <BarChart3 className="mr-2 text-emerald-400" size={20} />
          MRI Scan Comparison
        </h3>
        <p className="text-sm text-slate-500 italic">
          Run AI diagnostics on at least one MRI scan to see visualizations here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-white font-semibold flex items-center">
          <BarChart3 className="mr-2 text-emerald-400" size={20} />
          MRI Scan Comparison
          <span className="ml-2 text-xs text-slate-400 font-normal">
            ({aiHistory.length} scan{aiHistory.length === 1 ? "" : "s"} analyzed)
          </span>
        </h3>
        <div className="flex items-center space-x-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          <TabBtn active={view === "bars"} onClick={() => setView("bars")} icon={<BarChart3 size={14} />}>
            Classes
          </TabBtn>
          <TabBtn active={view === "radar"} onClick={() => setView("radar")} icon={<RadarIcon size={14} />}>
            Radar
          </TabBtn>
          <TabBtn active={view === "trend"} onClick={() => setView("trend")} icon={<LineIcon size={14} />}>
            Trend
          </TabBtn>
        </div>
      </div>

      {/* Scan context */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
          <p className="text-[10px] uppercase tracking-wider text-purple-300 font-bold mb-1">
            Previous Scan
          </p>
          <p className="text-slate-200 font-medium">
            {previous ? formatTs(previous.createdAt) : "— no prior scan —"}
          </p>
          {previous && (
            <p className="text-slate-400 text-[11px]">
              {previous.currentStage} ·{" "}
              {previous.stageApi?.confidence != null
                ? `${(previous.stageApi.confidence * 100).toFixed(1)}%`
                : "—"}{" "}
              confidence
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-1">
            Latest Scan
          </p>
          <p className="text-slate-200 font-medium">{formatTs(latest.createdAt)}</p>
          <p className="text-slate-400 text-[11px]">
            {latest.currentStage} ·{" "}
            {latest.stageApi?.confidence != null
              ? `${(latest.stageApi.confidence * 100).toFixed(1)}%`
              : "—"}{" "}
            confidence
          </p>
        </div>
      </div>

      {/* --- Bars: per-class scores latest vs previous --- */}
      {view === "bars" && (
        <div className="bg-slate-900/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-2">
            Per-class model scores (higher = stronger prediction for that class)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={classComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {hasCompare && <Bar dataKey="Previous" fill="#a78bfa" radius={[4, 4, 0, 0]} />}
              <Bar dataKey="Latest" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {!hasCompare && (
            <p className="text-[11px] text-slate-500 italic mt-2 text-center">
              Upload a new MRI and run diagnostics again to compare against this baseline.
            </p>
          )}
        </div>
      )}

      {/* --- Radar: shape of class distribution --- */}
      {view === "radar" && (
        <div className="bg-slate-900/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-2">
            Distribution shape across all four stages
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={classComparisonData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="stage" stroke="#cbd5e1" fontSize={11} />
              <PolarRadiusAxis stroke="#475569" fontSize={10} />
              {hasCompare && (
                <Radar
                  name="Previous"
                  dataKey="Previous"
                  stroke="#a78bfa"
                  fill="#a78bfa"
                  fillOpacity={0.25}
                />
              )}
              <Radar
                name="Latest"
                dataKey="Latest"
                stroke="#60a5fa"
                fill="#60a5fa"
                fillOpacity={0.35}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Trend: stage level + confidence + risk over time --- */}
      {view === "trend" && (
        <div className="bg-slate-900/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-2">
            Stage level, confidence & risk score across all analyzed scans
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis
                yAxisId="left"
                stroke="#94a3b8"
                fontSize={11}
                domain={[0, 3]}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={11}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="stageLevel"
                name="Stage Level (0-3)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="confidence"
                name="Confidence %"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="riskScore"
                name="Risk Score %"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Delta summary */}
      {delta && (
        <div className="mt-4 p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
            Change Summary (Latest vs Previous)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
            <div className="p-2 bg-slate-800/60 rounded">
              <p className="text-slate-500 text-[10px]">Stage Level</p>
              <p className="flex items-center font-bold text-white">
                <TrendIcon direction={dirOf(delta.stageLevelDelta)} />
                <span className="ml-1">
                  {delta.stageLevelDelta > 0 ? "+" : ""}
                  {delta.stageLevelDelta}
                </span>
              </p>
            </div>
            {delta.confDelta != null && (
              <div className="p-2 bg-slate-800/60 rounded">
                <p className="text-slate-500 text-[10px]">Confidence</p>
                <p className="flex items-center font-bold text-white">
                  <TrendIcon direction={dirOf(delta.confDelta)} />
                  <span className="ml-1">
                    {delta.confDelta > 0 ? "+" : ""}
                    {delta.confDelta.toFixed(1)}%
                  </span>
                </p>
              </div>
            )}
            {delta.diffs.map((d) => (
              <div key={d.cls} className="p-2 bg-slate-800/60 rounded">
                <p
                  className="text-[10px]"
                  style={{ color: CLASS_COLORS[d.cls + "Demented"] || "#94a3b8" }}
                >
                  {d.cls}
                </p>
                <p className="flex items-center font-bold text-white">
                  <TrendIcon direction={dirOf(d.delta)} />
                  <span className="ml-1">
                    {d.delta > 0 ? "+" : ""}
                    {d.delta.toFixed(2)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-slate-700 text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
