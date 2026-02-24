"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import BioQueryLogo from "/BioQueryLogo.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export function NavbarHome() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] flex justify-center px-4 pt-4 pointer-events-none">
      <nav
        className={`pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border transition-all duration-500 ease-out ${scrolled
          ? "border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-900/60 backdrop-blur-xl shadow-sm dark:shadow-glass py-3 px-6"
          : "border-transparent bg-transparent py-4 px-4"
          }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 duration-300">
          <img src={BioQueryLogo} alt="BioQuery Logo" className="h-8 w-auto filter drop-shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-500" />
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white hidden sm:block transition-colors duration-500">BioQuery</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-x-3 sm:gap-x-5">
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <ThemeToggle />
          </div>
          <Link to="/auth">
            <Button
              className="rounded-full bg-biosphere-500 hover:bg-biosphere-400 text-white dark:text-space-900 font-bold tracking-wide shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal transition-all duration-300 border border-biosphere-400/50 h-10 px-6"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
