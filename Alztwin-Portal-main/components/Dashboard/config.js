/**
 * Dashboard configuration and shared utilities
 */

export const API_STAGE_URL =
  "https://cors-anywhere.herokuapp.com/https://b537-34-145-56-129.ngrok-free.app/predict";
export const API_PROGRESSION_URL =
  "https://cors-anywhere.herokuapp.com/https://b626-34-50-189-86.ngrok-free.app/predict";
export const API_3D_MODEL_URL =
  "https://cors-anywhere.herokuapp.com/https://integrant-freeman-inscriptively.ngrok-free.dev";

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
