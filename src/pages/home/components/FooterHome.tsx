"use client";

import {
  BiLogoLinkedinSquare,
  BiLogoYoutube,
} from "react-icons/bi";
import { FaXTwitter, FaGithub } from "react-icons/fa6";
import BioQueryLogo from "/BioQueryLogo.png";

export function FooterHome() {
  return (
    <footer className="relative bg-slate-50 dark:bg-space-900 overflow-hidden pt-24 pb-8 border-t border-black/5 dark:border-white/10 transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-biosphere-500/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      <div className="container relative z-10 max-w-7xl mx-auto px-[5%]">

        {/* Massive Closing Statement */}
        <div className="mb-24 text-center">
          <h2 className="font-display text-5xl md:text-7xl lg:text-9xl font-bold text-slate-900 dark:text-white tracking-tighter opacity-90 drop-shadow-lg dark:drop-shadow-2xl transition-colors duration-500">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-biosphere-500 to-accent-purple">Beyond.</span>
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row justify-between gap-16 pb-16 border-b border-black/10 dark:border-white/10 transition-colors duration-500">
          {/* Brand Section */}
          <div className="max-w-md">
            <div className="mb-8">
              <a href="#" className="inline-block transition-transform duration-300 hover:scale-105">
                <img
                  src={BioQueryLogo}
                  alt="BioQuery Logo"
                  className="h-10 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-500"
                />
              </a>
            </div>
            <p className="text-slate-600 dark:text-space-200 text-lg mb-8 leading-relaxed transition-colors duration-500">
              Transforming decades of space biology data into actionable insights for the next generation of explorers.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white hover:bg-biosphere-500 dark:hover:bg-biosphere-500 hover:text-white dark:hover:text-space-900 hover:border-biosphere-500 hover:shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:hover:shadow-neon-teal transition-all duration-300" aria-label="Twitter">
                <FaXTwitter className="size-4" />
              </a>
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white hover:bg-biosphere-500 dark:hover:bg-biosphere-500 hover:text-white dark:hover:text-space-900 hover:border-biosphere-500 hover:shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:hover:shadow-neon-teal transition-all duration-300" aria-label="LinkedIn">
                <BiLogoLinkedinSquare className="size-5" />
              </a>
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white hover:bg-biosphere-500 dark:hover:bg-biosphere-500 hover:text-white dark:hover:text-space-900 hover:border-biosphere-500 hover:shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:hover:shadow-neon-teal transition-all duration-300" aria-label="GitHub">
                <FaGithub className="size-5" />
              </a>
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white hover:bg-biosphere-500 dark:hover:bg-biosphere-500 hover:text-white dark:hover:text-space-900 hover:border-biosphere-500 hover:shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:hover:shadow-neon-teal transition-all duration-300" aria-label="YouTube">
                <BiLogoYoutube className="size-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-16 w-full lg:w-auto">
            <div>
              <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-6 text-slate-900 dark:text-white transition-colors duration-500">Product</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    API Access
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-6 text-slate-900 dark:text-white transition-colors duration-500">Company</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-6 text-slate-900 dark:text-white transition-colors duration-500">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 dark:text-space-200 hover:text-biosphere-600 dark:hover:text-biosphere-500 font-medium transition-colors duration-300">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-500 dark:text-space-400 transition-colors duration-500">
            © 2026 BioQuery. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-slate-500 dark:text-space-400 font-medium transition-colors duration-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-biosphere-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-biosphere-500"></span>
              </span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
