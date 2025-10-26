"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigDialog } from "../components/ConfigDialog";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { emergencyPlanToScript } from "@/lib/utils/emergencyPlan";
import {
  loadLatestEmergencyPlan,
  loadPlanByKey,
} from "@/lib/utils/browserStorage";
import type { TTXScript } from "@/lib/utils/ttxGenerator";
import { ThemeToggle } from "../components/ThemeToggle";

export default function EditorPage() {
  const search = useSearchParams();
  const [title, setTitle] = useState<string>("");
  const [initialScript, setInitialScript] = useState<TTXScript | null>(null);

  useEffect(() => {
    const planKey = search.get("plan");
    if (!planKey) return;
    const plan =
      planKey === "latest" ? loadLatestEmergencyPlan() : loadPlanByKey(planKey);
    if (plan) {
      const script = emergencyPlanToScript(plan) as unknown as TTXScript;
      setInitialScript(script);
      setTitle(`${plan.scenarioType} - ${plan.location}`);
    }
  }, [search]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-8 relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        className="max-w-6xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cyan-500 hover:underline mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </motion.a>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <label className="block text-sm text-zinc-400 mb-2">
            Edit script template name
          </label>
          <Textarea
            className="w-full max-w-xl rounded-lg bg-zinc-900/50 border border-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-600/60 focus-visible:border-zinc-700 text-lg text-zinc-200 placeholder-zinc-500"
            placeholder="Hurricane Plan 10/25"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
          />
        </motion.div>

        <motion.div
          className="rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="p-6">
            <ConfigDialog
              initialScript={initialScript ?? undefined}
              startOnReview={!!initialScript}
              getSaveKey={() => title}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
