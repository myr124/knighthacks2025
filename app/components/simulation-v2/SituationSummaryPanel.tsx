"use client";

import { motion } from "framer-motion";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Info, Cpu } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const aiSummaries = useTTXStoreV2((state) => state.aiSummaries);
  const isGeneratingSummaries = useTTXStoreV2((state) => state.isGeneratingSummaries);
  const generateSummaryForPeriod = useTTXStoreV2((state) => state.generateSummaryForPeriod);

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
  const summary = aiSummaries.get(currentPeriod);

  const handleGenerateSummary = () => {
    generateSummaryForPeriod(currentPeriod);
  };

  return (
    <Card className="h-full flex flex-col bg-background">
      <CardHeader>
        <motion.div
          key={`header-${currentPeriod}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CardTitle className="text-lg font-bold">Situation Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            {operationalPeriod.label}
          </p>
        </motion.div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-6 h-full">
          {/* AI Summary */}
          <motion.div
            key={`summary-${currentPeriod}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full flex flex-col"
          >
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-500" />
              AI Summary
            </h3>
            {isGeneratingSummaries ? (
              <p className="text-sm text-muted-foreground italic">Generating AI summary...</p>
            ) : summary ? (
              <ScrollArea className="flex-1 w-full rounded-md border p-4 prose prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-foreground" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-foreground" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-md font-semibold text-foreground" {...props} />,
                    p: ({ node, ...props }) => <p className="text-secondary-foreground" {...props} />,
                    strong: ({ node, ...props }) => <strong className="text-foreground" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside" {...props} />,
                    li: ({ node, ...props }) => <li className="text-secondary-foreground" {...props} />,
                  }}>
                  {summary}
                </ReactMarkdown>
              </ScrollArea>
            ) : (
              <Button onClick={handleGenerateSummary} disabled={isGeneratingSummaries}>
                Generate Summary
              </Button>
            )}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
