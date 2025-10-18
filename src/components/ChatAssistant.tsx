import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Sparkles, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Goal } from "@/types/goal";
import { SalaryEvent, SalaryRule } from "@/types/salary";
import { GoalAllocationDialog } from "./GoalAllocationDialog";
import { AssistantMessage } from "./AssistantMessage";
import { useCustomer } from "@/contexts/CustomerContext";
import { buildSnapshot, parseAction, type ActionCommand } from "@/lib/customerSnapshot";
import { toast } from "@/hooks/use-toast";

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
  onCreateGoal?: (title: string, target: number, deadline?: string) => void;
  onShowExpenseBreakdown?: (category?: string, merchant?: string) => void;
  onShowProductRecs?: () => void;
}

export const ChatAssistant = ({ 
  goals, 
  onContribute, 
  onCreateGoal,
  onShowExpenseBreakdown,
  onShowProductRecs 
}: ChatAssistantProps) => {
  const { activeCustomer, addTransaction } = useCustomer();
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

  const executeAction = (action: ActionCommand) => {
    switch (action.type) {
      case 'allocate_to_goal': {
        const goal = goals.find(g => g.id === action.goalId);
        if (goal) {
          onContribute(action.goalId, action.amount, new Date().toISOString());
          
          // Add savings transaction
          addTransaction({
            date: new Date().toISOString(),
            amount: -action.amount,
            rawMerchant: `Накопление: ${goal.title}`,
            note: `Автосейв ${action.source || 'manual'}`,
          });

          const confirmMsg: TextMessage = {
            id: `action-confirm-${Date.now()}`,
            role: "assistant",
            kind: "text",
            content: `✅ Отложено ${formatAmount(action.amount)} ₸ на «${goal.title}»`,
          };
          setMessages((prev) => [...prev, confirmMsg]);
        }
        break;
      }
      case 'create_goal': {
        if (onCreateGoal) {
          onCreateGoal(action.title, action.target, action.deadline);
          const confirmMsg: TextMessage = {
            id: `action-confirm-${Date.now()}`,
            role: "assistant",
            kind: "text",
            content: `✅ Создана цель «${action.title}» на ${formatAmount(action.target)} ₸`,
          };
          setMessages((prev) => [...prev, confirmMsg]);
        }
        break;
      }
      case 'show_expense_breakdown': {
        if (onShowExpenseBreakdown) {
          onShowExpenseBreakdown(action.category, action.merchant);
        }
        toast({
          title: "Открываю аналитику",
          description: action.category ? `Категория: ${action.category}` : "Общие расходы",
        });
        break;
      }
      case 'show_product_recs': {
        if (onShowProductRecs) {
          onShowProductRecs();
        }
        toast({
          title: "Открываю рекомендации",
          description: "Продукты подобраны под ваш профиль",
        });
        break;
      }
      case 'set_limit': {
        toast({
          title: "Лимит установлен",
          description: `${action.merchant}: ${formatAmount(action.monthly)} ₸/мес`,
        });
        break;
      }
    }
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
      // Build customer snapshot
      const snapshot = buildSnapshot(activeCustomer, goals);
      
      // Build conversation history for context
      const conversationHistory = messages
        .filter(m => m.kind === "text")
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }));

      const systemPrompt = `You are Zaman AI — a friendly Islamic financial assistant from Zaman Bank. Be concise, supportive, halal-aligned.

IF user asks about spending, use the ACTIVE_CUSTOMER_SNAPSHOT to cite exact numbers.
When suggesting actions (like saving to a goal), output a JSON action after a line that contains exactly @@ACTION.
Keep text short. Respect language from snapshot; if language:'kk' — reply in Kazakh.
Avoid generic advice without numbers from the snapshot.`;

      const response = await fetch("https://openai-hub.neuraldeep.tech/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-roG3OusRr0TLCHAADks6lw",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "system", content: `ACTIVE_CUSTOMER_SNAPSHOT:${JSON.stringify(snapshot)}` },
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

      // Parse action from response
      const action = parseAction(reply);
      
      // Clean reply text (remove @@ACTION block if present)
      const cleanReply = reply.split('@@ACTION')[0].trim();

      // Remove typing indicator and add real response
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== "typing");
        const responseMsg: TextMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          kind: "text",
          content: cleanReply,
        };
        return [...filtered, responseMsg];
      });

      // Execute action if present
      if (action) {
        setTimeout(() => executeAction(action), 500);
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
                    : "bg-card text-card-foreground shadow-card"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Zaman AI</span>
                  </div>
                )}
                {message.role === "assistant" ? (
                  <AssistantMessage content={message.content} />
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
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
