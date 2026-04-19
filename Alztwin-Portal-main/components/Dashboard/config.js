/**
 * Dashboard configuration and shared utilities
 */

const isDev = import.meta.env?.DEV;

export const API_STAGE_URL = isDev
  ? "/api/stage"
  : "https://currentstagepredictionalztwin-d0dug2cmffeqfpa2.uaenorth-01.azurewebsites.net/predict";
export const API_PROGRESSION_URL = isDev
  ? "/api/progression"
  : "https://trajectoryprogressionprediction-fpc8f8b9gqd3ggcm.uaenorth-01.azurewebsites.net/predict";
export const API_3D_MODEL_URL = isDev
  ? "/api/brain"
  : "https://alztwin-brain-api.azurewebsites.net";

export const RAG_FUNCTION_CODE =
  "gqkqEhgGIuKrDBnE8MolPCcN2Uq-_WoGbeD-w2gz2qLNAzFuAGSKug==";
export const API_RAG_URL = isDev
  ? `/api/rag/recommend?code=${RAG_FUNCTION_CODE}`
  : `https://func-alztwin-proto.azurewebsites.net/api/recommend?code=${RAG_FUNCTION_CODE}`;

export const RAG_STAGE_FROM_LEVEL = ["normal", "mild", "moderate", "severe"];
export const mapStageToRag = (currentStage, stageLevel) => {
  if (typeof stageLevel === "number" && RAG_STAGE_FROM_LEVEL[stageLevel]) {
    return RAG_STAGE_FROM_LEVEL[stageLevel];
  }
  const s = (currentStage || "").toLowerCase();
  if (!s) return "mild";
  if (s.includes("severe") || s.includes("moderatedemented")) return "severe";
  if (s.includes("moderate")) return "moderate";
  if (s.includes("mild") || s.includes("mci")) return "mild";
  if (s.includes("normal") || s.includes("nondemented") || s === "cn") return "normal";
  return "mild";
};

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
