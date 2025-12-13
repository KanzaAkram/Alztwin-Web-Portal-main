import React from "react";
import { Brain, Twitter, Linkedin, Github } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-midnight-900 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                <Brain size={20} />
              </div>
              <span className="text-xl font-bold text-white">AlzTwin</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Extending independence and dignity through Digital Twin
              technology. A proactive approach to Alzheimer's care.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Clinician Portal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Caregiver App
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Integration API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Clinical Trials
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Research Papers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-400 transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Department of Software Engineering</li>
              <li>contact@alztwin.med</li>
              <li className="flex space-x-4 mt-4">
                <a
                  href="#"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="#"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="#"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Github size={20} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
          <p>
            &copy; {new Date().getFullYear()} AlzTwin. Version 1.1. All rights
            reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
