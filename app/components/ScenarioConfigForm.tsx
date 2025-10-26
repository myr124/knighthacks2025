"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import type { ScenarioConfig } from "@/lib/utils/ttxGenerator";

interface ScenarioConfigFormProps {
  onGenerate: (config: ScenarioConfig) => void;
  isGenerating?: boolean;
  onReset?: () => void;
}

export function ScenarioConfigForm({
  onGenerate,
  isGenerating = false,
  onReset,
}: ScenarioConfigFormProps) {
  const [config, setConfig] = useState<ScenarioConfig>({
    scenarioType: "hurricane",
    location: "",
    severity: "minor",
    population: 0,
    agents: 0,
    time: 1,
  });
  const handleReset = () => {
    setConfig({
      scenarioType: "hurricane",
      location: "",
      severity: "minor",
      population: 0,
      agents: 0,
      time: 1,
    });
    if (onReset) onReset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(config);
  };

  return (
    <Card className="bg-background border border-gray-800 text-gray-100">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Scenario Type */}
          <div className="space-y-2">
            <Label htmlFor="scenarioType" className="text-gray-300">
              Scenario Type
            </Label>
            <Select
              value={config.scenarioType}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  scenarioType: value as ScenarioConfig["scenarioType"],
                })
              }
            >
              <SelectTrigger
                id="scenarioType"
                className="bg-gray-800 border-gray-700 text-gray-100"
              >
                <SelectValue placeholder="Select scenario type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
                <SelectItem value="hurricane">Hurricane</SelectItem>
                {/* <SelectItem value="wildfire" disabled>Wildfire (Coming Soon)</SelectItem> */}
                <SelectItem value="flood" disabled>
                  Flood (Coming Soon)
                </SelectItem>
                <SelectItem value="epidemic" disabled>
                  Epidemic (Coming Soon)
                </SelectItem>
                {/* <SelectItem value="earthquake" disabled>Earthquake (Coming Soon)</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-gray-300">
              Location
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="e.g., Miami-Dade County, FL"
              value={config.location}
              onChange={(e) =>
                setConfig({ ...config, location: e.target.value })
              }
              required
              className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
            />
            <p className="text-xs text-gray-400">
              Enter the county or city where the scenario takes place
            </p>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="severity" className="text-gray-300">
              Severity
            </Label>
            <Select
              value={config.severity}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  severity: value as ScenarioConfig["severity"],
                })
              }
            >
              <SelectTrigger
                id="severity"
                className="bg-gray-800 border-gray-700 text-gray-100"
              >
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
                <SelectItem value="minor">
                  Minor (Category 1 Hurricane)
                </SelectItem>
                <SelectItem value="moderate">
                  Moderate (Category 2 Hurricane)
                </SelectItem>
                <SelectItem value="major">
                  Major (Category 3 Hurricane)
                </SelectItem>
                <SelectItem value="severe">
                  Severe (Category 4 Hurricane)
                </SelectItem>
                <SelectItem value="catastrophic">
                  Catastrophic (Category 5 Hurricane)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              Enter the hurricane severity level
            </p>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-gray-300">
              Duration (Days)
            </Label>
            <Input
              id="time"
              type="number"
              min={1}
              max={7}
              step={1}
              placeholder="e.g., 3"
              value={config.time}
              onChange={(e) =>
                setConfig({
                  ...config,
                  time: Math.max(1, Math.min(7, parseInt(e.target.value) || 1)),
                })
              }
              required
              className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
            />
            <p className="text-xs text-gray-400">
              Enter the duration of the scenario (1-7 days)
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white border-none"
            size="lg"
            disabled={isGenerating}
          >
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

          {/* Reset Button */}
          {onReset && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-700 text-white-800 hover:bg-gray-800 hover:text-white bg-gray-700"
              onClick={handleReset}
            >
              Reset Configuration
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
