import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { FEATURES } from "../constants";
import { useTheme } from "./ThemeContext";

export const Features = () => {
  const { isLight } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className={`py-32 relative overflow-hidden ${
        isLight
          ? "bg-gradient-to-b from-[#f4f8f6] via-[#fcfdfc] to-[#eef5f2]"
          : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      }`}
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full blur-[120px] opacity-70 ${
            isLight
              ? "bg-gradient-to-br from-emerald-100/80 to-cyan-100/50"
              : "bg-gradient-to-br from-blue-900/25 to-indigo-900/20"
          }`}
        ></div>
        <div
          className={`absolute top-1/2 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-60 ${
            isLight
              ? "bg-gradient-to-tr from-teal-100/60 to-sky-100/30"
              : "bg-gradient-to-tr from-purple-900/20 to-pink-900/15"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[80px] opacity-50 ${
            isLight
              ? "bg-gradient-to-t from-cyan-100/50 to-transparent"
              : "bg-gradient-to-t from-cyan-900/20 to-transparent"
          }`}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={`text-center max-w-4xl mx-auto mb-20 transition-all duration-1000 ease-out transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-8 shadow-sm border ${
              isLight
                ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200/70"
                : "bg-slate-900/70 border-slate-700"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isLight ? "text-emerald-700" : "text-cyan-400"}`} />
            <span
              className={`text-sm font-semibold tracking-wide ${
                isLight ? "text-emerald-800" : "text-cyan-300"
              }`}
            >
              Core Capabilities
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            <span className={isLight ? "text-slate-950" : "text-white"}>
              A Unified Platform for
            </span>
            <br />
            <span className="relative inline-block mt-2">
              <span
                className={`bg-clip-text text-transparent ${
                  isLight
                    ? "bg-gradient-to-r from-slate-900 via-emerald-800 to-cyan-700"
                    : "bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300"
                }`}
              >
                Precision Healthcare
              </span>
            </span>
          </h2>

          <p
            className={`text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto ${
              isLight ? "text-slate-600" : "text-slate-400"
            }`}
          >
            AlzTwin integrates advanced neuroimaging with daily living metrics
            to provide a{" "}
            <span className={isLight ? "text-slate-900 font-semibold" : "text-white font-semibold"}>
              holistic view
            </span>{" "}
            of patient health.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={`group relative rounded-3xl p-8 transition-all duration-500 ease-out hover:-translate-y-3 ${
                  isLight
                    ? "bg-white/88 shadow-[0_12px_45px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_60px_rgba(15,118,110,0.12)] border border-slate-200/70 hover:border-emerald-300/70"
                    : "bg-slate-900/75 shadow-[0_18px_55px_rgba(0,0,0,0.35)] hover:shadow-[0_24px_70px_rgba(34,211,238,0.08)] border border-slate-800 hover:border-cyan-500/30"
                } ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl ${
                    isLight
                      ? "bg-gradient-to-br from-emerald-50/60 via-transparent to-cyan-50/40"
                      : "bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/10"
                  }`}
                ></div>

                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:scale-110 group-hover:-rotate-3 ${
                      isLight
                        ? "bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-emerald-700 group-hover:to-cyan-700 group-hover:shadow-emerald-500/20"
                        : "bg-gradient-to-br from-slate-800 to-slate-700 group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:shadow-cyan-500/20"
                    }`}
                  >
                    <IconComponent
                      className={`transition-colors duration-500 ${
                        isLight ? "text-slate-700 group-hover:text-white" : "text-slate-300 group-hover:text-white"
                      }`}
                      size={28}
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3
                    className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                      isLight ? "text-slate-950 group-hover:text-emerald-800" : "text-white group-hover:text-cyan-300"
                    }`}
                  >
                    {feature.title}
                  </h3>

                  <p
                    className={`leading-relaxed transition-colors duration-300 ${
                      isLight ? "text-slate-600 group-hover:text-slate-700" : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  >
                    {feature.description}
                  </p>

                  <div
                    className={`mt-6 flex items-center font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 ${
                      isLight ? "text-emerald-800" : "text-cyan-300"
                    }`}
                  >
                    <span>Explore feature</span>
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
