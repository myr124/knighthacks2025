'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Wand2 } from 'lucide-react';
import type { ScenarioConfig } from '@/lib/utils/ttxGenerator';

interface ScenarioConfigFormProps {
  onGenerate: (config: ScenarioConfig) => void;
  isGenerating?: boolean;
}

export function ScenarioConfigForm({ onGenerate, isGenerating = false }: ScenarioConfigFormProps) {
  const [config, setConfig] = useState<ScenarioConfig>({
    scenarioType: 'hurricane',
    location: 'Miami-Dade County, FL',
    severity: 'major',
    population: 2700000
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Configuration</CardTitle>
        <CardDescription>
          Configure the disaster scenario parameters. The system will generate a TTX script based on your inputs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scenario Type */}
          <div className="space-y-2">
            <Label htmlFor="scenarioType">Scenario Type</Label>
            <Select
              value={config.scenarioType}
              onValueChange={(value) => setConfig({ ...config, scenarioType: value as ScenarioConfig['scenarioType'] })}
            >
              <SelectTrigger id="scenarioType">
                <SelectValue placeholder="Select scenario type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hurricane">Hurricane</SelectItem>
                <SelectItem value="wildfire" disabled>Wildfire (Coming Soon)</SelectItem>
                <SelectItem value="flood" disabled>Flood (Coming Soon)</SelectItem>
                <SelectItem value="earthquake" disabled>Earthquake (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              placeholder="e.g., Miami-Dade County, FL"
              value={config.location}
              onChange={(e) => setConfig({ ...config, location: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the county or city where the scenario takes place
            </p>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={config.severity}
              onValueChange={(value) => setConfig({ ...config, severity: value as ScenarioConfig['severity'] })}
            >
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor (Category 1-2 Hurricane)</SelectItem>
                <SelectItem value="moderate">Moderate (Category 2-3 Hurricane)</SelectItem>
                <SelectItem value="major">Major (Category 3-4 Hurricane)</SelectItem>
                <SelectItem value="catastrophic">Catastrophic (Category 4-5 Hurricane)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Population */}
          <div className="space-y-2">
            <Label htmlFor="population">Population</Label>
            <Input
              id="population"
              type="number"
              min="10000"
              max="10000000"
              step="10000"
              placeholder="e.g., 2700000"
              value={config.population}
              onChange={(e) => setConfig({ ...config, population: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Total population of the affected area
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating TTX Script...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate TTX Script
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
