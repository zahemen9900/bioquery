"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export function HeaderHome() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient background effect */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-biosphere-500/20 blur-3xl dark:bg-biosphere-500/10" />
        <div className="absolute top-1/4 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-cosmic-500/20 blur-3xl dark:bg-cosmic-500/10" />
      </div>
      
      <div className="px-[5%] py-20 md:py-28 lg:py-36">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex w-full flex-col items-center text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-scheme-border bg-scheme-surface px-4 py-2 text-sm font-medium text-scheme-muted transition-theme"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-biosphere-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-biosphere-500"></span>
              </span>
              Exploring Life Beyond Earth
            </motion.div>

            <h1 className="heading-h1 mb-6 font-bold md:mb-8">
              Discover Space Biology
              <br />
              <span className="gradient-text">Like Never Before</span>
            </h1>
            
            <p className="text-medium max-w-2xl">
              BioQuery transforms decades of NASA research into actionable
              insights. Explore complex biological experiments with simple,
              powerful tools.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 md:mt-10"
            >
              <Link to="/auth" className="inline-flex">
                <Button title="Launch" size="lg" className="min-w-40">
                  Get Started
                </Button>
              </Link>
              <Button title="Learn" variant="secondary" size="lg" className="min-w-40">
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-16 grid grid-cols-3 gap-8 md:gap-12"
            >
              <div>
                <div className="text-3xl md:text-4xl font-bold text-scheme-text">10K+</div>
                <div className="text-sm text-scheme-subtle mt-1">Experiments</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-scheme-text">50+</div>
                <div className="text-sm text-scheme-subtle mt-1">Missions</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-scheme-text">30yrs</div>
                <div className="text-sm text-scheme-subtle mt-1">Of Research</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Hero Image/Placeholder - You'll add a Lottie animation here */}
      <div className="px-[5%] pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="container max-w-6xl"
        >
          <div className="relative rounded-2xl border border-scheme-border bg-scheme-surface overflow-hidden shadow-2xl transition-theme">
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-space-900 to-space-800 dark:from-space-950 dark:to-space-900">
              <p className="text-scheme-subtle text-lg">
                [ Hero Animation / Screenshot Placeholder ]
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
