"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectionsPage() {
  const [setupToken, setSetupToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function connectSimplefin() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.connectSimplefin(setupToken);
      setMessage(JSON.stringify(res));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function syncSimplefin() {
    setLoading(true);
    try {
      const res = await api.syncSimplefin(true);
      setMessage(`Synced: ${JSON.stringify(res)}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  async function connectSnaptrade() {
    setLoading(true);
    try {
      const { redirectUri } = await api.connectSnaptrade();
      window.location.href = redirectUri;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold">Connections</h2>
      <Card>
        <CardHeader>
          <CardTitle>SimpleFIN Bridge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste your Setup Token from{" "}
            <a
              href="https://bridge.simplefin.org"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              SimpleFIN Bridge
            </a>
            . Data may be up to ~24 hours stale; max 24 API requests per day.
          </p>
          <textarea
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm min-h-[80px]"
            placeholder="Setup token (base64)"
            value={setupToken}
            onChange={(e) => setSetupToken(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={connectSimplefin} disabled={loading || !setupToken}>
              Connect
            </Button>
            <Button variant="outline" onClick={syncSimplefin} disabled={loading}>
              Sync now
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>SnapTrade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect brokerages via OAuth. Holdings update via webhooks when
            configured in SnapTrade Dashboard.
          </p>
          <Button onClick={connectSnaptrade} disabled={loading}>
            Connect brokerage
          </Button>
        </CardContent>
      </Card>
      {message && (
        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">{message}</pre>
      )}
    </div>
  );
}
