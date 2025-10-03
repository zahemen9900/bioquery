"use client";

import {
  BiLogoLinkedinSquare,
  BiLogoYoutube,
} from "react-icons/bi";
import { FaXTwitter, FaGithub } from "react-icons/fa6";
import BioQueryLogo from "/BioQueryLogo.png";

export function FooterHome() {
  return (
    <footer className="border-t border-scheme-border bg-scheme-background px-[5%] py-12 md:py-16 transition-theme">
      <div className="container max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between gap-12 pb-8">
          {/* Brand Section */}
          <div className="max-w-sm">
            <div className="mb-4">
              <a href="#" className="inline-block">
                <img
                  src={BioQueryLogo}
                  alt="BioQuery Logo"
                  className="h-8"
                />
              </a>
            </div>
            <p className="text-scheme-muted text-sm mb-6">
              Exploring life beyond Earth, one question at a time. Transform how you understand space biology research.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a href="#" className="text-scheme-muted hover:text-biosphere-500 transition-colors" aria-label="Twitter">
                <FaXTwitter className="size-5" />
              </a>
              <a href="#" className="text-scheme-muted hover:text-biosphere-500 transition-colors" aria-label="LinkedIn">
                <BiLogoLinkedinSquare className="size-6" />
              </a>
              <a href="#" className="text-scheme-muted hover:text-biosphere-500 transition-colors" aria-label="GitHub">
                <FaGithub className="size-5" />
              </a>
              <a href="#" className="text-scheme-muted hover:text-biosphere-500 transition-colors" aria-label="YouTube">
                <BiLogoYoutube className="size-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-sm font-semibold mb-4 text-scheme-text">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-scheme-muted hover:text-biosphere-500 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-scheme-muted hover:text-biosphere-500 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-scheme-muted hover:text-biosphere-500 transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-4 text-scheme-text">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-scheme-muted hover:text-biosphere-500 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-scheme-muted hover:text-biosphere-500 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-scheme-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-scheme-subtle">
              © 2025 BioQuery. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-scheme-subtle hover:text-biosphere-500 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-scheme-subtle hover:text-biosphere-500 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
