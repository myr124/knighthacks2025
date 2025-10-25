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
      <Button
          type="submit"
          className="text-sm bg-green-900 text-white px-4 py-3 rounded font-mono border border-gray-700 hover:bg-gray-800"
        >
          Start
        </Button>
    </div>
  );
};

export default ChatBox;
