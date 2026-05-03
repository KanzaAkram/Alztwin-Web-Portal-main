import React from "react";
import { Brain, Twitter, Linkedin, Github } from "lucide-react";
import { useTheme } from "./ThemeContext";

export const Footer = () => {
  const { isLight } = useTheme();

  return (
    <footer className={`border-t pt-16 pb-8 ${isLight ? "bg-[linear-gradient(180deg,#dfeafb_0%,#dcefed_100%)] border-teal-900/10" : "bg-midnight-900 border-slate-800"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className={`p-1.5 rounded-lg text-white ${isLight ? "bg-[linear-gradient(135deg,#0f766e,#115e59)]" : "bg-brand-600"}`}>
                <Brain size={20} />
              </div>
              <span className={`text-xl font-bold ${isLight ? "text-[#102a37]" : "text-white"}`}>AlzTwin</span>
            </div>
            <p className={`text-sm leading-relaxed ${isLight ? "text-[#365565]" : "text-slate-500"}`}>
              Extending independence and dignity through Digital Twin technology. A proactive approach to Alzheimer's care.
            </p>
          </div>

          {[
            { title: "Platform", items: ["Clinician Portal","Caregiver App","Integration API","Security"] },
            { title: "Resources", items: ["Clinical Trials","Research Papers","Documentation","Support"] },
          ].map(({ title, items }) => (
            <div key={title}>
              <h4 className={`font-semibold mb-4 ${isLight ? "text-[#102a37]" : "text-white"}`}>{title}</h4>
              <ul className={`space-y-2 text-sm ${isLight ? "text-[#365565]" : "text-slate-500"}`}>
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className={`transition-colors ${isLight ? "hover:text-emerald-800" : "hover:text-brand-400"}`}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className={`font-semibold mb-4 ${isLight ? "text-[#102a37]" : "text-white"}`}>Contact</h4>
            <ul className={`space-y-2 text-sm ${isLight ? "text-[#365565]" : "text-slate-500"}`}>
              <li>contact@alztwin.med</li>
              <li className="flex space-x-4 mt-4">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <a key={i} href="#" className={`transition-colors ${isLight ? "text-[#517080] hover:text-emerald-800" : "text-slate-500 hover:text-white"}`}>
                    <Icon size={20} />
                  </a>
                ))}
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm ${
          isLight ? "border-teal-900/10 text-[#365565]" : "border-slate-800 text-slate-600"
        }`}>
          <p>&copy; {new Date().getFullYear()} AlzTwin. Version 1.1. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {["Privacy Policy","Terms of Service"].map((item) => (
              <a key={item} href="#" className={`transition-colors ${isLight ? "hover:text-[#102a37]" : "hover:text-slate-300"}`}>{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
