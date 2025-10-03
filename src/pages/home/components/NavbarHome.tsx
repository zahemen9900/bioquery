"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import BioQueryLogo from "/BioQueryLogo.png";

export function NavbarHome() {
  return (
    <section className="sticky top-0 z-[999] flex w-full items-center justify-between border-b border-scheme-border bg-scheme-background/95 backdrop-blur-md px-[5%] md:min-h-18 transition-theme">
      {/* Logo - Left */}
      <a href="#" className="flex min-h-16 shrink-0 items-center">
        <img
          src={BioQueryLogo}
          alt="BioQuery Logo"
          className="h-8"
        />
      </a>
      
      {/* Right side actions */}
      <div className="flex min-h-16 items-center justify-end gap-x-3">
        <ThemeToggle />
        <Button title="Get Started" size="sm" className="px-4 py-2 md:px-6">
          Get Started
        </Button>
      </div>
    </section>
  );
}
