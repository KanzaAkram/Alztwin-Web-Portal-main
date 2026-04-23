import React from "react";
import { UserPlus, Eye, CheckCircle, XCircle } from "lucide-react";
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

  const heading = isLight ? "text-slate-950" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-slate-400";
  const subtle = isLight ? "text-slate-500" : "text-slate-500";
  const tabIdle = isLight
    ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
    : "bg-slate-800 text-slate-400 hover:bg-slate-700";
  const tabActive = isLight
    ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] text-white shadow-[0_10px_24px_rgba(15,118,110,0.18)]"
    : "bg-purple-500 text-white";
  const emptyCard = isLight
    ? "bg-white/90 border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    : "bg-slate-900/50 border border-slate-800";
  const requestCard = isLight
    ? "bg-white/92 border border-slate-200 shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
    : "bg-slate-900/50 border border-slate-800";
  const viewBtn = isLight
    ? "p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
    : "p-2 bg-slate-700 text-white rounded hover:bg-slate-600";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRequestsFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              requestsFilter === tab.key ? tabActive : tabIdle
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`p-12 text-center ${muted}`}>Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className={`${emptyCard} rounded-xl p-12 text-center`}>
          <UserPlus size={48} className={`mx-auto mb-4 ${isLight ? "text-slate-300" : "text-slate-600"}`} />
          <p className={`${muted} text-lg`}>
            No {requestsFilter === "all" ? "" : requestsFilter} requests found
          </p>
          <p className={`${subtle} text-sm mt-2`}>
            Clinician ID: {user?.uid?.substring(0, 8)}...
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((request) => (
            <div key={request.id} className={`${requestCard} rounded-xl p-5`}>
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
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          request.status === "accepted"
                            ? "bg-green-500/20 text-green-500"
                            : request.status === "rejected"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-amber-500/20 text-amber-600"
                        }`}
                      >
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
                        className="p-2 bg-green-500/20 text-green-600 rounded hover:bg-green-500/30"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => onRejectRequest(request)}
                        className="p-2 bg-red-500/20 text-red-600 rounded hover:bg-red-500/30"
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
