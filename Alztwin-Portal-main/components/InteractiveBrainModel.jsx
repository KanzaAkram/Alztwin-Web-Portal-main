import React, { useEffect, useRef, useState } from "react";
import {
  Scan,
  Brain,
  Activity,
  Zap,
  Info,
  Target,
  Share2,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

const REGIONS = [
  {
    id: "frontal",
    label: "Frontal Lobe",
    description:
      "Responsible for cognitive function, memory, and behavior planning.",
    x: 0,
    y: -0.8,
    z: 0.5,
    stats: { label: "Cognitive Load", value: "84%", trend: "stable" },
  },
  {
    id: "hippocampus",
    label: "Hippocampus",
    description:
      "Critical area for memory formation. Primary target for early AD detection.",
    x: 0.3,
    y: 0.2,
    z: 0.2,
    stats: { label: "Volume Integrity", value: "92%", trend: "down" },
  },
  {
    id: "temporal",
    label: "Temporal Lobe",
    description:
      "Processes sensory input and is vital for language and emotion.",
    x: -0.6,
    y: 0.1,
    z: -0.2,
    stats: { label: "Metabolism", value: "Normal", trend: "stable" },
  },
  {
    id: "occipital",
    label: "Occipital Lobe",
    description: "Visual processing center of the mammalian brain.",
    x: 0,
    y: 0.9,
    z: 0,
    stats: { label: "Visual Cortex", value: "Active", trend: "stable" },
  },
];

const STAT_DEFINITIONS = {
  "Cognitive Load":
    "Indicates the intensity of mental processing and executive function efficiency. Higher loads may precede fatigue.",
  "Volume Integrity":
    "Ratio of current hippocampal tissue volume compared to age-matched healthy baselines. Key biomarker for AD.",
  Metabolism:
    "Glucose uptake rate in the region, serving as a direct proxy for neuronal health and synaptic activity.",
  "Visual Cortex":
    "Functional connectivity and activity levels within the visual processing network, often preserved in early stages.",
};

export const InteractiveBrainModel = () => {
  const { isLight } = useTheme();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1); // Multiplier

  // Initialize Points
  const points = useRef([]);
  const connections = useRef([]); // Adjacency list for lines
  const backgroundParticles = useRef([]);

  useEffect(() => {
    // Generate Brain Shape (Two Hemispheres)
    const numPoints = 1800; // Increased density for better 3D look
    const p = [];

    for (let i = 0; i < numPoints; i++) {
      // Determine hemisphere (left/right)
      const isRight = Math.random() > 0.5 ? 1 : -1;

      // Use spherical coordinates with distortions to shape like a brain
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      // Add some noise to radius for organic look
      const r = 0.8 + Math.random() * 0.15;

      // Brain shape modification
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);

      // Shaping logic
      x *= 0.55; // Narrower width
      x += 0.18 * isRight; // Distinct separation between hemispheres
      y *= 1.25; // Elongated front-to-back
      z *= 0.75; // Flatter height

      // Add "Cerebellum" bump at the back-bottom
      if (y > 0.4 && z < -0.3) {
        z -= 0.15;
        x *= 1.1; // Wider at base
      }

      // Indent temporal lobes side
      if (y > -0.2 && y < 0.4 && Math.abs(x) > 0.3 && z < 0) {
        x *= 1.1;
      }

      p.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        color:
          Math.random() > 0.7
            ? "#60a5fa"
            : Math.random() > 0.5
            ? "#3b82f6"
            : "#93c5fd", // varied blues
        size: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    points.current = p;

    // Pre-calculate some random connections for the "neural network" look
    const conns = [];
    for (let i = 0; i < 400; i++) {
      const idx1 = Math.floor(Math.random() * numPoints);
      let closest = -1;
      let minDist = 100;

      // Find a neighbor
      for (let j = 0; j < 25; j++) {
        const idx2 = Math.floor(Math.random() * numPoints);
        if (idx1 === idx2) continue;
        const d = Math.sqrt(
          Math.pow(p[idx1].baseX - p[idx2].baseX, 2) +
            Math.pow(p[idx1].baseY - p[idx2].baseY, 2) +
            Math.pow(p[idx1].baseZ - p[idx2].baseZ, 2)
        );
        if (d < 0.25 && d < minDist) {
          minDist = d;
          closest = idx2;
        }
      }
      if (closest !== -1) {
        conns.push([idx1, closest]);
      }
    }
    connections.current = conns;

    // Initialize Background Particles
    const bg = [];
    for (let i = 0; i < 80; i++) {
      bg.push({
        x: Math.random() * 1000, // Initial arbitrary range
        y: Math.random() * 600,
        z: Math.random() * 0.5 + 0.5, // Parallax factor
        size: Math.random() * 1.5 + 0.2,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.2 + 0.05,
      });
    }
    backgroundParticles.current = bg;
  }, []);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.015;

      // Update dimensions
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.35; // Zoom level

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // --- Render Background Particles ---
      backgroundParticles.current.forEach((p) => {
        // Update Position
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrapping logic
        const wrapWidth = width > 0 ? width : 1000;
        const wrapHeight = height > 0 ? height : 600;

        if (p.x < 0) p.x = wrapWidth;
        if (p.x > wrapWidth) p.x = 0;
        if (p.y < 0) p.y = wrapHeight;
        if (p.y > wrapHeight) p.y = 0;

        ctx.fillStyle = "#60a5fa"; // Blue-ish white
        ctx.globalAlpha = p.opacity * (0.5 + Math.sin(time + p.x) * 0.2); // Twinkle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // --- Render Brain Model ---

      // Smooth rotation interpolation
      if (isAutoRotating) {
        targetRotation.current.y += 0.003 * rotationSpeed;
      }

      // Lerp current rotation to target
      const lerp = 0.1;
      rotationRef.current.x +=
        (targetRotation.current.x - rotationRef.current.x) * lerp;
      rotationRef.current.y +=
        (targetRotation.current.y - rotationRef.current.y) * lerp;
      const curRotX = rotationRef.current.x;
      const curRotY = rotationRef.current.y;

      // 3D Projection Logic
      const project = (x, y, z) => {
        // Rotate Y
        let x1 = x * Math.cos(curRotY) - z * Math.sin(curRotY);
        let z1 = z * Math.cos(curRotY) + x * Math.sin(curRotY);

        // Rotate X
        let y2 = y * Math.cos(curRotX) - z1 * Math.sin(curRotX);
        let z2 = z1 * Math.cos(curRotX) + y * Math.sin(curRotX);

        // Perspective
        const fov = 4;
        const pScale = fov / (fov + z2);

        return {
          x: x1 * pScale * scale + cx,
          y: y2 * pScale * scale + cy,
          scale: pScale,
          z: z2, // for z-sorting
        };
      };

      const isAnyHovered = !!hoveredRegion;

      // Draw Lines (Synapses)
      ctx.lineWidth = 0.5;
      connections.current.forEach(([i1, i2]) => {
        const p1 = points.current[i1];
        const p2 = points.current[i2];

        const proj1 = project(p1.baseX, p1.baseY, p1.baseZ);
        const proj2 = project(p2.baseX, p2.baseY, p2.baseZ);

        // Distance fade
        let alpha = ((proj1.scale + proj2.scale) / 2) * 0.15;

        // Focus Dimming
        if (isAnyHovered) alpha *= 0.2;

        if (alpha > 0.01) {
          // Pulse effect
          const pulse = (Math.sin(time * 3 + p1.phase) + 1) / 2;
          ctx.strokeStyle = `rgba(96, 165, 250, ${
            alpha * (0.5 + pulse * 0.5)
          })`;
          ctx.beginPath();
          ctx.moveTo(proj1.x, proj1.y);
          ctx.lineTo(proj2.x, proj2.y);
          ctx.stroke();
        }
      });

      // Draw Points
      points.current.forEach((p) => {
        // Add subtle wave movement to points
        const wave = Math.sin(time + p.phase) * 0.02;

        const proj = project(p.baseX + wave, p.baseY + wave, p.baseZ);

        // Size attenuation
        const r = p.size * proj.scale;

        // Opacity based on depth (fog)
        let alpha = Math.max(0.1, Math.min(1, (proj.scale - 0.5) * 2));

        // Focus Dimming
        if (isAnyHovered) alpha *= 0.3;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Interactive Markers
      REGIONS.forEach((region) => {
        const proj = project(region.x, region.y, region.z);

        // Only draw if in front
        if (proj.scale > 0.6) {
          const isHovered = hoveredRegion?.id === region.id;

          // Dim others if one is selected
          if (isAnyHovered && !isHovered) {
            ctx.globalAlpha = 0.2;
          } else {
            ctx.globalAlpha = 1;
          }

          // Calculate Pulse Scale
          let currentScale = proj.scale;
          if (isHovered) {
            // Pulse roughly 20% larger
            const pulse = 1 + Math.sin(time * 6) * 0.2;
            currentScale *= pulse;
          }

          // Outer Ring
          ctx.beginPath();
          ctx.strokeStyle = isHovered ? "#fff" : "#60a5fa";
          ctx.lineWidth = isHovered ? 2 : 1;
          ctx.arc(
            proj.x,
            proj.y,
            (isHovered ? 12 : 8) * currentScale,
            0,
            Math.PI * 2
          );
          ctx.stroke();

          // Inner Dot
          ctx.beginPath();
          ctx.fillStyle = isHovered ? "#3b82f6" : "rgba(30, 64, 175, 0.5)";
          ctx.arc(
            proj.x,
            proj.y,
            (isHovered ? 5 : 3) * currentScale,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Reset alpha
          ctx.globalAlpha = 1;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [hoveredRegion, isAutoRotating, rotationSpeed]);

  // Handle Mouse Interaction
  const handleMouseMove = (e) => {
    setIsAutoRotating(false);
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Rotation logic
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    targetRotation.current = {
      y: (x - cx) * 0.005,
      x: (y - cy) * 0.005,
    };

    // Hit Testing logic
    let hit = null;
    const fov = 4;
    const scale =
      Math.min(canvasRef.current.width, canvasRef.current.height) * 0.35;
    const curRotX = rotationRef.current.x;
    const curRotY = rotationRef.current.y;

    for (const region of REGIONS) {
      // Project
      let x1 = region.x * Math.cos(curRotY) - region.z * Math.sin(curRotY);
      let z1 = region.z * Math.cos(curRotY) + region.x * Math.sin(curRotY);
      let y2 = region.y * Math.cos(curRotX) - z1 * Math.sin(curRotX);
      let z2 = z1 * Math.cos(curRotX) + region.y * Math.sin(curRotX);
      const pScale = fov / (fov + z2);
      const px = x1 * pScale * scale + cx;
      const py = y2 * pScale * scale + cy;

      const dx = x - px;
      const dy = y - py;
      // Hit radius
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        hit = region;
        break;
      }
    }
    setHoveredRegion(hit);
  };

  const handleMouseLeave = () => {
    // Don't auto-resume immediately if manual controls were used,
    // but for mouse leave we typically want to resume or stay in last state.
    // Let's resume for smoother UX unless manually paused via button.
    setIsAutoRotating(true);
    setHoveredRegion(null);
  };

  const handleManualRotate = (axis, amount) => {
    setIsAutoRotating(false);
    targetRotation.current[axis] += amount;
  };

  const handleReset = () => {
    targetRotation.current = { x: 0, y: 0 };
    rotationRef.current = { x: 0, y: 0 };
    setIsAutoRotating(true);
    setRotationSpeed(1);
  };

  return (
    <section className={`relative py-24 border-t overflow-hidden ${
      isLight
        ? "bg-[radial-gradient(circle_at_18%_0%,rgba(15,118,110,0.16),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(14,116,144,0.14),transparent_34%),linear-gradient(180deg,#dcefed_0%,#e4f2f5_52%,#dfeafb_100%)] border-teal-900/10"
        : "bg-slate-950 border-slate-900"
    }`}>
      {/* Decorative Grid & Glows - Made subtle */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-[size:40px_40px] ${isLight ? "opacity-10" : "opacity-5"}`}></div>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] ${isLight ? "bg-cyan-600/10" : "bg-blue-900/5"}`}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center space-x-2 border px-3 py-1 rounded-full mb-4 ${
            isLight ? "home-section-kicker" : "bg-blue-500/10 border-blue-500/20"
          }`}>
            <Zap size={14} className="text-blue-400" />
            <span className={`text-xs font-bold uppercase tracking-widest ${isLight ? "text-emerald-800" : "text-blue-300"}`}>
              Interactive Demo
            </span>
          </div>
          <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isLight ? "text-[#102a37]" : "text-white"}`}>
            Volumetric{" "}
            <span className={isLight ? "bg-[linear-gradient(90deg,#064e3b,#0f766e,#155e75)] bg-clip-text text-transparent" : "text-white"}>
              Digital Twin
            </span>
          </h2>
          <p className={`${isLight ? "text-[#294654]" : "text-slate-400"} max-w-2xl mx-auto leading-relaxed`}>
            Explore the generated <span className={isLight ? "home-inline-highlight" : "text-slate-300"}>3D neural map</span>. Hover over regions to inspect
            localized biomarker data derived from <span className={isLight ? "home-inline-highlight" : "text-slate-300"}>MRI analysis</span>.
          </p>
        </div>

        {/* Main Interactive Container */}
        <div className={`relative rounded-3xl border backdrop-blur-sm overflow-hidden shadow-2xl ${
          isLight
            ? "bg-[#d8eee9]/92 border-teal-900/15 shadow-[0_34px_95px_rgba(15,23,42,0.16)]"
            : "bg-slate-900/50 border-slate-800"
        }`}>
          {/* Header Bar */}
          <div className={`h-12 border-b flex items-center justify-between px-6 ${
            isLight ? "bg-[#cfe7e2] border-teal-900/10" : "bg-slate-900/80 border-slate-800"
          }`}>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
              </div>
              <span className={`text-xs font-mono ${isLight ? "text-[#315666]" : "text-slate-500"}`}>
                ID: PAT-8832-X • LIVE SESSION
              </span>
            </div>
            <div className={`flex items-center space-x-4 ${isLight ? "text-[#315666]" : "text-slate-500"}`}>
              <Share2
                size={16}
                className={`${isLight ? "hover:text-slate-950" : "hover:text-white"} cursor-pointer transition-colors`}
              />
              <Maximize2
                size={16}
                className={`${isLight ? "hover:text-slate-950" : "hover:text-white"} cursor-pointer transition-colors`}
              />
            </div>
          </div>

          {/* Canvas Area */}
          <div
            ref={containerRef}
            className={`relative h-[600px] w-full cursor-crosshair active:cursor-grabbing ${
              isLight ? "bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.16),transparent_56%),linear-gradient(180deg,#102a37_0%,#0f2430_100%)]" : ""
            }`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* Floating Overlay for Hovered Region */}
            {hoveredRegion && (
              <div className="absolute z-20 animate-pop-in bottom-8 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:top-1/4 md:right-12 md:translate-x-0 w-80 pointer-events-auto">
                <div className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-blue-500/50 hover:shadow-blue-500/20">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Header */}
                  <div className="relative flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {hoveredRegion.label}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider">
                          Region Active
                        </span>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-blue-400 shadow-inner">
                      <Target size={20} />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="relative text-sm text-slate-400 leading-relaxed mb-6 font-light">
                    {hoveredRegion.description}
                  </p>

                  {/* Stats Block */}
                  <div className="relative bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 group/tooltip hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 cursor-help w-fit">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-dotted border-slate-600 hover:text-slate-300 transition-colors">
                          {hoveredRegion.stats.label}
                        </span>
                        <Info
                          size={12}
                          className="text-slate-600 hover:text-blue-400 transition-colors"
                        />
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-[calc(100%+8px)] left-0 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-xl opacity-0 translate-y-2 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all duration-200 pointer-events-none z-30">
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {STAT_DEFINITIONS[hoveredRegion.stats.label] ||
                            "Clinical measurement used for assessment."}
                        </p>
                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45"></div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold text-white tracking-tighter">
                        {hoveredRegion.stats.value}
                      </span>
                      <div
                        className={`flex items-center px-2 py-1 rounded-md text-xs font-bold border ${
                          hoveredRegion.stats.trend === "down"
                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                            : hoveredRegion.stats.trend === "up"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        }`}
                      >
                        {hoveredRegion.stats.trend === "down" ? (
                          <TrendingDown size={14} className="mr-1" />
                        ) : hoveredRegion.stats.trend === "up" ? (
                          <TrendingUp size={14} className="mr-1" />
                        ) : (
                          <Minus size={14} className="mr-1" />
                        )}
                        {hoveredRegion.stats.trend.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HUD Elements */}
            <div className="absolute top-6 left-6 pointer-events-none space-y-2">
              <div className="flex items-center space-x-2">
                <Activity
                  size={16}
                  className="text-emerald-500 animate-pulse"
                />
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  NEURAL ACTIVITY: NORMAL
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-blue-400 font-mono">
                  MODEL RES: 0.5mm
                </span>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 pointer-events-none text-right">
              <div className={`text-[10px] font-mono mb-1 ${isLight ? "text-cyan-200/80" : "text-slate-600"}`}>
                COORDINATES
              </div>
              <div className={`text-xs font-mono ${isLight ? "text-cyan-100" : "text-slate-400"}`}>
                X: {rotationRef.current.x.toFixed(2)} Y:{" "}
                {rotationRef.current.y.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Footer Controls Bar */}
          <div className={`h-16 border-t flex flex-col md:flex-row items-center justify-between px-6 gap-4 py-2 ${
            isLight ? "bg-[#cfe7e2] border-teal-900/10" : "bg-slate-900/80 border-slate-800"
          }`}>
            {/* Legend (Left) */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-[#315666]" : "text-slate-400"}`}>
                  Gray Matter
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-300 opacity-50"></span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-[#315666]" : "text-slate-400"}`}>
                  White Matter
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full border border-blue-400"></span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-[#315666]" : "text-slate-400"}`}>
                  Roi Marker
                </span>
              </div>
            </div>

            {/* Interactive Controls (Right) */}
            <div className="flex items-center space-x-4 w-full md:w-auto justify-center">
              {/* Manual Rotate Group */}
              <div className={`flex items-center rounded-lg p-1 border ${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-950/50 border-slate-800"}`}>
                <button
                  onClick={() => handleManualRotate("x", -0.5)}
                  className={`p-1.5 rounded transition-colors ${isLight ? "text-[#315666] hover:text-teal-950 hover:bg-[#d8eee9]" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                  title="Tilt Up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => handleManualRotate("x", 0.5)}
                  className={`p-1.5 rounded transition-colors ${isLight ? "text-[#315666] hover:text-teal-950 hover:bg-[#d8eee9]" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                  title="Tilt Down"
                >
                  <ChevronDown size={16} />
                </button>
                <div className={`w-px h-4 mx-1 ${isLight ? "bg-teal-900/15" : "bg-slate-800"}`}></div>
                <button
                  onClick={() => handleManualRotate("y", -0.5)}
                  className={`p-1.5 rounded transition-colors ${isLight ? "text-[#315666] hover:text-teal-950 hover:bg-[#d8eee9]" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                  title="Rotate Left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => handleManualRotate("y", 0.5)}
                  className={`p-1.5 rounded transition-colors ${isLight ? "text-[#315666] hover:text-teal-950 hover:bg-[#d8eee9]" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                  title="Rotate Right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Speed Control */}
              <div className={`hidden sm:flex items-center space-x-2 rounded-lg px-3 py-1.5 border ${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-950/50 border-slate-800"}`}>
                <Settings2 size={12} className={isLight ? "text-[#315666]" : "text-slate-500"} />
                <span className={`text-[10px] font-bold uppercase ${isLight ? "text-[#315666]" : "text-slate-500"}`}>
                  Speed
                </span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-125"
                />
              </div>

              {/* Play/Reset Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                    isAutoRotating
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                      : isLight
                      ? "bg-[#eaf7f4] border-teal-900/10 text-[#315666] hover:bg-[#d8eee9] hover:text-teal-950"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                  title={isAutoRotating ? "Pause Rotation" : "Auto Rotate"}
                >
                  {isAutoRotating ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                    isLight
                      ? "bg-[#eaf7f4] border-teal-900/10 text-[#315666] hover:bg-[#d8eee9] hover:text-teal-950"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                  title="Reset View"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
