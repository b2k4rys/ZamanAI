import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Sparkles, Wallet, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Goal } from "@/types/goal";
import { SalaryEvent, SalaryRule } from "@/types/salary";
import { GoalAllocationDialog } from "./GoalAllocationDialog";
import { AssistantMessage } from "./AssistantMessage";
import { useCustomer } from "@/contexts/CustomerContext";
import { buildSnapshot, parseAction, type ActionCommand } from "@/lib/customerSnapshot";
import { callGemini } from "@/lib/geminiApi";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useChatStorage, DEFAULT_CHAT_SIZE } from "@/hooks/useChatStorage";
import { useChatResize } from "@/hooks/useChatResize";

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
  onShowGoals?: () => void;
}

export const ChatAssistant = ({ 
  goals, 
  onContribute, 
  onCreateGoal, 
  onShowExpenseBreakdown,
  onShowProductRecs,
  onShowGoals
}: ChatAssistantProps) => {
  const { activeCustomer, addTransaction } = useCustomer();
  
  // Chat size management
  const [chatSize, setChatSize] = useChatStorage('zaman.chat.size', DEFAULT_CHAT_SIZE);
  const { size, isResizing, startResize, toggleMode } = useChatResize(chatSize, setChatSize);
  
  // Clear chat dialog
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  // Load messages from localStorage
  const getWelcomeMessage = (): TextMessage => ({
    id: "welcome",
    role: "assistant",
    kind: "text",
    content: `Здравствуйте, ${activeCustomer.name}! 🌿 Я — Zaman AI, ваш финансовый помощник. Расскажите, чем могу помочь сегодня?`,
  });

  const loadMessages = (): Message[] => {
    try {
      const stored = localStorage.getItem(`zaman.chat.${activeCustomer.id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    return [getWelcomeMessage()];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessages());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allocationDialog, setAllocationDialog] = useState<{
    open: boolean;
    amount: number;
    percent: number;
    goalId?: string;
  }>({ open: false, amount: 0, percent: 10 });

  // Clear chat functionality
  const clearChat = () => {
    setMessages([getWelcomeMessage()]);
    setInput("");
    localStorage.removeItem(`zaman.chat.${activeCustomer.id}`);
    localStorage.removeItem(`zaman.chat.draft.${activeCustomer.id}`);
    toast({
      title: "Чат очищен",
      description: "История диалога удалена",
    });
    setIsClearDialogOpen(false);
  };

  // Save messages to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem(`zaman.chat.${activeCustomer.id}`, JSON.stringify(messages.slice(-10))); // Keep last 10 messages
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages, activeCustomer.id]);

  // Save draft
  React.useEffect(() => {
    if (input) {
      localStorage.setItem(`zaman.chat.draft.${activeCustomer.id}`, input);
    }
  }, [input, activeCustomer.id]);

  // Load draft
  React.useEffect(() => {
    const draft = localStorage.getItem(`zaman.chat.draft.${activeCustomer.id}`);
    if (draft) setInput(draft);
  }, [activeCustomer.id]);

  // Update welcome message when customer changes
  React.useEffect(() => {
    const hasWelcome = messages.some(m => m.id === "welcome");
    if (!hasWelcome) {
      setMessages(prev => [
        {
          id: "welcome",
          role: "assistant",
          kind: "text",
          content: `Понял, теперь вы — ${activeCustomer.name}. Давайте посмотрим ваши цели и расходы 👇`,
        },
        ...prev
      ]);
    }
  }, [activeCustomer.id]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsClearDialogOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Anti-spam protection for Salary Insight
  const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
  const lastSalaryTriggerRef = React.useRef(0);
  const shownForThisTurnRef = React.useRef(false);

  const quickPrompts = [
    "Как накопить на квартиру? 🏡",
    "Посчитай расходы за месяц 📊",
    "Подбери депозит 💰",
    "Планирование хаджа 🕌",
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
      case 'show_goals': {
        if (onShowGoals) {
          onShowGoals();
        }
        toast({
          title: "Открываю цели",
          description: "Ваши финансовые цели и прогресс",
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
      const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = messages
        .filter(m => m.kind === "text")
        .map(m => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));

      const systemPrompt = `Ты — Zaman AI, персональный финансовый ассистент от Zaman Bank. Твоя задача — вести диалог с клиентом о его целях и финансах.

ВАЖНЫЕ ПРАВИЛА:
1. Не просто отвечай — веди беседу. Задавай уточняющие вопросы.
2. Используй данные ACTIVE_CUSTOMER_SNAPSHOT для точных цифр и анализа.
3. Каждый ответ заканчивай вопросом или предложением следующего шага.
4. Форматируй ответы красиво:
   - Используй эмодзи (💡📊💰🏡🕌✅📈)
   - Нумерованные списки для шагов
   - **Жирный текст** для важных моментов
   - Короткие параграфы (3-5 предложений)
5. Если клиент упоминает цель — используй данные из snapshot.goals
6. Если данных недостаточно — спроси у клиента.
7. Предлагай конкретные действия через JSON-команды (@@ACTION).
8. Будь дружелюбным, поддерживающим и соблюдай исламские принципы халяль.
9. Язык ответа: если language:'kk' — отвечай на казахском, иначе на русском.

Примеры хороших ответов:
❌ "Вам нужно больше откладывать"
✅ "Отличная цель! 🏡 Давайте посчитаем: при ваших расходах ${snapshot.totalSpend.toLocaleString()} ₸/мес вы можете откладывать ${snapshot.freeCash.toLocaleString()} ₸. Сколько месяцев вам удобно копить?"

После рекомендации всегда предлагай действие:
"Хотите, я покажу план накоплений? 📊"
"Может, посмотрим, где можно сократить расходы? 💡"
"Подключить халяль-депозит под эту цель? 💰"

ACTIVE_CUSTOMER_SNAPSHOT:${JSON.stringify(snapshot)}`;

      const reply = await callGemini([
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ]);

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
          content: error instanceof Error 
            ? error.message
            : "Кажется, соединение нестабильно. Попробуем снова?",
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

  const containerStyle: React.CSSProperties = size.mode === 'fullscreen' 
    ? { width: '100%', height: '100%' }
    : { width: `${size.w}px`, height: `${size.h}px` };

  return (
    <div 
      className="relative flex flex-col bg-gradient-to-b from-primary/5 to-background rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden"
      style={containerStyle}
    >
      <div className="border-b border-border bg-card p-4 shadow-sm rounded-t-2xl">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Zaman AI</h3>
              <p className="text-xs text-muted-foreground">Ваш финансовый помощник</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsClearDialogOpen(true)}
              size="sm"
              variant="ghost"
              className="gap-2 hover:bg-destructive/10 hover:text-destructive"
              title="Очистить чат (Ctrl+K)"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Очистить</span>
            </Button>
            <Button
              onClick={toggleMode}
              size="sm"
              variant="ghost"
              className="gap-2 hover:bg-accent"
              title={size.mode === 'fullscreen' ? 'Свернуть' : 'Развернуть'}
            >
              {size.mode === 'fullscreen' ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
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

      <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
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
                className={`max-w-[80%] p-4 shadow-sm transition-all hover:shadow-md ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                    : "bg-card text-card-foreground border-l-4 border-primary/30 rounded-2xl rounded-bl-sm"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary">Zaman AI</span>
                  </div>
                )}
                {message.role === "assistant" ? (
                  <AssistantMessage content={message.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-border bg-card p-4 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInput(prompt.replace(/[🏡📊💰🕌]/g, '').trim())}
              className="text-xs hover:bg-primary/10 hover:border-primary/30 transition-colors"
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && handleSend()}
            placeholder="Напишите ваш вопрос..."
            className="flex-1 border-primary/20 focus:border-primary"
            disabled={loading}
          />
          <Button
            size="icon"
            variant="outline"
            className="hover:bg-accent border-primary/20"
            title="Голосовой ввод (скоро)"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="bg-primary hover:bg-primary-hover shadow-sm"
            disabled={loading || !input.trim()}
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

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить диалог с Zaman AI?</AlertDialogTitle>
            <AlertDialogDescription>
              История и черновик будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={clearChat}
              className="bg-destructive hover:bg-destructive/90"
            >
              Очистить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resize handle */}
      {size.mode === 'docked' && (
        <div
          onPointerDown={startResize}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-border group-hover:border-primary transition-colors" />
        </div>
      )}
      
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-nwse-resize" style={{ touchAction: 'none' }} />
      )}
    </div>
  );
};
