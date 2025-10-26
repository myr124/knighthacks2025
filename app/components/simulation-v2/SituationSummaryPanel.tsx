"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTTXStoreV2 } from "@/lib/stores/ttxStoreV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Send, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GeminiLoadingAnimation } from './GeminiLoadingAnimation';
import { TypewriterText } from './TypewriterText';

interface Message {
  text: string;
  isUser: boolean;
}

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const getMockSummary = (period: number) => {
  if (period < 4) {
    return "The hurricane is currently a distant threat. Initial public awareness campaigns are underway, and most of the population remains calm. Key infrastructure is operating normally.";
  }
  if (period < 8) {
    return "The hurricane track is becoming clearer, prompting voluntary evacuations for coastal areas. We are seeing a slight increase in traffic and fuel consumption. Public sentiment is shifting from calm to concerned.";
  }
  if (period < 10) {
    return "Mandatory evacuations have been issued for multiple zones as the hurricane strengthens. Contraflow on major highways has been activated. Shelters are open and receiving evacuees. Critical issues include rising numbers of residents needing assistance and some refusing to evacuate.";
  }
  return "The hurricane is making landfall. All remaining residents have been advised to shelter in place. The EOC is now in full response mode, dealing with immediate life-safety issues.";
};

export function SituationSummaryPanel() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const aiSummaries = useTTXStoreV2((state) => state.aiSummaries);
  const isGeneratingSummaries = useTTXStoreV2((state) => state.isGeneratingSummaries);
  const generateSummaryForPeriod = useTTXStoreV2((state) => state.generateSummaryForPeriod);

  const [activeTab, setActiveTab] = useState("summary");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!scenario) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Situation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const currentResult = scenario.periodResults[currentPeriod - 1];

  // Safety check for undefined currentResult
  if (!currentResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            AI Situation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading situation data...</p>
        </CardContent>
      </Card>
    );
  }

  const aggregates = currentResult.aggregates;
  const operationalPeriod = currentResult.operationalPeriod;
  const summary = aiSummaries.get(currentPeriod);

  const handleGenerateSummary = () => {
    generateSummaryForPeriod(currentPeriod);
  };

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
    <Card className="h-full flex flex-col bg-background">
      <CardHeader className="pb-2">
        <motion.div
          key={`header-${currentPeriod}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CardTitle className="text-lg font-bold">Situation Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            {operationalPeriod.label}
          </p>
        </motion.div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <motion.div
            className="border-b px-4 py-2 shrink-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "summary" && (
              <motion.div
                key="summary"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-hidden"
              >
                <TabsContent value="summary" className="m-0 h-full p-4 flex flex-col">
                  {isGeneratingSummaries ? (
                    <GeminiLoadingAnimation />
                  ) : summary ? (
                    <motion.div
                      key={`summary-content-${currentPeriod}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="flex-1 flex flex-col min-h-0"
                    >
                      <ScrollArea className="flex-1 w-full rounded-md border">
                        <div className="p-4 prose prose-invert max-w-none">
                          <TypewriterText text={summary} speed={150}>
                            {(displayText) => (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-foreground" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-foreground" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-md font-semibold text-foreground" {...props} />,
                                  p: ({ node, ...props }) => <p className="text-secondary-foreground" {...props} />,
                                  strong: ({ node, ...props }) => <strong className="text-foreground" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc list-inside" {...props} />,
                                  li: ({ node, ...props }) => <li className="text-secondary-foreground" {...props} />,
                                }}>
                                {displayText}
                              </ReactMarkdown>
                            )}
                          </TypewriterText>
                        </div>
                      </ScrollArea>
                    </motion.div>
                  ) : (
                    <Button onClick={handleGenerateSummary} disabled={isGeneratingSummaries}>
                      Generate Summary
                    </Button>
                  )}
                </TabsContent>
              </motion.div>
            )}
            {activeTab === "chat" && (
              <motion.div
                key="chat"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-hidden"
              >
                <TabsContent value="chat" className="m-0 h-full p-4 flex flex-col">
                  <ScrollArea className="flex-1 mb-4 rounded-md border p-3">
                    <div className="space-y-3">
                      {messages.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                          Ask questions about the situation summary
                        </p>
                      )}
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {message.isUser ? (
                              message.text
                            ) : (
                              <TypewriterText text={message.text} speed={120}>
                                {(displayText) => (
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ node, ...props }) => <p className="text-secondary-foreground" {...props} />,
                                      strong: ({ node, ...props }) => <strong className="text-foreground" {...props} />,
                                    }}>
                                    {displayText}
                                  </ReactMarkdown>
                                )}
                              </TypewriterText>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start">
                          <div className="px-3 py-2 rounded-lg bg-muted text-sm flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 48 48"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <motion.path
                                  d="M24 4L26.472 17.528L36.728 11.272L30.472 21.528L44 24L30.472 26.472L36.728 36.728L26.472 30.472L24 44L21.528 30.472L11.272 36.728L17.528 26.472L4 24L17.528 21.528L11.272 11.272L21.528 17.528L24 4Z"
                                  fill="url(#gradient-chat)"
                                  animate={{
                                    opacity: [0.8, 1, 0.8],
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                />
                                <defs>
                                  <linearGradient id="gradient-chat" x1="4" y1="4" x2="44" y2="44">
                                    <stop offset="0%" stopColor="#4285f4" />
                                    <stop offset="33%" stopColor="#9b72cb" />
                                    <stop offset="66%" stopColor="#d96570" />
                                    <stop offset="100%" stopColor="#f2a746" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </motion.div>
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
                      placeholder="Ask a question about the summary..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}
