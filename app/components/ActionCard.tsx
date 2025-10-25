"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, CheckCircle, GripVertical } from "lucide-react";
import type { EOCAction } from "@/lib/utils/ttxGenerator";
import React from "react";
import { motion } from "framer-motion";

export interface ActionCardProps {
  action: EOCAction;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActionCard({ action, onEdit, onDelete }: ActionCardProps) {
  return (
    <motion.div
      className="p-3 border rounded-lg bg-accent/20 dark:bg-zinc-900 transition-shadow dark:border-zinc-800"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-2">
        <span
            className="text-zinc-500 dark:text-zinc-400 cursor-grab select-none mt-0.5"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        <div className="flex-1">
          
          <div className="flex items-center gap-2 mb-1 ml-2">
            <Badge
              variant="outline"
              className="text-xs dark:border-zinc-700 dark:text-zinc-300"
            >
              {action.time}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs capitalize dark:bg-zinc-800 dark:text-zinc-300"
            >
              {action.actionType.replace("_", " ")}
            </Badge>
            {action.actionType === "evacuation_order" && (
              <>
                <Badge
                  className={
                    action.urgency === "mandatory"
                      ? "bg-red-500 text-white dark:bg-red-700"
                      : "bg-yellow-500 text-white dark:bg-yellow-700"
                  }
                >
                  {action.urgency}
                </Badge>
                {action.zone && (
                  <Badge
                    variant="outline"
                    className="dark:border-zinc-700 dark:text-zinc-300"
                  >
                    {action.zone}
                  </Badge>
                )}
              </>
            )}
          </div>
          <p className="text-sm dark:text-zinc-300 -ml-2">{action.details}</p>
          <p className="text-xs text-muted-foreground mt-1 -ml-2 dark:text-zinc-400">
            Target: {action.targetPopulation}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="ml-2 dark:text-zinc-400"
            title="Edit"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="dark:text-zinc-400"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
