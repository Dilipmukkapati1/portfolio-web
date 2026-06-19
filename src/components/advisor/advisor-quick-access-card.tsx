"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useOpenAdvisor } from "@/lib/advisor/open-advisor";

export function AdvisorQuickAccessCard({
  route,
  snapshot,
  title = "Ask your tax advisor",
  description,
  prompt,
  sourceLabelSuffix,
  starterPrompts,
  buttonLabel = "Open advisor",
}: {
  route: string;
  snapshot: Record<string, unknown>;
  title?: string;
  description: string;
  prompt?: string;
  sourceLabelSuffix?: string;
  starterPrompts?: string[];
  buttonLabel?: string;
}) {
  const openAdvisor = useOpenAdvisor();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{title}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          variant="default"
          className="w-full sm:w-auto"
          onClick={() =>
            openAdvisor({
              route,
              snapshot,
              prompt,
              sourceLabelSuffix,
              starterPrompts,
            })
          }
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
