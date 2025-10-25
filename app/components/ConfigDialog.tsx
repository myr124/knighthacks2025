'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Wand2 } from 'lucide-react';
import { ScenarioConfigForm } from './ScenarioConfigForm';
import { TTXScriptReviewPanel } from './TTXScriptReviewPanel';
import { generateTTX, type TTXScript } from '@/lib/utils/ttxGenerator';

interface ConfigDialogProps {
  onScriptGenerated?: (script: TTXScript) => void;
}

export function ConfigDialog({ onScriptGenerated }: ConfigDialogProps) {
  const [script, setScript] = useState<TTXScript | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async (config: any) => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateTTX(config);
      setScript(generated);
      if (onScriptGenerated) {
        onScriptGenerated(generated);
      }
      setIsGenerating(false);
      setActiveTab('review');
    }, 1500);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      console.log('Script submitted to backend');
    }, 1000);
  };

  const resetScript = () => {
    setScript(null);
    setActiveTab('config');
  };

  return (
    <ScrollArea className="h-full w-full bg-transparent">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-zinc-900/40 border border-zinc-800 rounded-lg p-1">
          <TabsTrigger value="config" className="rounded-md px-4 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Configure Scenario</TabsTrigger>
          <TabsTrigger value="review" className="rounded-md px-4 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Review Script</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScenarioConfigForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onReset={resetScript}
            />
          </div>
        </TabsContent>
        <TabsContent value="review">
          <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-4 lg:px-6">
            {script ? (
              <TTXScriptReviewPanel
                script={script}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="flex items-center justify-center min-h-[400px] bg-zinc-900/30 rounded-lg border border-zinc-800 p-6">
                <div className="text-center">
                  <Wand2 className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold mb-2 text-zinc-300">No Script Generated Yet</h3>
                  <p className="text-zinc-500 max-w-md">
                    Complete the scenario configuration to generate your TTX script. The review panel will populate with injects and actions based on your inputs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );
}
