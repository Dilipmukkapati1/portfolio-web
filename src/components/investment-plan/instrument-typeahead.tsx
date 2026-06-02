"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { InstrumentSearchResult } from "@portfolio/contracts";
import { cn } from "@/lib/utils";

export function InstrumentTypeahead({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: InstrumentSearchResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<InstrumentSearchResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void api
        .searchInstruments(value, 8)
        .then((res) => setResults(res.results))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder="Ticker or fund name"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-autocomplete="list"
      />
      {open && results.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {results.map((opt) => (
            <li key={`${opt.ticker}-${opt.name}`}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  "min-h-11"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(opt);
                  onChange(opt.name);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{opt.ticker}</span>
                <span className="ml-2 truncate text-muted-foreground">
                  {opt.name.includes("—") ? opt.name.split("—")[1]?.trim() : opt.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
