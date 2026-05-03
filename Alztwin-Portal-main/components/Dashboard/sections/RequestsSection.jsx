import React from "react";
import { UserPlus, Eye, CheckCircle, XCircle, Clock, ShieldCheck, Ban } from "lucide-react";
import { useTheme } from "../../ThemeContext";

export default function RequestsSection({
  user,
  loading,
  allRequests,
  requestsFilter,
  setRequestsFilter,
  onViewPatient,
  onAcceptRequest,
  onRejectRequest,
}) {
  const { isLight } = useTheme();

  const filtered = allRequests.filter(
    (r) => requestsFilter === "all" || r.status === requestsFilter
  );

  const tabs = [
    { key: "all", label: "All Requests", count: allRequests.length },
    {
      key: "pending",
      label: "Pending",
      count: allRequests.filter((r) => r.status === "pending").length,
    },
    {
      key: "accepted",
      label: "Accepted",
      count: allRequests.filter((r) => r.status === "accepted").length,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: allRequests.filter((r) => r.status === "rejected").length,
    },
  ];

  const heading = isLight ? "text-[#102a37]" : "text-white";
  const muted = isLight ? "text-[#365565]" : "text-slate-400";
  const subtle = isLight ? "text-[#517080]" : "text-slate-500";
  const tabIdle = isLight
    ? "bg-[#eaf7f4] border border-teal-900/10 text-[#315666] hover:bg-[#cfe7e2] hover:text-teal-950 hover:border-teal-700/30"
    : "bg-slate-800 text-slate-400 hover:bg-slate-700";
  const tabActive = isLight
    ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] text-white shadow-[0_12px_26px_rgba(15,118,110,0.22)] border border-transparent"
    : "bg-purple-500 text-white";
  const emptyCard = isLight
    ? "bg-[#d8eee9]/92 border border-teal-900/10 shadow-[0_24px_58px_rgba(15,23,42,0.10)]"
    : "bg-slate-900/50 border border-slate-800";
  const requestCard = isLight
    ? "bg-[#d8eee9]/92 border border-teal-900/10 shadow-[0_16px_38px_rgba(15,23,42,0.08)] hover:border-teal-700/30 hover:shadow-[0_24px_52px_rgba(15,23,42,0.11)]"
    : "bg-slate-900/50 border border-slate-800";
  const viewBtn = isLight
    ? "p-2 bg-[#eaf7f4] text-[#315666] rounded-lg border border-teal-900/10 hover:bg-[#cfe7e2] hover:text-teal-950"
    : "p-2 bg-slate-700 text-white rounded hover:bg-slate-600";
  const statusStyle = (status) => {
    if (status === "accepted") {
      return isLight
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-green-500/20 text-green-500 border-green-500/20";
    }
    if (status === "rejected") {
      return isLight
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-red-500/20 text-red-500 border-red-500/20";
    }
    return isLight
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-amber-500/20 text-amber-600 border-amber-500/20";
  };
  const StatusIcon =
    requestsFilter === "accepted" ? ShieldCheck : requestsFilter === "rejected" ? Ban : Clock;

  return (
    <div className="space-y-4">
      <div className={`${isLight ? "bg-[#d8eee9]/82 border-teal-900/10 shadow-[0_14px_34px_rgba(15,23,42,0.07)]" : "bg-slate-900/40 border-slate-800"} border rounded-2xl p-4`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isLight ? "text-teal-800" : "text-purple-300"}`}>
              Patient Access Workflow
            </p>
            <h2 className={`mt-1 text-lg font-semibold ${heading}`}>Patient Requests</h2>
            <p className={`mt-1 text-sm ${muted}`}>Review caregiver access requests and manage clinician approvals.</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${isLight ? "bg-[#eaf7f4] border-teal-900/10 text-[#315666]" : "bg-slate-800 border-slate-700 text-slate-300"}`}>
            <StatusIcon size={16} />
            <span>{filtered.length} shown</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRequestsFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
              requestsFilter === tab.key ? tabActive : tabIdle
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`${emptyCard} rounded-xl p-12 text-center ${muted}`}>Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className={`${emptyCard} rounded-xl p-12 text-center`}>
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isLight ? "bg-[#cfe7e2] text-teal-800" : "bg-slate-800 text-slate-600"}`}>
            <UserPlus size={30} />
          </div>
          <p className={`${heading} text-lg font-semibold`}>
            No {requestsFilter === "all" ? "" : requestsFilter} requests found
          </p>
          <p className={`${subtle} text-sm mt-2`}>
            Clinician ID: {user?.uid?.substring(0, 8)}...
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((request) => (
            <div key={request.id} className={`${requestCard} rounded-xl p-5 transition-all`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                      request.status === "accepted"
                        ? "bg-green-600"
                        : request.status === "rejected"
                        ? "bg-red-600"
                        : isLight
                        ? "bg-[linear-gradient(135deg,#0f766e,#155e75)]"
                        : "bg-slate-700"
                    }`}
                  >
                    {(request.patientUserData?.displayName || request.patientId || "P")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${heading}`}>
                      {request.patientUserData?.displayName ||
                        request.patientId?.substring(0, 12) + "..."}
                    </h3>
                    <p className={`text-sm ${muted}`}>
                      Requested by:{" "}
                      {request.caregiverData?.email ||
                        request.caregiverId?.substring(0, 12) + "..."}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusStyle(request.status)}`}>
                        {request.status?.toUpperCase()}
                      </span>
                      {request.summary && (
                        <span className={`text-xs ${subtle}`}>• {request.summary}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => onViewPatient(request.patientId)} className={viewBtn}>
                    <Eye size={16} />
                  </button>
                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => onAcceptRequest(request)}
                        className={`${isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-green-500/20 text-green-600 hover:bg-green-500/30"} p-2 rounded-lg border transition-colors`}
                        title="Accept request"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => onRejectRequest(request)}
                        className={`${isLight ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-red-500/20 text-red-600 hover:bg-red-500/30"} p-2 rounded-lg border transition-colors`}
                        title="Reject request"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
