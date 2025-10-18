import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Sparkles, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Goal } from "@/types/goal";
import { SalaryEvent, SalaryRule } from "@/types/salary";
import { GoalAllocationDialog } from "./GoalAllocationDialog";

type TextMessage = {
  id: string;
  role: "user" | "assistant";
  kind: "text";
  content: string;
};

type SalarySuggestionMessage = {
  id: string;
  role: "assistant";
  kind: "salary-suggestion";
  event: SalaryEvent;
  suggestedPercent: number;
  rule: SalaryRule;
};

type Message = TextMessage | SalarySuggestionMessage;

interface ChatAssistantProps {
  goals: Goal[];
  onContribute: (goalId: string, amount: number, date: string) => void;
}

export const ChatAssistant = ({ goals, onContribute }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      kind: "text",
      content: "Здравствуйте! Я — ваш финансовый ассистент Zaman. Чем могу помочь?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allocationDialog, setAllocationDialog] = useState<{
    open: boolean;
    amount: number;
    percent: number;
    goalId?: string;
  }>({ open: false, amount: 0, percent: 10 });

  // Anti-spam protection for Salary Insight
  const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
  const lastSalaryTriggerRef = React.useRef(0);
  const shownForThisTurnRef = React.useRef(false);

  const quickPrompts = [
    "Как накопить на квартиру?",
    "Посчитай расходы за месяц",
    "Подбери депозит",
    "Планирование хаджа",
  ];

  const getSalaryRule = (): SalaryRule => {
    try {
      const stored = localStorage.getItem("zaman.salaryRule");
      return stored ? JSON.parse(stored) : { enabled: false, percent: 10 };
    } catch {
      return { enabled: false, percent: 10 };
    }
  };

  const canTriggerSalary = (): boolean => {
    return Date.now() - lastSalaryTriggerRef.current >= COOLDOWN_MS;
  };

  const maybeShowSalaryInsight = (amount: number) => {
    if (!canTriggerSalary() || shownForThisTurnRef.current) return;
    
    shownForThisTurnRef.current = true;
    lastSalaryTriggerRef.current = Date.now();

    const rule = getSalaryRule();
    const newMessage: SalarySuggestionMessage = {
      id: `salary-${Date.now()}`,
      role: "assistant",
      kind: "salary-suggestion",
      event: {
        amount,
        date: new Date().toISOString(),
        source: "salary",
      },
      suggestedPercent: rule.enabled ? rule.percent : 10,
      rule,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSimulateSalary = () => {
    maybeShowSalaryInsight(250000);
  };

  const handleSalaryMessageClick = (msg: SalarySuggestionMessage) => {
    setAllocationDialog({
      open: true,
      amount: msg.event.amount,
      percent: msg.suggestedPercent,
      goalId: msg.rule.goalId,
    });
  };

  const handleConfirmAllocation = (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    onContribute(goalId, amount, new Date().toISOString());

    const confirmMsg: TextMessage = {
      id: `confirm-${Date.now()}`,
      role: "assistant",
      kind: "text",
      content: `Отложил ${new Intl.NumberFormat("ru-KZ").format(amount)} ₸ на «${goal.title}». Баркат растёт! 🌿`,
    };
    setMessages((prev) => [...prev, confirmMsg]);
    setAllocationDialog({ open: false, amount: 0, percent: 10 });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    const newMsg: TextMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      kind: "text",
      content: userMessage,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    // Add typing indicator
    const typingMsg: TextMessage = {
      id: "typing",
      role: "assistant",
      kind: "text",
      content: "typing...",
    };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter(m => m.kind === "text")
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }));

      const response = await fetch("https://openai-hub.neuraldeep.tech/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-roG3OusRr0TLCHAADks6lw",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "You are Zaman AI — a friendly Islamic financial assistant from Zaman Bank. Help users with financial planning, savings goals, and Islamic banking principles. Respond in Russian or Kazakh based on user's language." 
            },
            ...conversationHistory,
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Извините, не могу ответить.";
      const metadata = data.choices?.[0]?.message?.metadata;

      // Remove typing indicator and add real response
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== "typing");
        const responseMsg: TextMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          kind: "text",
          content: reply,
        };
        return [...filtered, responseMsg];
      });

      // Check for backend trigger (metadata from API)
      if (metadata?.trigger === "salary_insight") {
        const amount = metadata.amount ?? 250000;
        setTimeout(() => maybeShowSalaryInsight(amount), 800);
      }

      // Reset turn flag
      shownForThisTurnRef.current = false;
    } catch (error) {
      // Remove typing indicator and show error
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== "typing");
        const errorMsg: TextMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          kind: "text",
          content: "Кажется, соединение нестабильно. Попробуем снова?",
        };
        return [...filtered, errorMsg];
      });
      console.error("Chat API error:", error);
      shownForThisTurnRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-KZ").format(amount);
  };

  return (
    <div className="flex h-[600px] flex-col">
      <div className="border-b border-border bg-card p-3">
        <Button
          onClick={handleSimulateSalary}
          size="sm"
          variant="outline"
          className="w-full gap-2 hover:bg-accent"
        >
          <Wallet className="h-4 w-4" />
          Симулировать поступление зарплаты
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => {
          if (message.kind === "salary-suggestion") {
            return (
              <div key={message.id} className="flex justify-start fade-in">
                <Card
                  className="max-w-[85%] cursor-pointer border border-border/50 bg-card/90 p-0 shadow-card transition-all hover:shadow-elevated"
                  onClick={() => handleSalaryMessageClick(message)}
                >
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Zaman AI</span>
                    </div>
                    <h4 className="mb-1 text-base font-semibold text-foreground">
                      Поступила зарплата {formatAmount(message.event.amount)} ₸ — альхамдулиллях!
                    </h4>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Отложить {message.suggestedPercent}% на мечту?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {message.event.source}
                      </Badge>
                      {message.rule.enabled && (
                        <Badge variant="outline" className="text-xs">
                          автосейв {message.rule.percent}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-border/50 bg-accent/30 p-3">
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary-hover">
                      Выбрать цель
                    </Button>
                    <Button size="sm" variant="outline" className="hover:bg-accent">
                      Позже
                    </Button>
                  </div>
                </Card>
              </div>
            );
          }

          // Typing indicator
          if (message.id === "typing" && message.content === "typing...") {
            return (
              <div key={message.id} className="flex justify-start fade-in">
                <Card className="max-w-[80%] bg-accent p-4 text-accent-foreground">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold">Zaman AI</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary"></span>
                  </div>
                </Card>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} fade-in`}
            >
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold">Zaman AI</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInput(prompt)}
              className="text-xs hover:bg-accent"
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Напишите ваш вопрос..."
            className="flex-1"
          />
          <Button
            size="icon"
            variant="outline"
            className="hover:bg-accent"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="bg-primary hover:bg-primary-hover"
            disabled={loading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <GoalAllocationDialog
        open={allocationDialog.open}
        onOpenChange={(open) => setAllocationDialog({ ...allocationDialog, open })}
        goals={goals}
        initialAmount={allocationDialog.amount}
        initialPercent={allocationDialog.percent}
        initialGoalId={allocationDialog.goalId}
        onConfirm={handleConfirmAllocation}
      />
    </div>
  );
};
