"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  X,
} from "lucide-react";
import { navLinks } from "@/components/nav-links";
import { HouseholdProvider, useHousehold } from "@/components/HouseholdProvider";
import { HouseholdSummary } from "@/components/HouseholdSummary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "portfolio-sidebar-collapsed";
const LG_BREAKPOINT = 1024;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarHousehold({ showCollapsed }: { showCollapsed: boolean }) {
  const { household, loading, notFound } = useHousehold();

  if (loading || notFound || !household) {
    return null;
  }

  return (
    <div
      className={cn(
        "px-2 pb-2",
        showCollapsed && "lg:px-2 lg:flex lg:justify-center"
      )}
    >
      <HouseholdSummary
        household={household}
        compact
        className={cn(showCollapsed && "lg:hidden")}
      />
      {showCollapsed && (
        <div
          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-semibold"
          title={household.displayName}
        >
          {household.displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const handleBottomAction = useCallback(() => {
    if (window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`).matches) {
      setMobileOpen(false);
      return;
    }
    toggleCollapsed();
  }, [toggleCollapsed]);

  const showCollapsed = hydrated && collapsed;

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card shadow-xl transition-[transform,width] duration-300 ease-in-out lg:static lg:z-auto lg:shadow-none",
          showCollapsed ? "lg:w-[4.5rem]" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Main navigation"
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-border px-3",
            showCollapsed ? "lg:justify-center lg:px-2" : "gap-3"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden transition-opacity",
              showCollapsed ? "lg:w-0 lg:opacity-0" : "opacity-100"
            )}
          >
            <p className="truncate text-sm font-semibold leading-tight">
              Portfolio
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Personal finance
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 shrink-0 p-0 lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const active = isActivePath(pathname, link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={showCollapsed ? link.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      showCollapsed && "lg:justify-center lg:px-2",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span
                      className={cn(
                        "truncate transition-opacity",
                        showCollapsed
                          ? "lg:w-0 lg:overflow-hidden lg:opacity-0"
                          : "opacity-100"
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <SidebarHousehold showCollapsed={showCollapsed} />

        <div className="shrink-0 border-t border-border p-2">
          <button
            type="button"
            onClick={handleBottomAction}
            aria-label={
              isMobile
                ? "Close navigation menu"
                : showCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              showCollapsed && "lg:justify-center lg:px-2"
            )}
          >
            <span className="flex w-full items-center gap-3 lg:hidden">
              <X className="h-5 w-5 shrink-0" aria-hidden />
              <span>Close menu</span>
            </span>
            <span
              className={cn(
                "hidden w-full items-center gap-3 lg:flex",
                showCollapsed && "justify-center"
              )}
            >
              {showCollapsed ? (
                <>
                  <PanelLeftOpen className="h-5 w-5 shrink-0" />
                  <span className="sr-only">Expand sidebar</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="h-5 w-5 shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 shrink-0 p-0"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <MobileHeaderTitle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function MobileHeaderTitle() {
  const { household, loading } = useHousehold();
  if (loading) {
    return (
      <>
        <p className="truncate text-sm font-semibold">Portfolio</p>
        <p className="truncate text-xs text-muted-foreground">Loading…</p>
      </>
    );
  }
  if (household) {
    return (
      <>
        <p className="truncate text-sm font-semibold">{household.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {household.state} · {household.householdId}
        </p>
      </>
    );
  }
  return (
    <>
      <p className="truncate text-sm font-semibold">Portfolio</p>
      <p className="truncate text-xs text-muted-foreground">
        Personal finance dashboard
      </p>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdProvider>
      <AppShellInner>{children}</AppShellInner>
    </HouseholdProvider>
  );
}
