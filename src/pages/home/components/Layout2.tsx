"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { RxChevronRight } from "react-icons/rx";

export function Layout2() {
  const tabs = [
    { value: "tab-one", label: "Summarize" },
    { value: "tab-two", label: "Visualize" },
    { value: "tab-three", label: "Connect" },
  ];

  return (
    <section className="relative bg-slate-50 dark:bg-space-900 px-[5%] py-24 md:py-32 overflow-hidden border-t border-black/5 dark:border-white/5 transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-biosphere-500/5 blur-[200px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

      <div className="container relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 md:mb-24 lg:mb-28"
        >
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-space-100 font-bold text-xs tracking-[0.2em] uppercase mb-6 shadow-sm dark:shadow-glass-sm backdrop-blur-md transition-colors duration-500">
              How It Works
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight transition-colors duration-500">
              Unlock Space Biology Insights
            </h1>
            <p className="text-xl text-slate-600 dark:text-space-200 leading-relaxed max-w-2xl mx-auto transition-colors duration-500">
              Transform complex research into clear, actionable knowledge. Our
              platform bridges the gap between raw data and meaningful
              understanding.
            </p>
          </div>
        </motion.div>

        <Tabs defaultValue="tab-one" className="flex flex-col items-center w-full">
          <TabsList className="relative mb-16 inline-flex h-14 items-center justify-center rounded-full bg-white/80 dark:bg-space-800/80 p-1.5 border border-black/10 dark:border-white/10 shadow-sm dark:shadow-glass-sm backdrop-blur-xl md:mb-20 transition-colors duration-500">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full px-8 py-2.5 text-sm font-bold tracking-wide transition-all duration-300 data-[state=active]:bg-biosphere-500 data-[state=active]:text-white dark:data-[state=active]:text-space-900 data-[state=active]:shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:data-[state=active]:shadow-neon-teal data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-space-200 hover:text-slate-900 dark:hover:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {[
            {
              value: "tab-one",
              category: "AI Intelligence",
              title: "Research Summarization",
              desc: "Generate concise summaries of complex experiments with our advanced AI technology. Cut through the noise and find key insights in seconds.",
              categoryClass: "text-biosphere-600 dark:text-biosphere-500",
              btnColor: "#00e7b3",
              btnTextColor: "#0f172a",
              glowClass: "bg-biosphere-500/10 dark:bg-biosphere-500/5",
              imageSrc: "/ai_summary_preview.png",
              previewText: "AI Summary Engine",
              btnLabel: "Try It Out",
            },
            {
              value: "tab-two",
              category: "Data Insights",
              title: "Interactive Visualization",
              desc: "Explore data through beautiful, interactive charts and graphs. Discover patterns and relationships that matter most to your research.",
              categoryClass: "text-purple-600 dark:text-accent-purple",
              btnColor: "#8b5cf6",
              btnTextColor: "#ffffff",
              glowClass: "bg-accent-purple/10 dark:bg-accent-purple/5",
              imageSrc: "/chart_visualization.png",
              previewText: "Data Visualization",
              btnLabel: "Explore Data",
            },
            {
              value: "tab-three",
              category: "Knowledge Network",
              title: "Research Connections",
              desc: "Discover hidden connections between studies, experiments, and findings. Navigate the web of space biology research with ease.",
              categoryClass: "text-blue-600 dark:text-accent-blue",
              btnColor: "#3b82f6",
              btnTextColor: "#ffffff",
              glowClass: "bg-accent-blue/10 dark:bg-accent-blue/5",
              imageSrc: "/knowledge_graph.png",
              previewText: "Entity Graph Matrix",
              btnLabel: "Explore Graph",
            },
          ].map((content) => (
            <TabsContent
              key={content.value}
              value={content.value}
              className="w-full max-w-6xl data-[state=inactive]:hidden outline-none"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative rounded-[2.5rem] bg-white/40 dark:bg-space-800/30 border border-black/5 dark:border-white/10 p-2 overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-colors duration-500"
              >
                <div className="absolute inset-0 bg-glass-gradient pointer-events-none opacity-10 dark:opacity-30" />
                <div className="grid grid-cols-1 lg:grid-cols-2 rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-space-900 border border-black/5 dark:border-white/5 transition-colors duration-500">
                  <div className="flex flex-col justify-center p-10 md:p-16 lg:p-20 z-10">
                    <p className={`mb-4 font-bold text-xs tracking-[0.2em] uppercase ${content.categoryClass}`}>
                      {content.category}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight transition-colors duration-500">
                      {content.title}
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-space-200 mb-10 leading-relaxed transition-colors duration-500">
                      {content.desc}
                    </p>
                    <div className="flex flex-row items-center gap-4">
                      <button
                        style={{ backgroundColor: content.btnColor, color: content.btnTextColor }}
                        className="rounded-full border-none font-bold px-8 h-12 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:opacity-90 shadow-sm"
                      >
                        {content.btnLabel}
                      </button>
                      <span className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-white hover:opacity-70 transition-opacity duration-200 whitespace-nowrap">
                        Learn More
                        <RxChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                  <div className={`relative flex items-center justify-center min-h-[400px] lg:min-h-full bg-slate-100/50 dark:bg-space-800/20 border-l border-black/5 dark:border-white/5 overflow-hidden transition-colors duration-500`}>
                    <div className={`absolute inset-0 blur-3xl ${content.glowClass}`} />
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 md:p-12 group">
                      <div className="relative w-full max-w-md aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-black/5 dark:border-white/10 group-hover:border-black/10 dark:group-hover:border-white/20 transition-all duration-700 transform group-hover:scale-[1.02] group-hover:-translate-y-1">
                        <img src={content.imageSrc} alt={content.previewText} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-space-950/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                          <span className="text-white font-medium tracking-wide drop-shadow-md">{content.previewText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
