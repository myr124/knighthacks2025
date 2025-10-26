'use client'
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, Plus, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScenarioConfigForm } from "./ScenarioConfigForm"
import { TTXScriptReviewPanel } from "./TTXScriptReviewPanel"
import type { ScenarioConfig, Inject, EOCAction, OperationalPeriod } from '@/lib/utils/ttxGenerator';
import { ConfigDialog } from "./ConfigDialog"

interface SidebarProps {
  selectedPlan: any;
  setSelectedPlan: (plan: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedPlan, setSelectedPlan }) => {
  // Dialog state removed; navigation used for new plan creation


  const [planTitles, setPlanTitles] = useState<string[]>([]);

  // Helper to refresh plan titles from sessionStorage
  const refreshPlanTitles = () => {
    if (typeof window !== 'undefined') {
      import('@/lib/utils/browserStorage').then(mod => {
        setPlanTitles(mod.listSavedPlanKeys());
      });
    }
  };

  useEffect(() => {
    refreshPlanTitles();
  }, []);

  return (
    <aside className="h-screen w-72 bg-black text-white flex flex-col border-r border-gray-800">
      {/* Top brand / breadcrumb */}
      <span className="px-5 py-6 text-2xl text-white">Emergent</span>

      <div className="px-5 pt-5 pb-3 flex items-center gap-2 text-sm text-gray-300">
        <span className="opacity-80">Generate Emergency Plan</span>
      </div>

      <div className="px-5 py-2 space-y-6">
        {/* Create Session */}
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full border-gray-800 bg-black hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-900 hover:text-white transition-all duration-200"
            onClick={() => { window.location.href = '/editor?new=true'; }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Session
          </Button>
        </div>

        {/* Saved Sessions List */}
        {planTitles.length === 0 ? (
          <div className="text-xs text-gray-500 mt-4">No saved sessions yet.</div>
        ) : (
          planTitles.map(title => {
            const isSelected = selectedPlan && selectedPlan.title === title;
            return (
              <Card
                key={title}
                className={`bg-transparent border transition mb-2 ${isSelected ? 'border-green-500' : 'border-gray-700'} cursor-pointer`}
                onClick={() => {
                  if (selectedPlan && selectedPlan.title === title) {
                    setSelectedPlan(null);
                  } else {
                    import('@/lib/utils/browserStorage').then(mod => {
                      const plan = mod.loadPlanByKey(title);
                      setSelectedPlan({ ...plan, title });
                    });
                  }
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <span
                    className="flex-1 text-left cursor-default"
                    style={{ display: 'block' }}
                  >
                    <span className="text-[11px] uppercase tracking-wide text-gray-400 mb-2 block">{title}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-gray-800"
                      title="Edit session"
                      onClick={e => {
                        e.stopPropagation();
                        window.location.href = `/editor?plan=${encodeURIComponent(title)}&edit=true`;
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-red-900"
                      title="Delete session"
                      onClick={async e => {
                        e.stopPropagation();
                        const mod = await import('@/lib/utils/browserStorage');
                        mod.deletePlanByKey(title);
                        if (selectedPlan && selectedPlan.title === title) {
                          setSelectedPlan(null);
                        }
                        refreshPlanTitles();
                      }}
                    >
                      {/* Simple trash icon using SVG for minimal dependency */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Footer status */}
      <div className="mt-auto px-5 pb-5 text-[12px] text-gray-400 space-y-1">
        <div>All rights reserved</div>
        <div className="pt-2 text-[11px] opacity-60">Version 1.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;