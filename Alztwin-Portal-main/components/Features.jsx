import React, { useEffect, useRef, useState } from "react";
import { FEATURES } from "../constants";

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
      className="py-32 bg-slate-50 relative overflow-hidden"
      ref={sectionRef}
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
        <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={`text-center max-w-3xl mx-auto mb-24 transition-all duration-1000 ease-out transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <h2 className="text-sm font-bold text-brand-600 tracking-widest uppercase mb-4">
            Core Capabilities
          </h2>
          <p className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            A Unified Platform for <br className="hidden md:block" /> Precision
            Healthcare
          </p>
          <p className="text-xl text-slate-500 leading-relaxed">
            AlzTwin integrates advanced neuroimaging with daily living metrics
            to provide a holistic view of patient health.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={`group relative bg-white rounded-2xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.1)] transition-all duration-700 ease-out border border-slate-100 hover:border-brand-200 hover:-translate-y-2 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-16"
                }`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 group-hover:bg-brand-600 flex items-center justify-center mb-6 transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-brand-500/30 group-hover:rotate-3">
                    <IconComponent
                      className="text-brand-600 group-hover:text-white transition-colors duration-500"
                      size={32}
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-700 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center text-brand-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Learn more</span>
                    <svg
                      className="w-4 h-4 ml-1"
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
