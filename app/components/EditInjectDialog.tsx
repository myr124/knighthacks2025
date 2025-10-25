"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Inject } from '@/lib/utils/ttxGenerator';
import React, { useEffect, useState } from 'react';

const INJECT_TYPES = [
  'weather_update',
  'emergency_alert',
  'recovery_update',
  'impact_report',
  'evacuation_notice',
  'resource_request',
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export interface EditInjectDialogProps {
  open: boolean;
  value: Inject | null;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Inject) => void;
}

export function EditInjectDialog({ open, value, onOpenChange, onSave }: EditInjectDialogProps) {
  const [local, setLocal] = useState<Inject | null>(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-zinc-900 dark:text-zinc-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inject</DialogTitle>
          <DialogDescription>
            Modify the inject details below. Changes will be reflected in the final script.
          </DialogDescription>
        </DialogHeader>
        {local && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Time (HHMM or HH:MM)</label>
              <Input
                value={local.time}
                onChange={(e) => setLocal({ ...local, time: e.target.value })}
                className="dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Type</label>
              <Select value={local.type} onValueChange={(value) => setLocal({ ...local, type: value })}>
                <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {INJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="dark:text-zinc-200 dark:hover:bg-zinc-700">
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Severity</label>
              <Select value={local.severity} onValueChange={(value: any) => setLocal({ ...local, severity: value })}>
                <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {SEVERITIES.map((severity) => (
                    <SelectItem key={severity} value={severity} className="dark:text-zinc-200 dark:hover:bg-zinc-700">
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Title</label>
              <Input
                value={local.title}
                onChange={(e) => setLocal({ ...local, title: e.target.value })}
                className="dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Description</label>
              <Textarea
                value={local.description}
                onChange={(e) => setLocal({ ...local, description: e.target.value })}
                rows={4}
                className="dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:border-zinc-700 dark:text-zinc-300">
            Cancel
          </Button>
          <Button onClick={() => local && onSave(local)} className="dark:bg-zinc-800 dark:text-white">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
