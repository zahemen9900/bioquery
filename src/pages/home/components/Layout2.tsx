"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { RxChevronRight } from "react-icons/rx";

export function Layout2() {
  return (
    <section className="bg-scheme-surface px-[5%] py-16 md:py-24 lg:py-28 transition-theme">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 md:mb-18 lg:mb-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 font-semibold text-biosphere-500 md:mb-4">How It Works</p>
            <h1 className="heading-h2 mb-5 font-bold md:mb-6">
              Unlock Space Biology Insights
            </h1>
            <p className="text-medium">
              Transform complex research into clear, actionable knowledge. Our
              platform bridges the gap between raw data and meaningful
              understanding.
            </p>
          </div>
        </motion.div>
        
        <Tabs defaultValue="tab-one" className="flex flex-col items-center">
          <TabsList className="relative mb-12 inline-flex h-12 items-center justify-center rounded-lg bg-scheme-background p-1 border border-scheme-border shadow-sm md:mb-16">
            <TabsTrigger
              value="tab-one"
              className="rounded-md px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-biosphere-500 data-[state=active]:text-space-900 data-[state=active]:shadow-sm data-[state=inactive]:text-scheme-muted hover:text-scheme-text"
            >
              Summarize
            </TabsTrigger>
            <TabsTrigger
              value="tab-two"
              className="rounded-md px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-biosphere-500 data-[state=active]:text-space-900 data-[state=active]:shadow-sm data-[state=inactive]:text-scheme-muted hover:text-scheme-text"
            >
              Visualize
            </TabsTrigger>
            <TabsTrigger
              value="tab-three"
              className="rounded-md px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-biosphere-500 data-[state=active]:text-space-900 data-[state=active]:shadow-sm data-[state=inactive]:text-scheme-muted hover:text-scheme-text"
            >
              Connect
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="tab-one"
            className="data-[state=active]:animate-tabs w-full max-w-5xl"
          >
            <Card className="grid grid-cols-1 md:grid-cols-2 md:items-center overflow-hidden">
              <div className="p-8 md:p-10 lg:p-12">
                <p className="mb-3 font-semibold text-biosphere-500 md:mb-4">AI Intelligence</p>
                <h2 className="heading-h3 mb-5 font-bold md:mb-6">
                  Research Summarization
                </h2>
                <p className="text-scheme-muted mb-6">
                  Generate concise summaries of complex experiments with our
                  advanced AI technology. Cut through the noise and find key
                  insights in seconds.
                </p>
                <div className="flex items-center gap-x-4">
                  <Button title="Try It Out" variant="default">
                    Try It Out
                  </Button>
                  <Button
                    title="Learn More"
                    variant="ghost"
                    size="sm"
                    iconRight={<RxChevronRight className="transition-transform group-hover:translate-x-1" />}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-biosphere-500/20 to-cosmic-500/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-scheme-subtle">AI Summary Preview</p>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent
            value="tab-two"
            className="data-[state=active]:animate-tabs w-full max-w-5xl"
          >
            <Card className="grid grid-cols-1 md:grid-cols-2 md:items-center overflow-hidden">
              <div className="p-8 md:p-10 lg:p-12">
                <p className="mb-3 font-semibold text-cosmic-500 md:mb-4">Data Insights</p>
                <h2 className="heading-h3 mb-5 font-bold md:mb-6">
                  Interactive Visualization
                </h2>
                <p className="text-scheme-muted mb-6">
                  Explore data through beautiful, interactive charts and graphs.
                  Discover patterns and relationships that matter most to your research.
                </p>
                <div className="flex items-center gap-x-4">
                  <Button title="Explore Data" variant="default">
                    Explore Data
                  </Button>
                  <Button
                    title="View Examples"
                    variant="ghost"
                    size="sm"
                    iconRight={<RxChevronRight className="transition-transform group-hover:translate-x-1" />}
                  >
                    View Examples
                  </Button>
                </div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-cosmic-500/20 to-biosphere-500/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-scheme-subtle">Chart Visualization Preview</p>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent
            value="tab-three"
            className="data-[state=active]:animate-tabs w-full max-w-5xl"
          >
            <Card className="grid grid-cols-1 md:grid-cols-2 md:items-center overflow-hidden">
              <div className="p-8 md:p-10 lg:p-12">
                <p className="mb-3 font-semibold text-biosphere-500 md:mb-4">Knowledge Network</p>
                <h2 className="heading-h3 mb-5 font-bold md:mb-6">
                  Research Connections
                </h2>
                <p className="text-scheme-muted mb-6">
                  Discover hidden connections between studies, experiments, and
                  findings. Navigate the web of space biology research with ease.
                </p>
                <div className="flex items-center gap-x-4">
                  <Button title="Explore Graph" variant="default">
                    Explore Graph
                  </Button>
                  <Button
                    title="See Demo"
                    variant="ghost"
                    size="sm"
                    iconRight={<RxChevronRight className="transition-transform group-hover:translate-x-1" />}
                  >
                    See Demo
                  </Button>
                </div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-biosphere-500/20 via-cosmic-500/20 to-biosphere-500/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🕸️</div>
                  <p className="text-scheme-subtle">Knowledge Graph Preview</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
