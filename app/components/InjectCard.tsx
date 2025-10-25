"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import type { Inject } from '@/lib/utils/ttxGenerator';
import React from 'react';
import { motion } from 'framer-motion';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export interface InjectCardProps {
  inject: Inject;
  onEdit: () => void;
  onDelete: () => void;
  // Optional DnD props to keep behavior in parent
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragOver?: boolean;
}

export function InjectCard({ inject, onEdit, onDelete, draggable, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }: InjectCardProps) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      transition={{ duration: 0.2 }}
    >
      {/* Insertion line */}
      {isDragOver && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0 -my-1 z-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <motion.div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`p-3 border rounded-lg bg-background dark:bg-zinc-900 transition-all dark:border-zinc-800 ${
          isDragOver ? 'border-cyan-500/60 shadow-lg shadow-cyan-900/30 bg-cyan-950/20' : 'border-zinc-800'
        }`}
        whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
        whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-zinc-500 dark:text-zinc-400 cursor-grab select-none mt-0.5" title="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs dark:border-zinc-700 dark:text-zinc-300">
                {inject.time}
              </Badge>
              <Badge className={`${SEVERITY_COLORS[inject.severity]} text-white text-xs dark:bg-zinc-800 dark:text-white`}>
                {inject.severity}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize dark:bg-zinc-800 dark:text-zinc-300">
                {inject.type.replace('_', ' ')}
              </Badge>
            </div>
            {/* title */}
            <h5 className="font-medium text-sm dark:text-zinc-200 -ml-4 mt-1">{inject.title}</h5>
          </div>
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
      <p className="text-sm text-muted-foreground dark:text-zinc-400 ml-2">{inject.description}</p>
    </motion.div>
    </motion.div>
  );
}
