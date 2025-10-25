import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const StatRow = ({ label, value, colorClass = "text-gray-300" }: { label: string; value: string | number; colorClass?: string }) => (
  <div className="flex items-center justify-between text-xs">
    <span className={colorClass}>{label}</span>
    <span className="text-gray-400">{value}</span>
  </div>
);

const MetricsPanel: React.FC = () => {
  return (
    <aside className="h-screen w-80 bg-black text-white border-l border-gray-800 flex flex-col px-5 py-5 gap-5">
      {/* Mission Status */}
      <Card className="bg-transparent border border-gray-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm tracking-wide text-gray-200">MISSION STATUS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow label="Impact Score" value="0" />
          <Progress value={0} className="h-2 bg-gray-800" />
          <StatRow label="Status" value="CRITICAL" colorClass="text-red-400" />
          <Progress value={100} className="h-2 bg-gray-800" />
        </CardContent>
      </Card>

      {/* Agent Activity */}
      <Card className="bg-transparent border border-gray-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm tracking-wide text-gray-200">AGENT ACTIVITY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <StatRow label="HIGH" value={0} colorClass="text-blue-400" />
            <Progress value={0} className="h-2 bg-gray-800" />
            <StatRow label="MEDIUM" value={0} colorClass="text-gray-300" />
            <Progress value={0} className="h-2 bg-gray-800" />
            <StatRow label="LOW" value={0} colorClass="text-gray-500" />
            <Progress value={0} className="h-2 bg-gray-800" />
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card className="bg-transparent border border-gray-800/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm tracking-wide text-gray-200">FEEDBACK LIST (0)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">No feedback collected yet.</p>
        </CardContent>
      </Card>

      <Separator className="bg-gray-800" />

      {/* Analysis Input helper */}
      <div className="mt-auto text-xs text-gray-400 space-y-1">
        <div>Enter your idea to analyze against personas...</div>
        <div>199 Auth0 users loaded</div>
      </div>
    </aside>
  );
};

export default MetricsPanel;