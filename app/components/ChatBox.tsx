'use client'
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
    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
      <div className="w-full max-w-md mb-8 bg-black/80 rounded-xl shadow-lg border border-gray-800 p-4 pointer-events-auto">
        <div className="mb-3 max-h-40 overflow-y-auto space-y-2">
          {messages.map((msg, idx) => (
            <div key={idx} className="text-gray-200 text-sm bg-gray-900 rounded px-3 py-2">{msg}</div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          {/* Replace input with shadcn textarea */}
          <Textarea
            className="flex-1 bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            placeholder="Type your prompt..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            autoFocus
            rows={2}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
