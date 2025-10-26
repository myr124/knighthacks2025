'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Loader2 } from 'lucide-react';
import { Conversation } from '@elevenlabs/client';
import type { PersonaResponse } from '@/lib/types/ttx';
import type { OperationalPeriod } from '@/lib/utils/ttxGenerator';

interface ElevenLabsCallModalProps {
  persona: PersonaResponse | null;
  actionContext: OperationalPeriod | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ElevenLabsCallModal({
  persona,
  actionContext,
  isOpen,
  onClose,
}: ElevenLabsCallModalProps) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Start conversation when modal opens
  useEffect(() => {
    if (!isOpen || !persona || !actionContext || !agentId) return;

    const startConversation = async () => {
      try {
        setStatus('connecting');
        setError(null);

        // Request microphone
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Start conversation
        const conv = await Conversation.startSession({
          agentId: agentId!,
          dynamicVariables: {
            persona: JSON.stringify(persona),
            actionContext: JSON.stringify(actionContext),
          },
          onConnect: () => {
            console.log('✅ Connected to agent');
            setStatus('connected');
          },
          onDisconnect: () => {
            console.log('📵 Disconnected');
            setStatus('idle');
          },
          onError: (err) => {
            console.error('❌ Error:', err);
            setError(err.message || 'Connection error');
            setStatus('error');
          },
        });

        setConversation(conv);
      } catch (err: any) {
        console.error('Failed to start:', err);
        setError(err.message || 'Failed to start conversation');
        setStatus('error');
      }
    };

    startConversation();

    return () => {
      if (conversation) {
        conversation.endSession();
      }
    };
  }, [isOpen, persona, actionContext, agentId]);

  const handleClose = async () => {
    if (conversation && status === 'connected') {
      await conversation.endSession();
    }
    setConversation(null);
    setStatus('idle');
    setError(null);
    onClose();
  };

  if (!agentId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Agent Not Configured</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-400">
            Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{persona?.personaName}</h3>
                <p className="text-xs text-gray-400">{persona?.personaType}</p>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center gap-4">
          {/* Status */}
          {status === 'connecting' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-sm text-gray-300">Connecting to agent...</p>
            </>
          )}

          {status === 'connected' && (
            <>
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-green-400 font-semibold">Connected - Speaking...</p>
              <p className="text-xs text-gray-400 text-center">
                Talk naturally with {persona?.personaName}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-red-400">Connection Failed</p>
              <p className="text-xs text-gray-400">{error}</p>
            </>
          )}
        </div>

        {/* Hang Up Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg
                   transition-all flex items-center justify-center gap-2"
        >
          <Phone className="h-4 w-4 rotate-135" />
          Hang Up
        </button>
      </DialogContent>
    </Dialog>
  );
}
