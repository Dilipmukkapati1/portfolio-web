"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { HouseholdProvider } from "@/components/HouseholdProvider";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <HouseholdProvider>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen overflow-hidden"
    >
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </motion.div>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </motion.div>
    </HouseholdProvider>
  );
}
