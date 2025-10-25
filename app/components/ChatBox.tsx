'use client'
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";

const ChatBox: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setMessages([...messages, prompt]);
      setPrompt("");
    }
  };

  return (
    <div className="absolute left-0 right-0 bottom-10 flex items-end justify-center pointer-events-none">
      <form
        onSubmit={handleSend}
        className="w-full max-w-xl bg-black/80 rounded-xl shadow-lg border border-gray-800 p-4 flex items-center gap-4 pointer-events-auto"
      >
        <input
          type="text"
          className="flex-1 bg-transparent text-white font-mono text-sm border-none outline-none px-2 py-2"
          placeholder="ai agents for fraud detection"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          autoFocus
        />
        <Button
          type="submit"
          className="text-sm bg-gray-900 text-white px-4 py-3 rounded font-mono border border-gray-700 hover:bg-gray-800"
        >
          Analyze
        </Button>
      </form>
    </div>
  );
};

export default ChatBox;
