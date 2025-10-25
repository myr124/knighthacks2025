"use client";

import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Info, Cpu } from "lucide-react";

const getMockSummary = (period: number) => {
  if (period < 4) {
    return "The hurricane is currently a distant threat. Initial public awareness campaigns are underway, and most of the population remains calm. Key infrastructure is operating normally.";
  }
  if (period < 8) {
    return "The hurricane track is becoming clearer, prompting voluntary evacuations for coastal areas. We are seeing a slight increase in traffic and fuel consumption. Public sentiment is shifting from calm to concerned.";
  }
  if (period < 10) {
    return "Mandatory evacuations have been issued for multiple zones as the hurricane strengthens. Contraflow on major highways has been activated. Shelters are open and receiving evacuees. Critical issues include rising numbers of residents needing assistance and some refusing to evacuate.";
  }
  return "The hurricane is making landfall. All remaining residents have been advised to shelter in place. The EOC is now in full response mode, dealing with immediate life-safety issues.";
};

export function SituationSummaryPanel() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);

  if (!scenario) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Situation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const aggregates = currentResult.aggregates;
  const operationalPeriod = currentResult.operationalPeriod;

  return (
    <Card className="w-80 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Situation Summary</CardTitle>
        <p className="text-sm text-muted-foreground">
          {operationalPeriod.label}
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* AI Summary */}
          <div>
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-500" />
              AI Summary
            </h3>
            <p className="text-sm text-muted-foreground italic">
              {getMockSummary(currentPeriod)}
            </p>
          </div>

          <Separator />

          {/* Critical Issues */}
          <div>
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Critical Issues
            </h3>
            {aggregates.criticalIssues.length > 0 ? (
              <ul className="space-y-2 list-disc list-inside text-sm text-red-500">
                {aggregates.criticalIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No critical issues identified.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
