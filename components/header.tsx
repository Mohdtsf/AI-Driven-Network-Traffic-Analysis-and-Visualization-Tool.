// components/header.tsx
"use client";

import { useState } from "react";
import { MoonIcon, SunIcon, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold sm:inline-block">NetMonitor AI</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/dashboard"
            >
              Dashboard
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/alerts"
            >
              Alerts
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/settings"
            >
              Settings
            </a>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden p-4 border-t border-border/40 bg-background">
          <nav className="flex flex-col space-y-3">
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/dashboard"
            >
              Dashboard
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/alerts"
            >
              Alerts
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/settings"
            >
              Settings
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
