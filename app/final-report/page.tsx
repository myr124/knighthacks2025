"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExecutiveSummaryDashboard } from "@/app/components/final-report/ExecutiveSummaryDashboard";
import { KeyInsightsSection } from "@/app/components/final-report/KeyInsightsSection";
import { InteractiveTimelineReplay } from "@/app/components/final-report/InteractiveTimelineReplay";
import { DeepDiveAnalytics } from "@/app/components/final-report/DeepDiveAnalytics";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useState, useEffect } from "react";
import { generateAARDocx } from "@/lib/utils/generateDocx";

export default function FinalReportPage() {
  const router = useRouter();
  const scenario = useTTXStoreV2((state) => state.scenario);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (!scenario) {
      router.push("/simulation-v2");
    }
  }, [scenario, router]);

  if (!scenario) {
    return null;
  }

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);

    try {
      // Call the API to generate the AAR/IP document
      const response = await fetch('/api/ttx/generate-aar-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenarioData: scenario }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      const { document: aarDocument, metadata } = data;

      // Convert markdown to Word document
      const docxBlob = await generateAARDocx(aarDocument, metadata);

      // Create download link
      const url = window.URL.createObjectURL(docxBlob);
      const link = window.document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `AAR-IP_${metadata.scenarioName.replace(/\s+/g, '_')}_${timestamp}.docx`;
      link.download = filename;

      window.document.body.appendChild(link);
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);

      console.log('AAR/IP document downloaded successfully');
    } catch (error) {
      console.error('Error generating AAR/IP document:', error);
      alert('Failed to generate AAR/IP document. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/simulation-v2">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Simulation
              </Button>
            </Link>

            <div className="border-l pl-4">
              <h1 className="font-bold text-xl">After-Action Report</h1>
              <p className="text-sm text-muted-foreground">
                {scenario.ttxScript.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download AAR/IP
                </>
              )}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Executive Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ExecutiveSummaryDashboard />
        </motion.div>

        {/* Key Insights */}
        <motion.div
          className="mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <KeyInsightsSection />
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          className="mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="timeline">Timeline Replay</TabsTrigger>
              <TabsTrigger value="analytics">Deep-Dive Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <InteractiveTimelineReplay />
            </TabsContent>

            <TabsContent value="analytics">
              <DeepDiveAnalytics />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
}
