import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, Plus } from "lucide-react";

const Sidebar: React.FC = () => {
  return (
    <aside className="h-screen w-72 bg-black text-white flex flex-col border-r border-gray-800">
      {/* Top brand / breadcrumb */}
      <span className="px-5 py-6 text-2xl text-white">Emergent</span>

      <div className="px-5 pt-5 pb-3 flex items-center gap-2 text-sm text-gray-300">
        <span className="opacity-80">Emergency Research Engine</span>
      </div>

      <div className="px-5 py-2 space-y-6">
        {/* Create Session */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-gray-700 text-gray-100 bg-[#121212] hover:bg-[#1b1b1b]"
        >
          <Plus className="h-4 w-4" /> Create New Session
        </Button>

        {/* Analysis Sessions */}
        <Card className="bg-transparent border border-gray-700">
          <CardContent className="p-4">
            <div>
              <span className="text-[11px] uppercase tracking-wide text-gray-400 mb-2 block">Analysis Sessions</span>
              <div className="text-gray-500 text-sm">No sessions yet</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer status */}
      <div className="mt-auto px-5 pb-5 text-[12px] text-gray-400 space-y-1">
        <div>199 Auth0 users loaded</div>
        <div>No analysis running</div>
        <div className="pt-2 text-[11px] opacity-60">Version 2.1</div>
      </div>
    </aside>
  );
};

export default Sidebar;