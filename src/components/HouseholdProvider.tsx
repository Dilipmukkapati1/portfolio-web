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
import type { Household } from "@/lib/household-types";
import {
  getActiveHouseholdId,
  HOUSEHOLD_ID_CHANGED_EVENT,
  registerHouseholdId,
  setActiveHouseholdId,
} from "@/lib/household-session";
import { webEnv } from "@/lib/env";

type HouseholdContextValue = {
  household: Household | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  householdId: string;
  refresh: () => Promise<void>;
  setHouseholdId: (id: string) => void;
};

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [householdId, setHouseholdIdState] = useState(webEnv.defaultHouseholdId);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setHouseholdIdState(getActiveHouseholdId());
    const onIdChange = () => setHouseholdIdState(getActiveHouseholdId());
    window.addEventListener(HOUSEHOLD_ID_CHANGED_EVENT, onIdChange);
    return () =>
      window.removeEventListener(HOUSEHOLD_ID_CHANGED_EVENT, onIdChange);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await api.getHousehold();
      setHousehold(data);
      registerHouseholdId(data.householdId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load household";
      if (message.toLowerCase().includes("not found")) {
        setHousehold(null);
        setNotFound(true);
      } else {
        setError(message);
        setHousehold(null);
      }
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setHouseholdId = useCallback((id: string) => {
    setActiveHouseholdId(id);
    setHouseholdIdState(id);
  }, []);

  const value = useMemo(
    () => ({
      household,
      loading,
      error,
      notFound,
      householdId,
      refresh,
      setHouseholdId,
    }),
    [household, loading, error, notFound, householdId, refresh, setHouseholdId]
  );

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) {
    throw new Error("useHousehold must be used within HouseholdProvider");
  }
  return ctx;
}
