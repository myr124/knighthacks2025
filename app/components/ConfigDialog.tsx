"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, PenTool, Loader2, Save } from "lucide-react";
import { ScenarioConfigForm } from "./ScenarioConfigForm";
import { TTXScriptReviewPanel } from "./TTXScriptReviewPanel";
import type { TTXScript } from "@/lib/utils/ttxGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  saveTTXSession,
  loadTTXSession,
  type TTXSession,
} from "@/lib/utils/browserStorage";

interface ConfigDialogProps {
  onScriptGenerated?: (script: TTXScript) => void;
  initialScript?: TTXScript;
  startOnReview?: boolean;
  getSaveKey?: () => string | undefined;
}

export function ConfigDialog({
  onScriptGenerated,
  initialScript,
  startOnReview = false,
  getSaveKey,
}: ConfigDialogProps) {
  const [script, setScript] = useState<TTXScript | null>(initialScript ?? null);
  const [activeTab, setActiveTab] = useState(
    startOnReview ? "review" : "config"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Generate or retrieve session ID for this workflow
  const [sessionId] = useState(
    () => `ttx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
  const [currentConfig, setCurrentConfig] = useState<any>(null);

  // Callback to open preview tab
  const openPreviewTab = () => setActiveTab("preview");
  // Facilitator script (augment text) to display in Preview tab
  const [previewText, setPreviewText] = useState<string>("");
  // Edit mode for preview text
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  // Loading state for augment API call
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Keep internal state in sync if initialScript/startOnReview change
  React.useEffect(() => {
    if (initialScript) {
      setScript(initialScript);
      setActiveTab("review");
    }
  }, [initialScript]);

  // Wrapper for setPreviewText that also saves to session
  const handlePreviewReady = (text: string) => {
    setPreviewText(text);
    // Update session with preview text
    if (script && currentConfig) {
      const session: TTXSession = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: currentConfig,
        script,
        previewText: text,
      };
      saveTTXSession(sessionId, session);
    }
  };

  // Handler for preview text changes (when editing is enabled)
  const handlePreviewTextChange = (newText: string) => {
    setPreviewText(newText);
    // Save to session
    if (script && currentConfig) {
      const session: TTXSession = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: currentConfig,
        script,
        previewText: newText,
      };
      saveTTXSession(sessionId, session);
    }
  };

  const handleGenerate = async (config: any) => {
    try {
      setIsGenerating(true);
      setCurrentConfig(config);
      const res = await fetch("/api/ttx/skeleton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate script");
      }
      const generated = (await res.json()) as TTXScript;
      setScript(generated);
      onScriptGenerated?.(generated);

      // Save to unified session: config + initial script (preview will be added later)
      const session: TTXSession = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config,
        script: generated,
        previewText: "",
      };
      saveTTXSession(sessionId, session);

      setActiveTab("review");
    } catch (e) {
      console.error("Generate skeleton failed:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    // After Save Script & Exit is clicked inside the review panel,
    // navigate back to home page
    router.push("/");
  };

  const resetScript = () => {
    setScript(null);
    setActiveTab("config");
  };

  return (
    <ScrollArea className="h-full w-full bg-transparent">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="ml-3 mb-6 bg-zinc-900/40 border border-zinc-800 rounded-lg p-1">
          <TabsTrigger
            value="config"
            className="rounded-md px-4 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Configure Scenario
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="rounded-md px-4 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Review Script
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="rounded-md px-4 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <motion.div
            className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ScenarioConfigForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onReset={resetScript}
            />
          </motion.div>
        </TabsContent>
        <TabsContent value="review">
          <motion.div
            className="mx-auto w-full max-w-[1400px] px-2 sm:px-4 lg:px-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {script ? (
                <motion.div
                  key="script-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <TTXScriptReviewPanel
                    script={script}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    getSaveKey={getSaveKey}
                    openPreviewTab={openPreviewTab}
                    onPreviewReady={handlePreviewReady}
                    sessionId={sessionId}
                    onPreviewLoading={setIsLoadingPreview}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="no-script"
                  className="flex items-center justify-center min-h-[400px] bg-zinc-900/30 rounded-lg border border-zinc-800 p-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <Wand2 className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
                    </motion.div>
                    <motion.h3
                      className="text-xl font-semibold mb-2 text-zinc-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      No Script Generated Yet
                    </motion.h3>
                    <motion.p
                      className="text-zinc-500 max-w-md"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      Complete the scenario configuration to generate your TTX
                      script. The review panel will populate with injects and
                      actions based on your inputs.
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        <TabsContent value="preview">
          <motion.div
            className="mx-auto w-full max-w-[1400px] px-2 sm:px-4 lg:px-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {script ? (
                <motion.div
                  key="script-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-zinc-200">
                      Facilitator Script Preview
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={isEditingPreview ? "default" : "outline"}
                        onClick={() => setIsEditingPreview(!isEditingPreview)}
                        className="gap-2"
                        disabled={isLoadingPreview}
                      >
                        <PenTool className="h-4 w-4 text-zinc-400" />
                        {isEditingPreview ? "Done Editing" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          if (script && currentConfig) {
                            const session: TTXSession = {
                              id: sessionId,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                              config: currentConfig,
                              script,
                              previewText,
                            };
                            saveTTXSession(sessionId, session);
                            // alert(` Session saved with ID: ${sessionId}`);
                          }
                        }}
                        className="gap-2"
                        disabled={isLoadingPreview || !previewText}
                      >
                        <Save className="h-4 w-4 text-zinc-400" />
                        Save Session
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={previewText}
                      onChange={(e) => handlePreviewTextChange(e.target.value)}
                      readOnly={!isEditingPreview || isLoadingPreview}
                      className="min-h-[360px] font-mono text-sm"
                      placeholder="Generate Full Script to populate this facilitator script preview."
                    />
                    {isLoadingPreview && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 rounded-md backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Loader2 className="h-12 w-12 text-blue-500" />
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-script"
                  className="flex items-center justify-center min-h-[400px] bg-zinc-900/30 rounded-lg border border-zinc-800 p-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <Wand2 className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
                    </motion.div>
                    <motion.h3
                      className="text-xl font-semibold mb-2 text-zinc-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      No Script Generated Yet
                    </motion.h3>
                    <motion.p
                      className="text-zinc-500 max-w-md"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      Complete the scenario configuration to generate your TTX
                      script. The review panel will populate with injects and
                      actions based on your inputs.
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );
}
