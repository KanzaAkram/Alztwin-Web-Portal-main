import React from "react";
import { UserPlus, Eye, CheckCircle, XCircle } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRequestsFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              requestsFilter === tab.key
                ? "bg-purple-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          Loading requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <UserPlus size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">
            No {requestsFilter === "all" ? "" : requestsFilter} requests found
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Clinician ID: {user?.uid?.substring(0, 8)}...
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                      request.status === "accepted"
                        ? "bg-green-600"
                        : request.status === "rejected"
                        ? "bg-red-600"
                        : "bg-slate-700"
                    }`}
                  >
                    {(request.patientUserData?.displayName ||
                      request.patientId ||
                      "P"
                    ).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {request.patientUserData?.displayName ||
                        request.patientId?.substring(0, 12) + "..."}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Requested by:{" "}
                      {request.caregiverData?.email ||
                        request.caregiverId?.substring(0, 12) + "..."}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          request.status === "accepted"
                            ? "bg-green-500/20 text-green-400"
                            : request.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {request.status?.toUpperCase()}
                      </span>
                      {request.summary && (
                        <span className="text-xs text-slate-500">
                          • {request.summary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewPatient(request.patientId)}
                    className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                  >
                    <Eye size={16} />
                  </button>
                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => onAcceptRequest(request)}
                        className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => onRejectRequest(request)}
                        className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
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
