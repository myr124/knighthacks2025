import React from "react";
import { ConfigDialog } from "../components/ConfigDialog";
import { Textarea } from "@/components/ui/textarea";

export default function EditorPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-cyan-500 hover:underline mb-4"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
        </a>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Edit script template name</label>
          <Textarea
            className="w-full max-w-xl rounded-lg bg-zinc-900/50 border border-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-600/60 focus-visible:border-zinc-700 text-lg text-zinc-200 placeholder-zinc-500"
            placeholder="Hurricane Plan 10/25"
            rows={1}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm shadow-xl">
          <div className="p-6">
            <ConfigDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
