"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const bumpPrivacyVersion = useCallback(
    () => setPrivacyVersion((version) => version + 1),
    []
  );

  const hideValues = useCallback(() => {
    api.lockPrivacy();
    setIsUnlocked(false);
    setPassword("");
    setDialogOpen(false);
    bumpPrivacyVersion();
  }, [bumpPrivacyVersion]);

  useEffect(() => {
    api.setPrivacyUnauthorizedHandler(hideValues);
    return () => api.setPrivacyUnauthorizedHandler(null);
  }, [hideValues]);

  const showUnlockDialog = useCallback(() => {
    setError(null);
    setPassword("");
    setDialogOpen(true);
  }, []);

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
    () => ({ isUnlocked, privacyVersion, showUnlockDialog, hideValues }),
    [hideValues, isUnlocked, privacyVersion, showUnlockDialog]
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
                {submitting ? "Unlocking..." : "Show dollar values"}
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
  const { isUnlocked, showUnlockDialog, hideValues } = usePrivacy();
  return (
    <Button
      type="button"
      variant={isUnlocked ? "destructive" : "outline"}
      size={compact ? "sm" : "default"}
      onClick={isUnlocked ? hideValues : showUnlockDialog}
      className={compact ? "text-xs" : undefined}
    >
      {isUnlocked ? "Hide $" : "Show dollar values"}
    </Button>
  );
}
