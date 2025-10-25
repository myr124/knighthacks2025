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
    <ScrollArea className="h-full w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="config">Configure Scenario</TabsTrigger>
          <TabsTrigger value="review" disabled={!script}>Review Script</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <div className="max-w-2xl mx-auto">
            <ScenarioConfigForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onReset={resetScript}
            />
          </div>
        </TabsContent>
        <TabsContent value="review">
          <div className="max-w-3xl mx-auto">
            {script ? (
              <TTXScriptReviewPanel
                script={script}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="flex items-center justify-center min-h-[400px] bg-gray-800/30 rounded-lg border border-gray-700 p-4">
                <div className="text-center">
                  <Wand2 className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-300">No Script Generated Yet</h3>
                  <p className="text-gray-500 max-w-md">
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
