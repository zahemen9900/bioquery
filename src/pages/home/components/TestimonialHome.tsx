"use client";

import { motion } from "motion/react";
import { BiSolidStar } from "react-icons/bi";

export function TestimonialHome() {
  const testimonials = [
    {
      text: "BioQuery has revolutionized how we understand space biology experiments. The AI summarization alone saves us weeks of literature review.",
      name: "Dr. Sarah Martinez",
      title: "Lead Researcher, NASA",
      image: "/nerd.jpg",
      glowColor: "biosphere-500"
    },
    {
      text: "The most intuitive research platform I've ever used. The entity graph allows us to spot correlations across microgravity studies we would have missed.",
      name: "Dr. Michael Chen",
      title: "Senior Scientist, SpaceX",
      image: "/michael_chen.jpg",
      glowColor: "accent-purple"
    },
    {
      text: "A game-changer for interdisciplinary research collaboration. Visualizing the data makes it incredibly simple to communicate findings.",
      name: "Dr. Elena Rodriguez",
      title: "Research Director, ISS",
      image: "/elena_rodriguez.jpg",
      glowColor: "accent-blue"
    }
  ];

  return (
    <section className="relative px-[5%] py-24 md:py-32 bg-slate-50 dark:bg-space-950 overflow-hidden transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-biosphere-500/5 blur-[250px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      <div className="container relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto mb-16 w-full max-w-2xl text-center md:mb-24"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-800 dark:text-space-100 font-bold text-xs tracking-[0.2em] uppercase mb-6 shadow-sm dark:shadow-glass-sm backdrop-blur-md transition-colors duration-500">
            Voices of Discovery
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight transition-colors duration-500">
            Loved By Pioneers
          </h2>
          <p className="text-xl text-slate-600 dark:text-space-200 leading-relaxed transition-colors duration-500">
            Hear from scientists worldwide who have transformed their research workflows.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40, rotateY: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: idx * 0.15, ease: "easeOut" }}
              style={{ perspective: "1500px" }}
              className="group h-full"
            >
              <div className="relative flex h-full w-full flex-col justify-between p-8 md:p-10 rounded-[2rem] bg-white/40 dark:bg-space-800/40 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:bg-white/60 dark:hover:bg-space-800/60 hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] group-hover:border-black/10 dark:group-hover:border-white/20">
                <div className="absolute inset-0 bg-glass-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem] dark:opacity-0 group-hover:dark:opacity-100 dark:block hidden" />

                {/* Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-br from-${testimonial.glowColor}/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-[2rem] -z-10`} />

                <div className="relative z-10 mb-8">
                  <div className="mb-6 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <BiSolidStar key={i} className="size-5 text-biosphere-500 drop-shadow-[0_0_8px_rgba(0,231,179,0.3)] dark:drop-shadow-[0_0_8px_rgba(0,231,179,0.5)] transition-shadow duration-500" />
                    ))}
                  </div>
                  <blockquote className="text-lg md:text-xl text-slate-900 dark:text-white leading-relaxed font-medium italic transition-colors duration-500">
                    "{testimonial.text}"
                  </blockquote>
                </div>

                <div className="relative z-10 mt-auto flex items-center gap-4 pt-6 border-t border-black/5 dark:border-white/10 transition-colors duration-500">
                  <div className="relative">
                    <div className={`absolute -inset-1 bg-gradient-to-tr from-${testimonial.glowColor} to-transparent rounded-full blur-sm opacity-50`} />
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="relative size-14 rounded-full object-cover border-2 border-slate-50 dark:border-space-900 transition-colors duration-500"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white tracking-wide transition-colors duration-500">{testimonial.name}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-space-300 transition-colors duration-500">{testimonial.title}</p>
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
