import React, { useMemo, useState } from "react";
import {
  Video,
  CalendarPlus,
  Search,
  Users,
  Calendar,
  Clock,
  Brain,
  Play,
  FileText,
  Phone,
  Activity,
  AlertTriangle,
  Filter,
  ChevronRight,
  Sparkles,
  Zap,
  Waves,
} from "lucide-react";
import { formatDate } from "../config";

const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (typeof ts === "number") return new Date(ts);
  if (typeof ts === "string") return new Date(ts);
  if (ts?.seconds) return new Date(ts.seconds * 1000);
  return null;
};

const formatRelative = (date) => {
  if (!date) return "Never";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  return `${Math.round(minutes)} min`;
};

const RISK_STYLE = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

export default function TeleconsultationSection({
  patients = [],
  consultations = [],
  onOpenScheduleModal,
  onSchedulePatient,
  onViewDigitalTwin,
  onStartCall,
}) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  // Index consultations by patient for quick lookup
  const consultsByPatient = useMemo(() => {
    const map = new Map();
    consultations.forEach((c) => {
      if (!c.patientId) return;
      const list = map.get(c.patientId) || [];
      list.push({
        ...c,
        scheduledAt: toDate(c.scheduledAt),
        createdAt: toDate(c.createdAt),
        endedAt: toDate(c.endedAt) || toDate(c.updatedAt),
        startedAt: toDate(c.startedAt) || toDate(c.createdAt),
      });
      map.set(c.patientId, list);
    });
    return map;
  }, [consultations]);

  const enrichedConsultations = useMemo(() => {
    const patientsById = new Map(patients.map((p) => [p.id, p]));
    return consultations.map((c) => {
      const patient = patientsById.get(c.patientId);
      const scheduledAt = toDate(c.scheduledAt);
      const createdAt = toDate(c.createdAt);
      const updatedAt = toDate(c.updatedAt);
      const endedAt = toDate(c.endedAt) || updatedAt;
      const startedAt = toDate(c.startedAt) || createdAt;
      const durationMin =
        startedAt && endedAt && endedAt > startedAt
          ? (endedAt - startedAt) / 60000
          : null;
      const when = scheduledAt || createdAt;
      return {
        ...c,
        patient,
        patientName: patient?.name || c.patientName || "Unknown Patient",
        avatar: patient?.avatar || "?",
        when,
        endedAt,
        durationMin,
      };
    });
  }, [consultations, patients]);

  // Sessions older than this with no "ended" write are treated as abandoned
  const STALE_AFTER_MS = 30 * 60 * 1000; // 30 minutes

  const isLikelyStale = (c) => {
    if (c.status !== "active" && c.status !== "waiting") return false;
    const ref = c.when?.getTime() || c.createdAt?.getTime?.() || 0;
    return ref > 0 && Date.now() - ref > STALE_AFTER_MS;
  };

  const upcoming = useMemo(() => {
    const now = Date.now();
    return enrichedConsultations
      .filter((c) => ["waiting", "scheduled", "active"].includes(c.status))
      .filter((c) => !isLikelyStale(c))
      .filter((c) => !c.when || c.when.getTime() >= now - STALE_AFTER_MS)
      .sort((a, b) => (a.when?.getTime() || 0) - (b.when?.getTime() || 0));
  }, [enrichedConsultations]);

  const history = useMemo(
    () =>
      enrichedConsultations
        .filter((c) => c.status === "ended" || c.status === "completed")
        .sort(
          (a, b) => (b.endedAt?.getTime() || 0) - (a.endedAt?.getTime() || 0)
        ),
    [enrichedConsultations]
  );

  // Enrich patients with last-consult info
  const enrichedPatients = useMemo(() => {
    return patients.map((p) => {
      const list = consultsByPatient.get(p.id) || [];
      const lastConsult = list
        .filter((c) => c.status === "ended" || c.status === "completed")
        .sort(
          (a, b) => (b.endedAt?.getTime() || 0) - (a.endedAt?.getTime() || 0)
        )[0];
      return {
        ...p,
        lastConsultAt: lastConsult?.endedAt || null,
        totalConsults: list.length,
      };
    });
  }, [patients, consultsByPatient]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedPatients.filter((p) => {
      if (riskFilter !== "all" && p.riskLevel !== riskFilter) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.diagnosis?.toLowerCase().includes(q)
      );
    });
  }, [enrichedPatients, search, riskFilter]);

  // Stats — all derived from real data
  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = enrichedConsultations.filter(
      (c) => toDate(c.createdAt)?.getTime() >= weekAgo
    ).length;
    const durations = history
      .map((c) => c.durationMin)
      .filter((d) => Number.isFinite(d) && d > 0);
    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : null;
    const activeNow = enrichedConsultations.filter(
      (c) => c.status === "active" && !isLikelyStale(c)
    ).length;
    return [
      {
        label: "Total Calls",
        value: String(history.length),
        sub:
          history.length > 0
            ? `last: ${formatRelative(history[0].endedAt)}`
            : "—",
        icon: Video,
        gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
        ring: "group-hover:ring-blue-400/40",
        iconBg: "bg-blue-500/20 text-blue-300",
      },
      {
        label: "This Week",
        value: String(thisWeek),
        sub: "new in last 7d",
        icon: Calendar,
        gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
        ring: "group-hover:ring-emerald-400/40",
        iconBg: "bg-emerald-500/20 text-emerald-300",
      },
      {
        label: "Avg Duration",
        value: avgDuration ? `${Math.round(avgDuration)}m` : "—",
        sub: durations.length > 0 ? `across ${durations.length} calls` : "no data yet",
        icon: Clock,
        gradient: "from-purple-500/20 via-fuchsia-500/10 to-transparent",
        ring: "group-hover:ring-purple-400/40",
        iconBg: "bg-purple-500/20 text-purple-300",
      },
      {
        label: "Live Now",
        value: String(activeNow),
        sub: upcoming.length > 0 ? `${upcoming.length} upcoming` : "none upcoming",
        icon: Activity,
        gradient: activeNow > 0
          ? "from-rose-500/25 via-pink-500/15 to-transparent"
          : "from-slate-500/10 via-slate-500/5 to-transparent",
        ring: activeNow > 0
          ? "group-hover:ring-rose-400/50 ring-1 ring-rose-500/20 animate-pulse"
          : "group-hover:ring-slate-500/30",
        iconBg: activeNow > 0
          ? "bg-rose-500/25 text-rose-300"
          : "bg-slate-700/40 text-slate-400",
        live: activeNow > 0,
      },
    ];
  }, [enrichedConsultations, history, upcoming]);

  const riskCounts = useMemo(() => {
    const counts = { all: enrichedPatients.length, high: 0, medium: 0, low: 0 };
    enrichedPatients.forEach((p) => {
      if (counts[p.riskLevel] !== undefined) counts[p.riskLevel]++;
    });
    return counts;
  }, [enrichedPatients]);

  return (
    <div className="space-y-6">
      {/* Playful hero header */}
      <div className="relative overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        {/* Animated blobs */}
        <div className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="pointer-events-none absolute top-8 right-1/4 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl" />
        {/* Dotted grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative flex items-center justify-between flex-wrap gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <Video size={26} className="text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Teleconsultation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-200 border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles size={10} className="animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-slate-400 text-sm max-w-xl">
                One-click video calls with live Digital Twin data, auto-saved
                notes, and full consultation history at your fingertips.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScheduleModal}
              className="group relative overflow-hidden flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:scale-[1.03] active:scale-95"
            >
              <span className="absolute inset-0 bg-white/10 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <CalendarPlus size={18} className="relative" />
              <span className="relative">Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Colorful stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-300 ${s.ring}`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  <s.icon size={16} />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  {s.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-white leading-none tracking-tight flex items-baseline gap-2">
                {s.value}
                {s.live && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-300 font-bold uppercase tracking-widest">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                    </span>
                    on air
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Patient list + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient picker */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-white flex items-center">
              <Users size={18} className="mr-2 text-blue-400" />
              Start a Consultation
              <span className="ml-2 text-xs text-slate-500 font-normal">
                ({filteredPatients.length}/{enrichedPatients.length})
              </span>
            </h3>
            <div className="relative flex-1 max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search patients..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Risk filter chips */}
          <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            <Filter size={12} className="text-slate-500 flex-shrink-0" />
            {["all", "high", "medium", "low"].map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors flex-shrink-0 ${
                  riskFilter === r
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                {r} · {riskCounts[r]}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-800 max-h-[460px] overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                {enrichedPatients.length === 0
                  ? "No patients yet. Accept a request to get started."
                  : "No patients match the current filter."}
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  onCall={() => onStartCall(patient)}
                  onSchedule={() => {
                    onSchedulePatient(patient);
                    onOpenScheduleModal();
                  }}
                  onViewTwin={() => onViewDigitalTwin(patient)}
                />
              ))
            )}
          </div>
        </div>

        {/* Upcoming panel */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center">
              <CalendarPlus size={18} className="mr-2 text-emerald-400" />
              Upcoming
            </h3>
            <span className="text-xs text-slate-500">{upcoming.length}</span>
          </div>
          <div className="p-3 space-y-2 max-h-[460px] overflow-y-auto">
            {upcoming.length === 0 ? (
              <button
                onClick={onOpenScheduleModal}
                className="group w-full p-8 rounded-xl relative overflow-hidden transition-all"
              >
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-slate-700 group-hover:border-emerald-500/50 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 transition-all" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CalendarPlus size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-300 font-medium text-sm group-hover:text-emerald-300 transition-colors">
                      Nothing scheduled
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Click to book a consultation
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              upcoming.map((apt, idx) => (
                <div
                  key={apt.id}
                  className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-800/40 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  {apt.status === "active" && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                      </span>
                      <span className="text-[9px] text-rose-300 font-bold uppercase tracking-wider">
                        Live
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-900">
                        {apt.avatar}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {apt.patientName}
                      </p>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-emerald-400" />
                        {formatDateTime(apt.when)}
                      </p>
                    </div>
                  </div>
                  {apt.patient && (
                    <button
                      onClick={() => onStartCall(apt.patient)}
                      className="group/j relative overflow-hidden w-full flex items-center justify-center space-x-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 py-2 rounded-lg text-xs font-semibold transition-all border border-emerald-500/30 hover:border-emerald-400/60"
                    >
                      <span className="absolute inset-0 bg-emerald-400/10 translate-x-[-200%] group-hover/j:translate-x-[200%] transition-transform duration-700" />
                      <Play size={11} className="relative fill-emerald-300" />
                      <span className="relative uppercase tracking-wider">Join now</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center">
            <Clock size={18} className="mr-2 text-purple-400" />
            Consultation History
            <span className="ml-2 text-xs text-slate-500 font-normal">
              ({history.length})
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">
              No past consultations. Completed calls will appear here.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/40 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-3 text-left">Patient</th>
                  <th className="px-5 py-3 text-left">Ended</th>
                  <th className="px-5 py-3 text-left">Duration</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Notes</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.slice(0, 20).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                          {c.avatar}
                        </div>
                        <span className="text-white font-medium text-sm">
                          {c.patientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm whitespace-nowrap">
                      {formatDateTime(c.endedAt)}
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm">
                      {formatDuration(c.durationMin)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300 uppercase">
                        {c.type || "General"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm max-w-xs truncate">
                      {c.notes || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.patient && (
                        <button
                          onClick={() => onStartCall(c.patient)}
                          className="inline-flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors"
                        >
                          <Phone size={12} />
                          <span>Call again</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientRow({ patient, onCall, onSchedule, onViewTwin }) {
  const risk = patient.riskLevel || "unknown";
  const riskCls = RISK_STYLE[risk] || "bg-slate-700/40 text-slate-400 border-slate-700";
  const hasAnalysis = !!patient.lastAnalysisAt;
  // Gradient avatars — pick by hash of id for variety
  const avatarGradients = [
    "from-blue-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-fuchsia-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-indigo-500",
  ];
  const gradIdx = (patient.id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % avatarGradients.length;
  const avatarGrad = avatarGradients[gradIdx];

  return (
    <div className="group relative p-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-500/5 hover:via-transparent hover:to-transparent">
      {/* Left accent bar on hover */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0 group-hover:h-12 w-1 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-r transition-all duration-300" />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            {/* Glow ring */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${avatarGrad} blur-lg opacity-0 group-hover:opacity-60 transition-opacity`} />
            <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-900 group-hover:scale-105 transition-transform`}>
              {patient.avatar}
            </div>
            {risk === "high" && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center animate-pulse">
                <AlertTriangle size={9} className="text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold text-sm truncate group-hover:text-emerald-300 transition-colors">
                {patient.name}
              </p>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${riskCls}`}
              >
                {risk}
                {typeof patient.riskScore === "number" && patient.riskScore > 0
                  ? ` · ${patient.riskScore}%`
                  : ""}
              </span>
              {hasAnalysis && (
                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  <Brain size={9} />
                  AI
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs truncate mt-0.5">
              {hasAnalysis ? patient.diagnosis : (
                <span className="italic text-yellow-400/70">
                  Pending AI analysis
                </span>
              )}
            </p>
            <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={10} className="text-slate-600" />
                {formatRelative(patient.lastConsultAt)}
              </span>
              {patient.totalConsults > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                  <Phone size={9} className="text-slate-600" />
                  {patient.totalConsults}
                </span>
              )}
              {patient.aiConfidence != null && (
                <span className="flex items-center gap-1">
                  <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                  <Zap size={9} className="text-blue-400/70" />
                  {(patient.aiConfidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onViewTwin}
            className="p-2 bg-slate-800/60 hover:bg-purple-500/20 hover:scale-110 text-slate-400 hover:text-purple-300 rounded-lg transition-all active:scale-95"
            title="Open Digital Twin"
          >
            <Brain size={15} />
          </button>
          <button
            onClick={onSchedule}
            className="p-2 bg-slate-800/60 hover:bg-blue-500/20 hover:scale-110 text-slate-400 hover:text-blue-300 rounded-lg transition-all active:scale-95"
            title="Schedule"
          >
            <Calendar size={15} />
          </button>
          <button
            onClick={onCall}
            className="group/btn relative overflow-hidden flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-md shadow-emerald-500/30 hover:shadow-emerald-400/60 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 bg-white/10 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
            <Video size={14} className="relative" />
            <span className="relative">Call</span>
            <ChevronRight size={12} className="relative opacity-70 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
