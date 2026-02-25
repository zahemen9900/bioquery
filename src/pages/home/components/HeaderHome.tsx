"use client";

import Particles from "@/components/Particles";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { useRef } from "react";

export function HeaderHome() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden bg-slate-50 dark:bg-space-900 pt-32 pb-16 transition-colors duration-500">
      {/* Noise Texture */}
      <div className="absolute inset-0 z-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>

      {/* Background Orbs */}
      <motion.div style={{ y: y1 }} className="absolute top-1/4 left-[10%] h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-biosphere-500/10 blur-[120px] mix-blend-screen pointer-events-none" />
      <motion.div style={{ y: y2 }} className="absolute bottom-10 right-[10%] h-[35rem] w-[35rem] translate-x-1/3 translate-y-1/3 rounded-full bg-accent-purple/10 blur-[130px] mix-blend-screen pointer-events-none" />

      {/* Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden mix-blend-screen opacity-60 dark:opacity-60 hidden dark:block">
        <Particles
          particleColors={["#ffffff", "#00e7b3", "#8b5cf6"]}
          particleCount={2500}
          particleSpread={12}
          speed={0.15}
          particleBaseSize={60}
          moveParticlesOnHover={true}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>

      <motion.div style={{ opacity }} className="container relative z-10 px-[5%]">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="mx-auto mb-8 flex max-w-fit items-center gap-3 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl px-5 py-2 text-sm font-medium text-slate-800 dark:text-space-100 shadow-sm dark:shadow-glass-sm transition-colors duration-500"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-biosphere-500 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-biosphere-500 drop-shadow-[0_0_5px_rgba(0,231,179,0.8)]"></span>
              </span>
              <span className="tracking-wide">Exploring Life Beyond Earth</span>
            </motion.div>

            <h1 className="font-display mb-8 text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl lg:text-[5.5rem] leading-[1.05] transition-colors duration-500">
              Discover Space Biology
              <br />
              <span className="text-biosphere-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-biosphere-500 dark:to-accent-purple italic pr-2">Like Never Before</span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-600 dark:text-space-200 sm:text-xl leading-relaxed transition-colors duration-500">
              BioQuery transforms decades of NASA research into actionable
              insights. Explore complex biological experiments with simple,
              powerful tools.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center gap-5 sm:flex-row"
            >
              <Link to="/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[180px] h-14 rounded-full bg-biosphere-500 text-white dark:text-space-900 hover:bg-biosphere-600 dark:hover:bg-biosphere-400 font-bold text-lg shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal border border-biosphere-500/50 dark:border-biosphere-400/50 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                >
                  Get Started
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-w-[180px] h-14 rounded-full border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-900 dark:text-white backdrop-blur-xl hover:bg-slate-100/50 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 font-medium text-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-sm dark:shadow-glass"
              >
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="mt-20 grid grid-cols-3 gap-6 divide-x divide-black/10 dark:divide-white/10 border-y border-black/10 dark:border-white/10 py-10 lg:mx-20 bg-gradient-to-r from-transparent via-slate-200/50 dark:via-white/5 to-transparent transition-colors duration-500"
            >
              {[
                { label: "Experiments", value: "10K+" },
                { label: "Missions", value: "50+" },
                { label: "Of Research", value: "30yrs" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="font-display text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl lg:text-6xl drop-shadow-sm dark:drop-shadow-md transition-colors duration-500">
                    {stat.value}
                  </span>
                  <span className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-space-200 transition-colors duration-500">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard Preview - Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 120, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: "1500px" }}
          className="relative mx-auto mt-24 max-w-6xl"
        >
          <div className="group relative rounded-3xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-space-800/40 p-2 sm:p-4 shadow-xl dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 bg-glass-gradient rounded-3xl pointer-events-none opacity-10 dark:opacity-50 transition-opacity duration-500" />
            <div className="absolute -inset-1 bg-gradient-to-b from-black/5 dark:from-white/10 to-transparent rounded-[2rem] blur-sm pointer-events-none opacity-30 transition-opacity duration-500" />
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 bg-slate-100 dark:bg-space-900 shadow-inner transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-200/80 dark:from-space-900/80 via-transparent to-transparent z-10 pointer-events-none transition-colors duration-500" />
              <img
                src="/hero-image.png"
                alt="BioQuery Interface"
                className="w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
