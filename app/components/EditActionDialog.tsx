"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EOCAction } from '@/lib/utils/ttxGenerator';
import React, { useEffect, useState } from 'react';

const ACTION_TYPES = [
  'planning_meeting',
  'evacuation_order',
  'public_alert',
  'resource_allocation',
  'shelter_opening',
  'traffic_control',
  'medical_response',
];

const URGENCIES = ['voluntary', 'mandatory'];

export interface EditActionDialogProps {
  open: boolean;
  value: EOCAction | null;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: EOCAction) => void;
}

export function EditActionDialog({ open, value, onOpenChange, onSave }: EditActionDialogProps) {
  const [local, setLocal] = useState<EOCAction | null>(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-zinc-900 dark:text-zinc-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit EOC Action</DialogTitle>
          <DialogDescription>
            Modify the EOC action details below. Changes will be reflected in the final script.
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
              <label className="text-sm font-medium dark:text-zinc-300">Action Type</label>
              <Select value={local.actionType} onValueChange={(value) => setLocal({ ...local, actionType: value })}>
                <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="dark:text-zinc-200 dark:hover:bg-zinc-700">
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Urgency</label>
              <Select value={local.urgency || 'voluntary'} onValueChange={(value: any) => setLocal({ ...local, urgency: value })}>
                <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {URGENCIES.map((urgency) => (
                    <SelectItem key={urgency} value={urgency} className="dark:text-zinc-200 dark:hover:bg-zinc-700">
                      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Zone</label>
              <Input
                value={local.zone || ''}
                onChange={(e) => setLocal({ ...local, zone: e.target.value })}
                className="dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Details</label>
              <Textarea
                value={local.details}
                onChange={(e) => setLocal({ ...local, details: e.target.value })}
                rows={4}
                className="dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-zinc-300">Target Population</label>
              <Input
                value={local.targetPopulation}
                onChange={(e) => setLocal({ ...local, targetPopulation: e.target.value })}
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
