"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { RxChevronRight } from "react-icons/rx";

export function Layout1() {
  return (
    <section className="px-[5%] py-16 md:py-24 lg:py-28 bg-scheme-background transition-theme">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 w-full max-w-2xl text-center md:mb-18 lg:mb-20"
        >
          <p className="mb-3 font-semibold text-biosphere-500 md:mb-4">Features</p>
          <h1 className="heading-h2 mb-5 font-bold md:mb-6">
            Powerful Research Tools
          </h1>
          <p className="text-medium">
            Transform how you explore and understand space biology research
          </p>
        </motion.div>
        <div className="grid auto-cols-fr grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="flex flex-col h-full">
              <div className="flex w-full flex-col items-center justify-center self-start bg-gradient-to-br from-biosphere-500/10 to-biosphere-600/5 p-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-biosphere-500/20 text-biosphere-500">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                <div>
                  <p className="mb-2 font-semibold text-biosphere-500">Search</p>
                  <h2 className="heading-h4 mb-3 font-bold md:mb-4">
                    AI-Driven Discovery
                  </h2>
                  <p className="text-scheme-muted">
                    Natural language queries that unlock complex scientific
                    insights
                  </p>
                </div>
                <div className="mt-5 md:mt-6">
                  <Button
                    title="Explore"
                    variant="link"
                    size="link"
                    iconRight={<RxChevronRight className="transition-transform group-hover:translate-x-1" />}
                  >
                    Explore
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="flex flex-col h-full">
              <div className="flex w-full flex-col items-center justify-center self-start bg-gradient-to-br from-cosmic-500/10 to-cosmic-600/5 p-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-cosmic-500/20 text-cosmic-500">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                <div>
                  <p className="mb-2 font-semibold text-cosmic-500">Graph</p>
                  <h2 className="heading-h4 mb-3 font-bold md:mb-4">
                    Knowledge Visualization
                  </h2>
                  <p className="text-scheme-muted">
                    Explore connections between studies and experimental
                    conditions
                  </p>
                </div>
                <div className="mt-5 md:mt-6">
                  <Button
                    title="Discover"
                    variant="link"
                    size="link"
                    iconRight={<RxChevronRight className="transition-transform group-hover:translate-x-1" />}
                  >
                    Discover
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="flex flex-col h-full">
              <div className="flex w-full flex-col items-center justify-center self-start bg-gradient-to-br from-biosphere-500/10 via-cosmic-500/10 to-biosphere-500/5 p-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-biosphere-500/20 to-cosmic-500/20 text-biosphere-500">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6v10h4a1 1 0 110 2H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 110-2h3V6h-3a1 1 0 01-1-1z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                <div>
                  <p className="mb-2 font-semibold text-cosmic-400">Design</p>
                  <h2 className="heading-h4 mb-3 font-bold md:mb-4">
                    Intuitive Interface
                  </h2>
                  <p className="text-scheme-muted">
                    Professional design that makes complex research feel simple
                    and engaging
                  </p>
                </div>
                <div className="mt-5 md:mt-6">
                  <Button
                    title="Learn"
                    variant="link"
                    size="link"
                    iconRight={<RxChevronRight className="transition-transform group-hover:translate-x-1" />}
                  >
                    Learn
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
