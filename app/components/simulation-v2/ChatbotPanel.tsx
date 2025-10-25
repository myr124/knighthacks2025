
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  text: string;
  isUser: boolean;
}

export function ChatbotPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const aiSummaries = useTTXStoreV2((state) => state.aiSummaries);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ttx/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          periodNumber: currentPeriod,
          scenario,
          aiSummary: aiSummaries.get(currentPeriod),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = { text: data.reply, isUser: false };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const botMessage: Message = { text: 'Sorry, I had trouble getting a response.', isUser: false };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      const botMessage: Message = { text: 'Sorry, something went wrong.', isUser: false };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-4 py-2 rounded-lg max-w-xs ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {message.isUser ? (
                  message.text
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="text-secondary-foreground" {...props} />,
                      strong: ({ node, ...props }) => <strong className="text-foreground" {...props} />,
                    }}>
                    {message.text}
                  </ReactMarkdown>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-muted">
                Thinking...
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
