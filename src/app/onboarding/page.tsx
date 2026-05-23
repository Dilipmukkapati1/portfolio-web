"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PERSONAS = [
  { value: "w2_employee", label: "W-2 employee" },
  { value: "low_income", label: "Lower income / benefits focus" },
  { value: "business_owner", label: "Business owner" },
  { value: "family_with_kids", label: "Family with kids" },
];

const FILING = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married filing jointly" },
  { value: "head_of_household", label: "Head of household" },
];

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState("My Household");
  const [state, setState] = useState("CA");
  const [persona, setPersona] = useState("w2_employee");
  const [filingStatus, setFilingStatus] = useState("single");
  const [dependents, setDependents] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createHousehold({
        displayName,
        state,
        persona,
        filingStatus,
        dependents,
      });
      setMessage("Household created successfully.");
    } catch {
      try {
        await api.updateHousehold({
          displayName,
          state,
          persona,
          filingStatus,
          dependents,
        });
        setMessage("Household updated.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed");
      }
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-3xl font-bold">Onboarding</h2>
      <Card>
        <CardHeader>
          <CardTitle>Household setup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              Display name
              <input
                className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              State (2-letter)
              <input
                className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2"
                value={state}
                maxLength={2}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
            </label>
            <label className="block text-sm">
              Persona
              <select
                className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
              >
                {PERSONAS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Filing status
              <select
                className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2"
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value)}
              >
                {FILING.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Dependents
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2"
                value={dependents}
                onChange={(e) => setDependents(parseInt(e.target.value, 10))}
              />
            </label>
            <Button type="submit">Save household</Button>
            {message && (
              <p className="text-sm text-green-400">{message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
