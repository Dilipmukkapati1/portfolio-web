"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DisplayUnit } from "@portfolio/contracts";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PrivacyContextValue = {
  isUnlocked: boolean;
  privacyVersion: number;
  displayUnit: DisplayUnit;
  setDisplayUnit: (unit: DisplayUnit) => void;
  showUnlockDialog: () => void;
  hideValues: () => void;
};

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [privacyVersion, setPrivacyVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const displayUnit: DisplayUnit = isUnlocked ? "dollar" : "percent";

  const bumpPrivacyVersion = useCallback(
    () => setPrivacyVersion((version) => version + 1),
    []
  );

  const showUnlockDialog = useCallback(() => {
    setError(null);
    setPassword("");
    setDialogOpen(true);
  }, []);

  const hideValues = useCallback(() => {
    api.lockPrivacy();
    setIsUnlocked(false);
    setPassword("");
    setDialogOpen(false);
    bumpPrivacyVersion();
  }, [bumpPrivacyVersion]);

  const setDisplayUnit = useCallback(
    (unit: DisplayUnit) => {
      if (unit === "percent") {
        if (isUnlocked) hideValues();
        return;
      }
      if (!isUnlocked) showUnlockDialog();
    },
    [hideValues, isUnlocked, showUnlockDialog]
  );

  useEffect(() => {
    api.setPrivacyUnauthorizedHandler(hideValues);
    return () => api.setPrivacyUnauthorizedHandler(null);
  }, [hideValues]);

  const unlock = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.unlockPrivacy(password);
      api.setPrivacyToken(result.privacyToken);
      setIsUnlocked(true);
      setDialogOpen(false);
      setPassword("");
      bumpPrivacyVersion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unlock values");
    } finally {
      setSubmitting(false);
    }
  }, [bumpPrivacyVersion, password]);

  const value = useMemo(
    () => ({
      isUnlocked,
      privacyVersion,
      displayUnit,
      setDisplayUnit,
      showUnlockDialog,
      hideValues,
    }),
    [
      displayUnit,
      hideValues,
      isUnlocked,
      privacyVersion,
      setDisplayUnit,
      showUnlockDialog,
    ]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Show dollar values</DialogTitle>
            <DialogDescription>
              Re-enter your login password to show monetary values for this session.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void unlock();
            }}
          >
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Password"
            />
            {error && (
              <p className="text-sm text-rose-400" role="alert">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || password.length === 0}>
                {submitting ? "Unlocking..." : "Unlock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextValue {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within PrivacyProvider");
  }
  return context;
}

export function PrivacyToggle({ compact = false }: { compact?: boolean }) {
  const { displayUnit, setDisplayUnit } = usePrivacy();

  return (
    <div
      className={cn("flex items-center gap-1.5", compact && "shrink-0")}
      role="group"
      aria-label="Value display"
    >
      <span
        className={cn(
          compact ? "text-xs" : "text-sm",
          displayUnit === "dollar" ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        $
      </span>
      <Switch
        checked={displayUnit === "percent"}
        onCheckedChange={(on) => setDisplayUnit(on ? "percent" : "dollar")}
        aria-label={
          displayUnit === "percent"
            ? "Showing percents; switch to show dollar values"
            : "Showing dollars; switch to hide dollar values"
        }
      />
      <span
        className={cn(
          compact ? "text-xs" : "text-sm",
          displayUnit === "percent" ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        %
      </span>
    </div>
  );
}
