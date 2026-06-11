/**
 * Dashboard configuration and shared utilities
 */

// All API calls go through relative /api/* paths.
// In dev, Vite proxy (vite.config.js) forwards to the real Azure hosts.
// In prod, Vercel rewrites (vercel.json) forward to the real Azure hosts.
// This keeps the browser same-origin so CORS never applies.
export const API_STAGE_URL = "/api/stage";
export const API_PROGRESSION_URL = "/api/progression";
export const API_COGNITIVE_URL = "/api/cognitive";
export const API_3D_MODEL_URL = "/api/brain";

export const RAG_FUNCTION_CODE =
  "gqkqEhgGIuKrDBnE8MolPCcN2Uq-_WoGbeD-w2gz2qLNAzFuAGSKug==";
export const API_RAG_URL = `/api/rag/recommend?code=${RAG_FUNCTION_CODE}`;

// RAG API accepts: very_mild | mild | moderate | severe
export const RAG_STAGE_FROM_LEVEL = ["very_mild", "mild", "moderate", "severe"];
export const RAG_SLEEP_QUALITY = ["good", "fair", "poor", "unknown"];

export const mapStageToRag = (currentStage, stageLevel) => {
  if (typeof stageLevel === "number" && RAG_STAGE_FROM_LEVEL[stageLevel]) {
    return RAG_STAGE_FROM_LEVEL[stageLevel];
  }
  const s = (currentStage || "").toLowerCase();
  if (RAG_STAGE_FROM_LEVEL.includes(s)) return s;
  if (s === "normal") return "very_mild";
  if (!s) return "mild";
  if (s.includes("severe") || s.includes("moderatedemented")) return "severe";
  if (s.includes("moderate")) return "moderate";
  if (s.includes("verymild") || s.includes("very_mild")) return "very_mild";
  if (s.includes("mild") || s.includes("mci")) return "mild";
  if (s.includes("nondemented") || s === "cn" || s.includes("normal")) {
    return "very_mild";
  }
  return "mild";
};

export const normalizeRagSleepQuality = (value) => {
  const v = String(value || "").toLowerCase();
  if (RAG_SLEEP_QUALITY.includes(v)) return v;
  if (v === "average") return "fair";
  return "fair";
};

const toFiniteNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const buildRagRequestPayload = ({
  age,
  patientId,
  vitals,
  stage,
  topK,
  comorbidities,
  medications,
}) => ({
  age: Math.round(toFiniteNumber(age, 70)),
  patient_id: patientId || "unknown",
  vitals: {
    sleep_quality: normalizeRagSleepQuality(vitals?.sleep_quality),
    sleep_hours: toFiniteNumber(vitals?.sleep_hours, 7),
    systolic_bp: Math.round(toFiniteNumber(vitals?.systolic_bp, 120)),
    diastolic_bp: Math.round(toFiniteNumber(vitals?.diastolic_bp, 80)),
    heart_rate_bpm: Math.round(toFiniteNumber(vitals?.heart_rate_bpm, 75)),
  },
  stage: mapStageToRag(stage),
  top_k: Math.max(1, Math.min(10, Math.round(toFiniteNumber(topK, 3)))),
  comorbidities: Array.isArray(comorbidities) ? comorbidities : [],
  current_medications: Array.isArray(medications) ? medications : [],
});

export const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case "high":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "medium":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "low":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

export const STAGE_LEVEL_MAP = {
  CN: 0, Normal: 0, NonDemented: 0, SMC: 0,
  EMCI: 1, MCI: 1, VeryMildDemented: 1,
  LMCI: 2, Mild: 2, MildDemented: 2,
  AD: 3, Severe: 3, ModerateDemented: 3,
};

export const TRAJECTORY_STAGES = ["CN", "SMC", "LMCI", "EMCI", "MCI", "AD"];

// Progression model accepts only: CN, SMC, LMCI, EMCI, MCI, AD.
// This mapper converts stage-model outputs to the trajectory label set.
export const mapStageToTrajectory = (stage) => {
  const raw = String(stage || "").trim();
  const upper = raw.toUpperCase();

  // Pass-through for already-compatible labels.
  if (TRAJECTORY_STAGES.includes(upper)) return upper;

  // Required mappings from user requirements.
  if (upper.includes("VERYMILDDEMENTED")) return "SMC";
  if (upper.includes("MILDDEMENTED")) return "MCI";
  if (upper.includes("NONDEMENTED")) return "CN";
  if (upper.includes("MODERATEDEMENTED")) return "AD";

  // Practical fallbacks for common variants.
  if (upper === "NORMAL" || upper.includes("COGNITIVELY NORMAL")) return "CN";
  if (upper.includes("SMC")) return "SMC";
  if (upper.includes("LMCI")) return "LMCI";
  if (upper.includes("EMCI")) return "EMCI";
  if (upper.includes("MCI") || upper.includes("MILD")) return "MCI";
  if (upper.includes("AD") || upper.includes("SEVERE")) return "AD";

  // Safe default for unknown labels.
  return "MCI";
};

export const deriveRiskFromStage = (stage, confidence = 1) => {
  const level = STAGE_LEVEL_MAP[stage] ?? 0;
  const baseScore = [15, 45, 70, 92][level];
  const score = Math.round(baseScore * Math.min(1, Math.max(0.5, confidence)));
  let riskLevel = "low";
  if (level >= 3 || score >= 80) riskLevel = "high";
  else if (level >= 1 || score >= 40) riskLevel = "medium";
  return { riskLevel, riskScore: score, stageLevel: level };
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return new Date(timestamp).toLocaleDateString();
};

export const base64ToBlob = (base64Data, contentType = "application/dicom") => {
  if (!base64Data) return null;
  const byteCharacters = atob(base64Data.split(",")[1] || base64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
};
