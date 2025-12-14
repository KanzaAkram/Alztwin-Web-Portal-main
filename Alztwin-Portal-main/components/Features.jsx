import React, { useEffect, useRef, useState } from "react";
import { FEATURES } from "../constants";
import { Sparkles } from "lucide-react";

export const Features = () => {
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section
      id="features"
      className="py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden"
      ref={sectionRef}
    >
      {/* Enhanced Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-gradient-to-br from-blue-100/60 to-indigo-100/40 rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/50 to-pink-100/30 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-t from-cyan-100/40 to-transparent rounded-full blur-[80px] opacity-50"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Enhanced Header Section */}
        <div
          className={`text-center max-w-4xl mx-auto mb-20 transition-all duration-1000 ease-out transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 px-4 py-2 rounded-full mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-600 tracking-wide">
              Core Capabilities
            </span>
          </div>

          {/* Main Title - Enhanced */}
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            <span className="text-slate-900">A Unified Platform for</span>
            <br />
            <span className="relative inline-block mt-2">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Precision Healthcare
              </span>
              {/* Decorative underline */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 300 8"
                fill="none"
              >
                <path
                  d="M1 5.5C71 2 143 1.5 299 5.5"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                    <stop stopColor="#3b82f6" />
                    <stop offset="0.5" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-500 leading-relaxed max-w-3xl mx-auto">
            AlzTwin integrates advanced neuroimaging with daily living metrics
            to provide a{" "}
            <span className="text-slate-700 font-medium">holistic view</span> of
            patient health.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={`group relative bg-white rounded-3xl p-8 shadow-[0_4px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(37,99,235,0.12)] transition-all duration-500 ease-out border border-slate-100/80 hover:border-blue-200/60 hover:-translate-y-3 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-16"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>

                {/* Glow effect on hover */}
                <div className="absolute -inset-px bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:via-indigo-500/10 group-hover:to-purple-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <div className="relative z-10">
                  {/* Icon Container - Enhanced */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-500 group-hover:to-indigo-600 flex items-center justify-center mb-6 transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-blue-500/25 group-hover:scale-110 group-hover:-rotate-3">
                    <IconComponent
                      className="text-slate-600 group-hover:text-white transition-colors duration-500"
                      size={28}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Learn more link */}
                  <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
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
