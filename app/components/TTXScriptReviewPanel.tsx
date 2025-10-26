"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Using a custom scroll container instead of ScrollArea to enable scrollspy
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  GripVertical,
  Loader2,
  MapPin,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import type {
  OperationalPeriod,
  Inject,
  EOCAction,
} from "@/lib/utils/ttxGenerator";
import { InjectCard } from "./InjectCard";
import { ActionCard } from "./ActionCard";
import { EditInjectDialog } from "./EditInjectDialog";
import { EditActionDialog } from "./EditActionDialog";
import { motion, AnimatePresence } from "framer-motion";
import { toEmergencyPlan } from "@/lib/utils/emergencyPlan";
import {
  saveLatestEmergencyPlan,
  savePlanByKey,
  saveTTXSession,
  loadTTXSession,
  type TTXSession,
} from "@/lib/utils/browserStorage";

interface TTXScriptReviewPanelProps {
  script: {
    scenarioType: string;
    location: string;
    severity: string;
    population: number;
    periods: (OperationalPeriod & {
      injects: Inject[];
      eocActions: EOCAction[];
    })[];
  };
  onSubmit: () => void;
  isSubmitting?: boolean;
  getSaveKey?: () => string | undefined;
  openPreviewTab?: () => void;
  onPreviewReady?: (text: string) => void;
  sessionId?: string; // TTX session ID for persisting edits
  onPreviewLoading?: (isLoading: boolean) => void; // Callback to notify parent of loading state
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const PHASE_COLORS: Record<string, string> = {
  planning: "bg-blue-500",
  preparation: "bg-yellow-500",
  response: "bg-red-500",
  recovery: "bg-green-500",
};

export function TTXScriptReviewPanel({
  script,
  onSubmit,
  isSubmitting = false,
  getSaveKey,
  openPreviewTab,
  onPreviewReady,
  sessionId,
  onPreviewLoading,
}: TTXScriptReviewPanelProps) {
  const [editingInject, setEditingInject] = useState<Inject | null>(null);
  const [editingInjectInfo, setEditingInjectInfo] = useState<{
    periodIdx: number;
    index: number;
  } | null>(null);
  const [editingAction, setEditingAction] = useState<EOCAction | null>(null);
  const [localScript, setLocalScript] = useState(script);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [draggingType, setDraggingType] = useState<"inject" | "action" | null>(
    null
  );
  const [dragOverIdx, setDragOverIdx] = useState<{
    periodIdx: number;
    injectIdx: number;
  } | null>(null);
  const draggingInjectRef = useRef<{ periodIdx: number; index: number } | null>(
    null
  );
  const [isReorderingInject, setIsReorderingInject] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewBlockRef = useRef<HTMLDivElement | null>(null);
  const previewTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Helper function to save script edits to TTX session
  const saveEditToSession = (updatedScript: typeof localScript) => {
    if (!sessionId) return; // No session to save to
    try {
      const session = loadTTXSession(sessionId);
      if (session) {
        const updatedSession: TTXSession = {
          ...session,
          script: updatedScript,
          updatedAt: new Date().toISOString(),
        };
        saveTTXSession(sessionId, updatedSession);
      }
    } catch (e) {
      console.error("Failed to save edit to session:", e);
    }
  };

  const generatePreview = async (): Promise<string> => {
    setIsPreviewLoading(true);
    onPreviewLoading?.(true); // Notify parent of loading state
    setPreviewError(null);
    try {
      const res = await fetch("/api/ttx/augment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: localScript }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed with status ${res.status}`);
      }
      const data = await res.json();
      if (data?.script) {
        setLocalScript(data.script);
      }
      const text = data?.previewText || JSON.stringify(localScript, null, 2);
      setPreviewText(text);
      onPreviewReady?.(text);
      return text;
    } catch (e: any) {
      setPreviewError(e?.message || "Failed to generate preview");
      onPreviewReady?.(previewText);
      return previewText;
    } finally {
      setIsPreviewLoading(false);
      onPreviewLoading?.(false); // Notify parent that loading is done
    }
  };

  const handleExport = () => {
    try {
      const plan = toEmergencyPlan(localScript as any);
      const blob = new Blob([JSON.stringify(plan, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "emergency_plan.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export plan JSON:", e);
    }
  };

  const handleSaveAndExit = () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const plan = toEmergencyPlan(localScript as any);
      const key = getSaveKey?.()?.trim();
      if (key) {
        savePlanByKey(key, plan);
      }
      saveLatestEmergencyPlan(plan);
      setLastSavedAt(new Date());
    } catch (e: any) {
      console.error("Failed to persist plan to browser storage:", e);
      setSaveError(e?.message || "Failed to save to browser storage");
    } finally {
      setIsSaving(false);
    }
    // Close editor (parent handles persisting previewText and navigation)
    onSubmit();
  };

  const handleGenerateFullScript = async () => {
    // Save current JSON to session before generating text

    try {
      const plan = toEmergencyPlan(localScript as any);
      const key = getSaveKey?.()?.trim();
      if (key) {
        savePlanByKey(key, plan);
      }
      saveLatestEmergencyPlan(plan);
      setLastSavedAt(new Date());
    } catch (e) {
      console.error("Failed saving before preview generation:", e);
    }

    if (typeof openPreviewTab === "function") {
      openPreviewTab();
    }

    await generatePreview();

    setTimeout(() => {
      previewBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      previewTextareaRef.current?.focus();
    }, 50);
  };

  // keep local copy in sync if parent updates
  useEffect(() => {
    setLocalScript(script);
  }, [script]);

  const handleEditInject = (
    inject: Inject,
    periodIdx: number,
    index: number
  ) => {
    setEditingInject({ ...inject });
    setEditingInjectInfo({ periodIdx, index });
  };

  const handleEditAction = (action: EOCAction) => {
    setEditingAction({ ...action });
  };
  const handleJumpTo = (index: number) => {
    const container = contentRef.current;
    const el = itemRefs.current[index];
    if (container && el) {
      container.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
    }
    setActiveIdx(index);
  };

  // Scrollspy highlight based on container scroll position
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const onScroll = () => {
      const tops = itemRefs.current.map((el) =>
        el ? el.offsetTop : Number.POSITIVE_INFINITY
      );
      const scrollTop = container.scrollTop + 16; // small offset
      let idx = 0;
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= scrollTop) idx = i;
      }
      setActiveIdx(idx);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [script.periods.length]);

  const totalInjects = localScript.periods.reduce(
    (sum, p) => sum + p.injects.length,
    0
  );
  const totalActions = localScript.periods.reduce(
    (sum, p) => sum + p.eocActions.length,
    0
  );
  const tabLabels = localScript.periods.map((_, idx) => `t-${idx * 12}`);

  // Quick add helpers
  const addTemplateInject = (periodIdx: number) => {
    const tmp: Inject = {
      id: `tmp-inj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: "00:00",
      severity: "medium",
      type: "weather_update",
      title: "New Inject",
      description: "Describe the inject details...",
    } as Inject;
    setLocalScript((prev) => {
      const periods = [...prev.periods];
      periods[periodIdx] = {
        ...periods[periodIdx],
        injects: [tmp, ...periods[periodIdx].injects],
      };
      const updated = { ...prev, periods };
      saveEditToSession(updated);
      return updated;
    });
  };
  // Reorder helpers for injects
  const reorderInject = (
    periodIdx: number,
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return;
    setLocalScript((prev) => {
      const periods = [...prev.periods];
      const injects = [...periods[periodIdx].injects];
      const [moved] = injects.splice(fromIndex, 1);
      const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      injects.splice(insertAt, 0, moved);
      periods[periodIdx] = { ...periods[periodIdx], injects };
      const updated = { ...prev, periods };
      saveEditToSession(updated);
      return updated;
    });
  };

  const parseTimeToMinutes = (t: string): number => {
    if (!t) return 0;
    const cleaned = t.replace(/[^0-9]/g, "");
    if (cleaned.length >= 3) {
      const h = parseInt(cleaned.slice(0, -2));
      const m = parseInt(cleaned.slice(-2));
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    }
    const hOnly = parseInt(cleaned);
    return (isNaN(hOnly) ? 0 : hOnly) * 60;
  };
  const addTemplateAction = (periodIdx: number) => {
    const tmp: EOCAction = {
      id: `tmp-act-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: "00:00",
      actionType: "public_alert",
      details: "Describe the action...",
      targetPopulation: "TBD",
      urgency: "voluntary",
      zone: "Zone",
    } as EOCAction;
    setLocalScript((prev) => {
      const periods = [...prev.periods];
      periods[periodIdx] = {
        ...periods[periodIdx],
        eocActions: [tmp, ...periods[periodIdx].eocActions],
      };
      const updated = { ...prev, periods };
      saveEditToSession(updated);
      return updated;
    });
  };
  const deleteInject = (periodIdx: number, index: number) => {
    setLocalScript((prev) => {
      const periods = [...prev.periods];
      const injects = [...periods[periodIdx].injects];
      injects.splice(index, 1);
      periods[periodIdx] = { ...periods[periodIdx], injects };
      const updated = { ...prev, periods };
      saveEditToSession(updated);
      return updated;
    });
  };
  const deleteAction = (periodIdx: number, index: number) => {
    setLocalScript((prev) => {
      const periods = [...prev.periods];
      const actions = [...periods[periodIdx].eocActions];
      actions.splice(index, 1);
      periods[periodIdx] = { ...periods[periodIdx], eocActions: actions };
      const updated = { ...prev, periods };
      saveEditToSession(updated);
      return updated;
    });
  };

  return (
    <div className="flex grow gap-4">
      {/* Left tab navigation */}
      <motion.div
        className="sticky top-4 self-start w-44 shrink-0 bg-background dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg p-3 h-fit"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
          Jump To
        </div>
        <div className="flex flex-col gap-1">
          {tabLabels.map((label, idx) => (
            <button
              key={label}
              onClick={() => handleJumpTo(idx)}
              className={`text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                activeIdx === idx
                  ? "bg-accent/60 dark:bg-zinc-800 text-foreground dark:text-white"
                  : "text-muted-foreground dark:text-zinc-300 hover:bg-accent/40 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t dark:border-zinc-800">
          <div className="text-xs uppercase tracking-wide text-zinc-400 mb-3">
            Quick Actions
          </div>
          <div className="flex flex-col gap-2">
            <motion.button
              draggable
              onDragStartCapture={(e: React.DragEvent) => {
                setDraggingType("inject");
                e.dataTransfer.setData("text/plain", "inject");
              }}
              onDragEndCapture={() => setDraggingType(null)}
              className="group relative px-3 py-2.5 rounded-lg text-xs font-semibold bg-linear-to-br from-cyan-900/50 to-cyan-900/30 text-cyan-200 border border-cyan-600/60 hover:from-cyan-800/60 hover:to-cyan-800/40 hover:border-cyan-500 transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-cyan-900/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Inject</span>
              <span className="text-[10px] ml-auto opacity-70 group-hover:opacity-100">
                (drag)
              </span>
            </motion.button>
            <motion.button
              draggable
              onDragStartCapture={(e: React.DragEvent) => {
                setDraggingType("action");
                e.dataTransfer.setData("text/plain", "action");
              }}
              onDragEndCapture={() => setDraggingType(null)}
              className="group relative px-3 py-2.5 rounded-lg text-xs font-semibold bg-linear-to-br from-emerald-900/50 to-emerald-900/30 text-emerald-200 border border-emerald-600/60 hover:from-emerald-800/60 hover:to-emerald-800/40 hover:border-emerald-500 transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-emerald-900/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>New Action</span>
              <span className="text-[10px] ml-auto opacity-70 group-hover:opacity-100">
                (drag)
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-background dark:bg-[#18181b] border dark:border-zinc-800">
          <CardContent>
            {/* Scenario Summary */}
            <motion.div
              className="mb-6 p-4 bg-accent/50 dark:bg-zinc-900 rounded-lg space-y-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg capitalize text-foreground dark:text-white">
                  {script.scenarioType} Scenario
                </h3>
                <Badge className="capitalize dark:bg-zinc-800 dark:text-white">
                  {script.severity}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  <span className="dark:text-zinc-300">{script.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  <span className="dark:text-zinc-300">
                    {script.population.toLocaleString()} population
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm pt-2 border-t dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  <span className="dark:text-zinc-300">
                    {script.periods.length} Operational Periods
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  <span className="dark:text-zinc-300">
                    {totalInjects} Injects
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  <span className="dark:text-zinc-300">
                    {totalActions} EOC Actions
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Periods */}
            <div ref={contentRef} className="h-[500px] pr-4 overflow-y-auto">
              <Accordion
                type="multiple"
                defaultValue={localScript.periods.map((p) => p.id)}
                className="space-y-2"
              >
                {localScript.periods.map((period, idx) => (
                  <AccordionItem
                    key={period.id}
                    value={period.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    className="border rounded-lg px-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge
                          className={`${
                            PHASE_COLORS[period.phase]
                          } text-white dark:bg-zinc-800 dark:text-white`}
                        >
                          {tabLabels[idx]}
                        </Badge>
                        {/* <span className="font-medium dark:text-zinc-200">{period.label}</span> */}
                        <Badge
                          variant="outline"
                          className="capitalize dark:border-zinc-700 dark:text-zinc-300"
                        >
                          {period.phase}
                        </Badge>
                        <div className="flex items-center gap-2 ml-auto mr-2">
                          <Badge
                            variant="secondary"
                            className="dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {period.injects.length} injects
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {period.eocActions.length} actions
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {/* Injects */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const t = e.dataTransfer.getData("text/plain");
                          if (t === "inject") addTemplateInject(idx);
                        }}
                        className={`rounded-md ${
                          draggingType === "inject"
                            ? "ring-1 ring-cyan-600/60"
                            : ""
                        }`}
                      >
                        {period.injects.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 dark:text-zinc-200">
                              <AlertTriangle className="h-4 w-4 dark:text-yellow-400" />
                              Injects
                            </h4>
                            <div className="space-y-2">
                              <AnimatePresence mode="popLayout">
                                {period.injects.map((inject, i) => (
                                  <InjectCard
                                    key={inject.id}
                                    inject={inject}
                                    onEdit={() =>
                                      handleEditInject(inject, idx, i)
                                    }
                                    onDelete={() => deleteInject(idx, i)}
                                    isDragOver={
                                      dragOverIdx?.periodIdx === idx &&
                                      dragOverIdx?.injectIdx === i
                                    }
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.effectAllowed = "move";
                                      e.dataTransfer.setData(
                                        "text/plain",
                                        "reorder-inject"
                                      );
                                      draggingInjectRef.current = {
                                        periodIdx: idx,
                                        index: i,
                                      };
                                      setIsReorderingInject(true);
                                    }}
                                    onDragOver={(e) => {
                                      if (isReorderingInject) {
                                        e.preventDefault();
                                        setDragOverIdx({
                                          periodIdx: idx,
                                          injectIdx: i,
                                        });
                                      }
                                    }}
                                    onDrop={(e) => {
                                      const type =
                                        e.dataTransfer.getData("text/plain");
                                      if (type === "reorder-inject") {
                                        const info = draggingInjectRef.current;
                                        if (info && info.periodIdx === idx) {
                                          reorderInject(idx, info.index, i);
                                        }
                                        draggingInjectRef.current = null;
                                        setIsReorderingInject(false);
                                      }
                                      setDragOverIdx(null);
                                    }}
                                    onDragEnd={() => {
                                      setIsReorderingInject(false);
                                      setDragOverIdx(null);
                                      draggingInjectRef.current = null;
                                    }}
                                  />
                                ))}
                              </AnimatePresence>
                              {/* end drop zone to place item at end */}
                              <div
                                onDragOver={(e) => {
                                  if (isReorderingInject) e.preventDefault();
                                }}
                                onDrop={(e) => {
                                  const type =
                                    e.dataTransfer.getData("text/plain");
                                  if (type === "reorder-inject") {
                                    const info = draggingInjectRef.current;
                                    if (info && info.periodIdx === idx) {
                                      reorderInject(
                                        idx,
                                        info.index,
                                        period.injects.length
                                      );
                                    }
                                    draggingInjectRef.current = null;
                                    setIsReorderingInject(false);
                                  }
                                }}
                                className="h-3"
                              />
                            </div>
                          </div>
                        )}
                        {period.injects.length === 0 && (
                          <div
                            className={`p-3 border border-dashed rounded-md text-xs text-zinc-400 dark:border-zinc-700 ${
                              draggingType === "inject" ? "bg-cyan-900/10" : ""
                            }`}
                          >
                            Drag a "New Inject" here to create one
                          </div>
                        )}
                      </div>

                      {/* EOC Actions */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const t = e.dataTransfer.getData("text/plain");
                          if (t === "action") addTemplateAction(idx);
                        }}
                        className={`rounded-md ${
                          draggingType === "action"
                            ? "ring-1 ring-emerald-600/60"
                            : ""
                        }`}
                      >
                        {period.eocActions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 dark:text-zinc-200">
                              <CheckCircle className="h-4 w-4 dark:text-green-400" />
                              EOC Actions
                            </h4>
                            <div className="space-y-2">
                              <AnimatePresence mode="popLayout">
                                {period.eocActions.map((action, ai) => (
                                  <ActionCard
                                    key={action.id}
                                    action={action}
                                    onEdit={() => handleEditAction(action)}
                                    onDelete={() => deleteAction(idx, ai)}
                                  />
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                        {period.eocActions.length === 0 && (
                          <div
                            className={`p-3 border border-dashed rounded-md text-xs text-zinc-400 dark:border-zinc-700 ${
                              draggingType === "action"
                                ? "bg-emerald-900/10"
                                : ""
                            }`}
                          >
                            Drag a "New Action" here to create one
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Text Preview (Editable) */}

            {/* Save & Exit */}
            <div className="mt-6 pt-6 border-t dark:border-zinc-800 flex gap-2">
              <Button
                onClick={handleSaveAndExit}
                className="w-full dark:bg-zinc-800 dark:text-white"
                size="lg"
                disabled={isSubmitting || isSaving}
              >
                {isSubmitting || isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSubmitting ? "Saving" : "Saving to Browser"}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {lastSavedAt ? "Saved" : "Save Script"}
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerateFullScript}
                className="w-full dark:bg-indigo-800 dark:text-white bg-indigo-700"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Your Script...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Full Script
                  </>
                )}
              </Button>
            </div>
            {(lastSavedAt || saveError) && (
              <div
                className="mt-2 text-xs text-muted-foreground dark:text-zinc-400"
                aria-live="polite"
              >
                {saveError ? (
                  <span className="text-red-500">{saveError}</span>
                ) : (
                  <span>
                    Saved to session at {lastSavedAt?.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Inject Dialog */}
      <EditInjectDialog
        open={!!editingInject}
        value={editingInject}
        onOpenChange={(open) => {
          if (!open) {
            setEditingInject(null);
            setEditingInjectInfo(null);
          }
        }}
        onSave={(updated) => {
          if (editingInjectInfo) {
            setLocalScript((prev) => {
              const periods = [...prev.periods];
              const injects = [...periods[editingInjectInfo.periodIdx].injects];
              injects[editingInjectInfo.index] = {
                ...injects[editingInjectInfo.index],
                ...updated,
              } as Inject;
              injects.sort(
                (a, b) =>
                  parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
              );
              periods[editingInjectInfo.periodIdx] = {
                ...periods[editingInjectInfo.periodIdx],
                injects,
              };
              const updatedScript = { ...prev, periods };
              // Save edit to session
              saveEditToSession(updatedScript);
              return updatedScript;
            });
          }
          setEditingInject(null);
          setEditingInjectInfo(null);
        }}
      />

      {/* Edit Action Dialog */}
      <EditActionDialog
        open={!!editingAction}
        value={editingAction}
        onOpenChange={(open) => {
          if (!open) setEditingAction(null);
        }}
        onSave={(updated) => {
          // Find and replace the action in the local script
          setLocalScript((prev) => {
            const periods = prev.periods.map((p) => ({
              ...p,
              eocActions: p.eocActions.map((a) =>
                a.id === updated.id ? { ...a, ...updated } : a
              ),
            }));
            const updatedScript = { ...prev, periods };
            saveEditToSession(updatedScript);
            return updatedScript;
          });
          setEditingAction(null);
        }}
      />
    </div>
  );
}
