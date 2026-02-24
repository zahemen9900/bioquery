"use client";

import { motion } from "motion/react";
import { RxChevronRight } from "react-icons/rx";

export function Layout1() {
  return (
    <section className="relative px-[5%] py-24 md:py-32 bg-slate-50 dark:bg-space-900 overflow-hidden transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-biosphere-500/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-purple/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

      <div className="container relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto mb-16 w-full max-w-3xl text-center md:mb-24"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-biosphere-500/10 border border-biosphere-500/20 text-biosphere-600 dark:text-biosphere-400 font-bold text-xs tracking-[0.2em] uppercase mb-6 shadow-sm dark:shadow-glass-sm">
            Core Capabilities
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight transition-colors duration-500">
            Powerful Research Tools
          </h1>
          <p className="text-xl text-slate-600 dark:text-space-200 leading-relaxed max-w-2xl mx-auto transition-colors duration-500">
            Transform how you explore space biology with AI-native workflows designed for high-density multidimensional data.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              title: "AI-Driven Discovery",
              category: "Search",
              desc: "Natural language queries that unlock complex scientific insights across decades of mission data.",
              colorVar: "rgba(0, 231, 179, 0.4)",
              icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
              textClass: "text-biosphere-600 dark:text-biosphere-400",
              iconClass: "text-biosphere-600 dark:text-biosphere-400",
            },
            {
              title: "Knowledge Visualization",
              category: "Graph",
              desc: "Explore multi-dimensional connections between studies, organisms, and experimental conditions.",
              colorVar: "rgba(139, 92, 246, 0.4)",
              icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
              textClass: "text-purple-600 dark:text-accent-purple",
              iconClass: "text-purple-600 dark:text-accent-purple",
            },
            {
              title: "Intuitive Interface",
              category: "Design",
              desc: "Professional design that makes complex genomic research feel simple, tactile, and highly engaging.",
              colorVar: "rgba(59, 130, 246, 0.4)",
              icon: "M4 5a1 1 0 011-1h4a1 1 0 010 2H6v10h4a1 1 0 110 2H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 110-2h3V6h-3a1 1 0 01-1-1z",
              textClass: "text-blue-600 dark:text-accent-blue",
              iconClass: "text-blue-600 dark:text-accent-blue",
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: idx * 0.15, ease: "easeOut" }}
              className="group h-full"
            >
              <div
                className="relative flex flex-col h-full rounded-[2rem] bg-white/60 dark:bg-space-800/40 border border-black/5 dark:border-white/10 p-2 transition-all duration-500 hover:bg-white/80 hover:dark:bg-space-800/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-glass-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative flex items-center justify-center p-10 rounded-[1.5rem] bg-slate-100/50 dark:bg-space-900/60 border border-black/5 dark:border-white/5 mb-3 overflow-hidden group-hover:border-black/10 dark:group-hover:border-white/10 transition-colors duration-500">
                  <div
                    className="absolute inset-0 opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                    style={{ backgroundColor: feature.colorVar }}
                  />
                  <div className={`relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 ${feature.iconClass} shadow-sm dark:shadow-glass backdrop-blur-md group-hover:scale-110 transition-transform duration-500`}>
                    <svg className="h-12 w-12 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 pb-8 pt-4 z-10">
                  <p className={`mb-3 font-bold text-xs tracking-[0.15em] uppercase ${feature.textClass}`}>
                    {feature.category}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight transition-colors duration-500">
                    {feature.title}
                  </h2>
                  <p className="text-slate-600 dark:text-space-200 leading-relaxed mb-8 flex-1 transition-colors duration-500">
                    {feature.desc}
                  </p>
                  <div className="mt-auto">
                    <span className={`group/btn inline-flex items-center gap-1.5 cursor-pointer font-semibold ${feature.textClass} hover:opacity-80 transition-opacity duration-300`}>
                      Explore Feature
                      <RxChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
