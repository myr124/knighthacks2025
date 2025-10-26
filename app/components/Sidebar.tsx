'use client'
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2 } from "lucide-react";

interface SidebarProps {
  selectedPlan: any;
  setSelectedPlan: (plan: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedPlan, setSelectedPlan }) => {
  // No dialog state needed; we navigate to the editor to load saved sessions


  const [planTitles, setPlanTitles] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import to avoid SSR issues
      import('@/lib/utils/browserStorage').then(mod => {
        setPlanTitles(mod.listSavedPlanKeys());
      });
    }
  }, []);

  return (
    <aside className="h-screen w-72 bg-black text-white flex flex-col border-r border-gray-800">
      {/* Top brand / breadcrumb */}

      <div className="px-5 pt-5 pb-3 flex items-center gap-2 text-sm text-gray-300">
        <span className="opacity-80">Generate Emergency Plan</span>
      </div>

      <div className="px-5 py-2 space-y-6">
        {/* Create Session */}
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full border-gray-800 bg-black hover:bg-linear-to-r hover:from-gray-700 hover:to-gray-900 hover:text-white transition-all duration-200"
            onClick={() => window.location.href = '/editor'}
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
                    // Load plan data from sessionStorage
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
                  <button
                    className="ml-2 p-1 rounded hover:bg-gray-800"
                    title="Edit session"
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/editor?plan=${encodeURIComponent(title)}&edit=true`;
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-gray-400" />
                  </button>
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