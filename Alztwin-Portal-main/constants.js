import {
  Activity,
  Brain,
  Database,
  LineChart,
  Bell,
  FileText,
} from "lucide-react";

export const FEATURES = [
  {
    title: "Digital Twin Modeling",
    description:
      "Integrates MRI and wearable data to create dynamic patient models, visualizing brain health evolution in real-time.",
    icon: Brain,
  },
  {
    title: "IoT Real-Time Monitoring",
    description:
      "Continuous tracking of physiological metrics and location, automatically flagging falls or lifestyle anomalies.",
    icon: Activity,
  },
  {
    title: "Disease Forecasting",
    description:
      "AI-powered predictive analytics that project cognitive decline, enabling earlier and more precise interventions.",
    icon: LineChart,
  },
  {
    title: "RAG Decision Support",
    description:
      "Generates evidence-based treatment recommendations and lifestyle adjustments tailored to specific patient profiles.",
    icon: Database,
  },
  {
    title: "Smart Alerts",
    description:
      "Instant notification system for critical safety events like wandering or sudden vital sign deviations.",
    icon: Bell,
  },
  {
    title: "Unified Reporting",
    description:
      "Consolidates fragmented clinical data into a single intuitive view, reducing administrative burden and improving focus.",
    icon: FileText,
  },
];

// Mock data for the specific "Biomarker Extraction" graph
export const HIPPOCAMPAL_DATA = [
  { month: "Jan", actualVolume: 3200, predictedVolume: 3200, threshold: 2800 },
  { month: "Feb", actualVolume: 3180, predictedVolume: 3190, threshold: 2800 },
  { month: "Mar", actualVolume: 3150, predictedVolume: 3175, threshold: 2800 },
  { month: "Apr", actualVolume: 3120, predictedVolume: 3160, threshold: 2800 },
  { month: "May", actualVolume: 3080, predictedVolume: 3140, threshold: 2800 },
  { month: "Jun", actualVolume: 3050, predictedVolume: 3120, threshold: 2800 },
  { month: "Jul", actualVolume: null, predictedVolume: 3090, threshold: 2800 }, // Prediction start
  { month: "Aug", actualVolume: null, predictedVolume: 3060, threshold: 2800 },
  { month: "Sep", actualVolume: null, predictedVolume: 3030, threshold: 2800 },
];
