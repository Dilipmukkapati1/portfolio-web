"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Link2, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const SIMPLEFIN_BRIDGE_URL = "https://beta-bridge.simplefin.org/";

type ConnectionStatus = "loading" | "connected" | "not_connected";

export default function ConnectionsPage() {
  const [simplefinStatus, setSimplefinStatus] =
    useState<ConnectionStatus>("loading");
  const [snaptradeStatus, setSnaptradeStatus] =
    useState<ConnectionStatus>("loading");

  const [simplefinDialogOpen, setSimplefinDialogOpen] = useState(false);
  const [setupToken, setSetupToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [simplefinSyncing, setSimplefinSyncing] = useState(false);
  const [snaptradeSyncing, setSnaptradeSyncing] = useState(false);
  const [snaptradeConnecting, setSnaptradeConnecting] = useState(false);

  const loadConnectionStatus = useCallback(async () => {
    setSimplefinStatus("loading");
    setSnaptradeStatus("loading");
    try {
      const status = await api.getIntegrationsStatus();
      setSimplefinStatus(
        status.simplefin.connected ? "connected" : "not_connected"
      );
      setSnaptradeStatus(
        status.snaptrade.connected ? "connected" : "not_connected"
      );
    } catch {
      setSimplefinStatus("not_connected");
      setSnaptradeStatus("not_connected");
    }
  }, []);

  useEffect(() => {
    void loadConnectionStatus();
  }, [loadConnectionStatus]);

  async function handleSimplefinConnect() {
    const token = setupToken.trim();
    if (!token) {
      toast({
        title: "Setup token required",
        description: "Paste the token from SimpleFIN Bridge.",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      const result = (await api.connectSimplefin(token)) as {
        message?: string;
      };
      toast({
        title: "SimpleFIN connected",
        description:
          result.message ??
          "Click Sync now to fetch your accounts and transactions.",
      });
      setSetupToken("");
      setSimplefinDialogOpen(false);
      setSimplefinStatus("connected");
      void loadConnectionStatus();
    } catch (e) {
      toast({
        title: "Connection failed",
        description:
          e instanceof Error ? e.message : "Could not connect SimpleFIN",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  }

  async function handleSimplefinSync() {
    setSimplefinSyncing(true);
    try {
      const result = (await api.syncSimplefin()) as {
        message?: string;
        accountsSynced?: number;
      };
      toast({
        title: "Sync complete",
        description:
          result.message ??
          (result.accountsSynced !== undefined
            ? `${result.accountsSynced} account(s) updated.`
            : "Accounts refreshed."),
      });
      window.dispatchEvent(new Event("portfolio:accounts-synced"));
      void loadConnectionStatus();
    } catch (e) {
      toast({
        title: "Sync failed",
        description: e instanceof Error ? e.message : "Could not sync SimpleFIN",
        variant: "destructive",
      });
    } finally {
      setSimplefinSyncing(false);
    }
  }

  async function handleSnaptradeSync() {
    setSnaptradeSyncing(true);
    try {
      const result = (await api.syncSnaptrade()) as {
        message?: string;
        holdingsSynced?: number;
      };
      toast({
        title: "Sync complete",
        description:
          result.message ??
          (result.holdingsSynced !== undefined
            ? `${result.holdingsSynced} holding(s) updated.`
            : "Holdings refreshed."),
      });
      window.dispatchEvent(new Event("portfolio:accounts-synced"));
      void loadConnectionStatus();
    } catch (e) {
      toast({
        title: "Sync failed",
        description: e instanceof Error ? e.message : "Could not sync SnapTrade",
        variant: "destructive",
      });
    } finally {
      setSnaptradeSyncing(false);
    }
  }

  async function handleSnaptradeConnect() {
    setSnaptradeConnecting(true);
    try {
      const { redirectUri } = await api.connectSnaptrade();
      window.location.href = redirectUri;
    } catch (e) {
      toast({
        title: "Connection failed",
        description:
          e instanceof Error ? e.message : "Could not start SnapTrade flow",
        variant: "destructive",
      });
      setSnaptradeConnecting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Connections"
        description="Link external financial data providers"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              SimpleFIN
            </CardTitle>
            <StatusBadge status={simplefinStatus} />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sync bank accounts and transactions via{" "}
              <a
                href={SIMPLEFIN_BRIDGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                SimpleFIN Bridge
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
              . Data is saved locally after each sync — click Sync now to refresh
              from your bank.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Sign up and connect your banks in SimpleFIN Bridge.</li>
              <li>
                Under <span className="text-foreground">Apps</span>, click{" "}
                <span className="text-foreground">New Connection</span>, then{" "}
                <span className="text-foreground">Create Setup Token</span>.
              </li>
              <li>Paste the one-time setup token below.</li>
            </ol>
            <motion.div
              className="flex flex-wrap gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button onClick={() => setSimplefinDialogOpen(true)}>
                {simplefinStatus === "connected" ? "Reconnect" : "Connect"}
              </Button>
              {simplefinStatus === "connected" && (
                <Button
                  variant="outline"
                  onClick={() => void handleSimplefinSync()}
                  disabled={simplefinSyncing}
                >
                  {simplefinSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync now
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              SnapTrade
            </CardTitle>
            <StatusBadge status={snaptradeStatus} />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sync investment holdings and trades from brokerages. Data is saved
              locally after each sync — click Sync now to refresh from SnapTrade.
            </p>
            <motion.div
              className="flex flex-wrap gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={() => void handleSnaptradeConnect()}
                disabled={snaptradeConnecting}
              >
                {snaptradeConnecting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {snaptradeStatus === "connected" ? "Reconnect" : "Connect"}
              </Button>
              {snaptradeStatus === "connected" && (
                <Button
                  variant="outline"
                  onClick={() => void handleSnaptradeSync()}
                  disabled={snaptradeSyncing}
                >
                  {snaptradeSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync now
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={simplefinDialogOpen} onOpenChange={setSimplefinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect SimpleFIN</DialogTitle>
            <DialogDescription>
              Paste the setup token from SimpleFIN Bridge. Each token works only
              once — generate a new one if this fails.
            </DialogDescription>
          </DialogHeader>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Label htmlFor="setup-token">Setup token</Label>
            <textarea
              id="setup-token"
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value)}
              placeholder="Paste your base64 setup token here…"
              rows={4}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              )}
              disabled={connecting}
            />
          </motion.div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSimplefinDialogOpen(false)}
              disabled={connecting}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSimplefinConnect()} disabled={connecting}>
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  if (status === "loading") {
    return (
      <Badge variant="secondary">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Checking…
      </Badge>
    );
  }
  if (status === "connected") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Connected</Badge>;
  }
  return <Badge variant="secondary">Not connected</Badge>;
}
