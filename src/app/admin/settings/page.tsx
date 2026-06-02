"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { webEnv } from "@/lib/env";

export default function AdminSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader title="Settings" description="Application configuration" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">App URL:</span>{" "}
            {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
          </p>
          <p>
            <span className="text-muted-foreground">API target:</span>{" "}
            {webEnv.apiTarget}
          </p>
          <p>
            <span className="text-muted-foreground">API URL:</span>{" "}
            {webEnv.apiUrl}
          </p>
          <p>
            <span className="text-muted-foreground">Household:</span>{" "}
            {webEnv.defaultHouseholdId}
          </p>
          <p>
            <span className="text-muted-foreground">Auth mode:</span> Simple
            username/password
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
