"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface Stats {
  userCount: number;
  householdCount: number;
  activeConnections: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => null);

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <PageHeader title="Admin Overview" description="System metrics and activity" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total users"
          value={String(stats?.userCount ?? "—")}
          icon={Users}
        />
        <StatCard
          title="Households"
          value={String(stats?.householdCount ?? "—")}
          icon={Users}
        />
        <StatCard
          title="Active connections"
          value={String(stats?.activeConnections ?? 0)}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent signups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.slice(0, 5).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name ?? "—"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{formatDateTime(user.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
