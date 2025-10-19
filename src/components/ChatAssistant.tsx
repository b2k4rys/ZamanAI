import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Sparkles, Wallet, Trash2, Maximize2, Minimize2, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Goal } from "@/types/goal";
import { Challenge } from "@/types/challenge";
import { SalaryEvent, SalaryRule } from "@/types/salary";
import { GoalAllocationDialog } from "./GoalAllocationDialog";
import { AssistantMessage } from "./AssistantMessage";
import { ReminderMessage } from "./ReminderMessage";
import { TipMessage } from "./TipMessage";
import { ProductRecommendationMessage } from "./ProductRecommendationMessage";
import { ProductDetailDialog } from "./ProductDetailDialog";
import { useCustomer } from "@/contexts/CustomerContext";
import { PRODUCTS_MOCK, ProductMock } from "@/data/productsMock";
import { buildSnapshot, parseAction, type ActionCommand } from "@/lib/customerSnapshot";
import { callGemini } from "@/lib/geminiApi";
import { toast } from "@/hooks/use-toast";
import { useSmartReminders } from "@/hooks/useSmartReminders";
import { useSmartTips } from "@/hooks/useSmartTips";
import { Tip, TipType } from "@/types/tip";
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

type TipMessage = {
  id: string;
  role: "assistant";
  kind: "tip";
  tip: Tip;
};

type ProductRecommendationMessage = {
  id: string;
  role: "assistant";
  kind: "product-recommendation";
  products: ProductMock[];
};

type Message = TextMessage | SalarySuggestionMessage | TipMessage | ProductRecommendationMessage;

interface ChatAssistantProps {
  goals: Goal[];
  challenges: Challenge[];
  onContribute: (goalId: string, amount: number, date: string) => void;
  onCreateGoal?: (title: string, target: number, deadline?: string) => void;
  onShowExpenseBreakdown?: (category?: string, merchant?: string) => void;
  onShowProductRecs?: () => void;
  onShowGoals?: () => void;
  onShowChallenges?: () => void;
}

export const ChatAssistant = ({ 
  goals,
  challenges,
  onContribute, 
  onCreateGoal, 
  onShowExpenseBreakdown,
  onShowProductRecs,
  onShowGoals,
  onShowChallenges
}: ChatAssistantProps) => {
  const { activeCustomer, addTransaction } = useCustomer();
  
  // Smart reminders
  const {
    topReminder,
    dismissReminder,
    snoozeReminder,
    completeReminder,
    refresh: refreshReminders,
  } = useSmartReminders(activeCustomer.txns, goals, challenges);
  
  // Smart tips
  const {
    generateTips,
    markShown,
  } = useSmartTips(activeCustomer.txns, goals, challenges);
  
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
  const [isRecording, setIsRecording] = useState(false);
  const [allocationDialog, setAllocationDialog] = useState<{
    open: boolean;
    amount: number;
    percent: number;
    goalId?: string;
  }>({ open: false, amount: 0, percent: 10 });
  
  // Product dialog state
  const [productDialog, setProductDialog] = useState<{
    open: boolean;
    product: ProductMock | null;
  }>({ open: false, product: null });

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

  // Refresh reminders on mount
  useEffect(() => {
    refreshReminders();
  }, []);

  // Inject reminder into chat if available
  useEffect(() => {
    if (topReminder && topReminder.state === 'new') {
      const reminderMsg: TextMessage = {
        id: `reminder-${topReminder.id}`,
        role: "assistant",
        kind: "text",
        content: topReminder.body,
      };
      setMessages(prev => {
        const hasReminder = prev.some(m => m.id === reminderMsg.id);
        if (!hasReminder) {
          return [...prev, reminderMsg];
        }
        return prev;
      });
    }
  }, [topReminder]);

  // Anti-spam protection for Salary Insight
  const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
  const lastSalaryTriggerRef = React.useRef(0);
  const shownForThisTurnRef = React.useRef(false);

  const quickPrompts = [
    "Как накопить на квартиру? 🏡",
    "Посчитай расходы за месяц 📊",
    "Подобрать продукт 💼",
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

  const handleGetTips = () => {
    // Show typing indicator
    const typingMsg: TextMessage = {
      id: 'typing',
      role: 'assistant',
      kind: 'text',
      content: 'typing...',
    };
    setMessages(prev => [...prev, typingMsg]);
    
    setTimeout(() => {
      const newTips = generateTips();
      
      // Get rotation index from localStorage
      const rotationKey = 'zaman.tips.rotation';
      const currentIndex = parseInt(localStorage.getItem(rotationKey) || '0', 10);
      
      // Pick ONE tip (data-driven or fallback by rotation)
      let selectedTip: Tip | null = null;
      
      if (newTips.length > 0) {
        // Use first data-driven tip
        selectedTip = newTips[0];
      } else {
        // Use fallback rotation
        const fallbacks = [
          {
            id: 'fallback_1',
            type: 'saving_opportunity' as TipType,
            title: 'Регулярность важнее суммы 💡',
            body: 'Даже **3 000 ₸** каждую неделю лучше, чем 50 000 раз в квартал. Отложим немного сегодня?',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_2',
            type: 'challenge_checkin' as TipType,
            title: '3 дня без доставки — круто! 🙌',
            body: 'Продолжаем? Каждый день без импульсивных трат — шаг к мечте.',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_3',
            type: 'low_balance' as TipType,
            title: 'Распределим бюджет?',
            body: 'На карте осталось **20 000 ₸**, впереди 5 дней — давай разложим по дням?',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_4',
            type: 'goal_nudge' as TipType,
            title: 'Начнём новую цель? 🎯',
            body: 'Есть стабильный остаток **70 000 ₸**. Может, создадим цель на квартиру или хадж?',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_5',
            type: 'bill_upcoming' as TipType,
            title: 'Не забудьте про оплату!',
            body: 'Хотите, я напомню оплатить интернет завтра, чтобы не забыть? 💚',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_6',
            type: 'overspend' as TipType,
            title: 'Траты на еду чуть выросли',
            body: 'Создадим челлендж "Неделя домашней еды"? Это поможет сэкономить **10 000+ ₸**.',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_7',
            type: 'goal_nudge' as TipType,
            title: 'До цели "Хадж" осталось 1 200 000 ₸',
            body: 'Добавим немного сегодня? Даже **5 000 ₸** — это прогресс. 🕌',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_8',
            type: 'saving_opportunity' as TipType,
            title: 'Порадуй себя добрым делом 🌿',
            body: '**3 000 ₸** на благотворительность — это и баракат, и радость для души.',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_9',
            type: 'saving_opportunity' as TipType,
            title: 'Халяль-депозит под 15%',
            body: 'Можем перевести **10%** свободных средств на депозит? Деньги будут работать на вас.',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
          {
            id: 'fallback_10',
            type: 'challenge_checkin' as TipType,
            title: 'Каждый день — шаг к мечте 💪',
            body: 'Без импульсивных трат уже 2 дня. Продолжаем? Вы на верном пути!',
            ts: new Date().toISOString(),
            actions: [],
            priority: 5,
          },
        ];
        
        selectedTip = fallbacks[currentIndex % fallbacks.length];
        localStorage.setItem(rotationKey, String((currentIndex + 1) % fallbacks.length));
      }
      
      // Remove typing indicator and add tip as TEXT message
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        
        if (selectedTip) {
          const tipMsg: TextMessage = {
            id: `tip-natural-${Date.now()}`,
            role: 'assistant',
            kind: 'text',
            content: `**${selectedTip.title}**\n\n${selectedTip.body}`,
          };
          
          markShown(selectedTip.id);
          return [...withoutTyping, tipMsg];
        }
        
        return withoutTyping;
      });
    }, 800); // Typing delay
  };
  
  const handleVoiceRecording = async () => {
    const voiceCommand = "Сделай анализ по моим расходам";
    setIsRecording(true);
    setInput("");
    
    // Simulate voice recording with typing animation
    for (let i = 0; i <= voiceCommand.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 80)); // 80ms per character
      setInput(voiceCommand.substring(0, i));
    }
    
    setIsRecording(false);
    
    // Auto-send after typing animation completes
    setTimeout(() => {
      if (!loading) {
        handleSend();
      }
    }, 300);
  };
  
  const handleTipAction = (tip: Tip, action: Tip['actions'][0]) => {
    const { action: tipAction } = action;
    
    let confirmContent = '';
    
    switch (tipAction.kind) {
      case 'pay_bill':
        confirmContent = `Готово! Перевёл ${tipAction.amount.toLocaleString()} ₸ на оплату ${tipAction.merchant}.`;
        toast({
          title: "Счёт оплачен",
          description: tipAction.merchant,
        });
        addTransaction({
          date: new Date().toISOString(),
          amount: -tipAction.amount,
          rawMerchant: tipAction.merchant,
          note: 'Оплата по совету',
        });
        break;
      
      case 'open_budget_planner':
        confirmContent = 'Открываю планировщик бюджета...';
        toast({
          title: "Планировщик",
          description: "Функция в разработке",
        });
        break;
      
      case 'create_challenge':
        confirmContent = `Создаю челлендж по ${tipAction.scope.kind === 'category' ? 'категории' : 'мерчанту'} "${tipAction.scope.value}"...`;
        if (onShowChallenges) {
          onShowChallenges();
        }
        toast({
          title: "Создание челленджа",
          description: "Открывайте страницу Челленджи",
        });
        break;
      
      case 'set_limit':
        confirmContent = `Лимит установлен: ${tipAction.monthly.toLocaleString()} ₸ в месяц.`;
        toast({
          title: "Лимит установлен",
          description: `${tipAction.monthly.toLocaleString()} ₸/мес`,
        });
        break;
      
      case 'transfer_to_goal':
        const goal = goals.find(g => g.id === tipAction.goalId);
        if (goal) {
          onContribute(tipAction.goalId, tipAction.amount, new Date().toISOString());
          addTransaction({
            date: new Date().toISOString(),
            amount: -tipAction.amount,
            rawMerchant: `Накопление: ${goal.name}`,
            note: 'Перевод по совету',
          });
          confirmContent = `Перевёл ${tipAction.amount.toLocaleString()} ₸ на вашу цель «${goal.name}».`;
          toast({
            title: "Цель пополнена",
            description: `${tipAction.amount.toLocaleString()} ₸`,
          });
        }
        break;
      
      case 'open_subscriptions':
        confirmContent = 'Открываю список подписок...';
        toast({
          title: "Подписки",
          description: "Перейдите в Аналитику",
        });
        break;
      
      case 'snooze':
        confirmContent = `Напомню через ${tipAction.hours} ч.`;
        toast({
          title: "Отложено",
          description: `Напомню через ${tipAction.hours} ч`,
        });
        break;
    }
    
    // Mark tip as shown
    markShown(tip.id);
    
    // Add confirmation message
    if (confirmContent) {
      const confirmMsg: TextMessage = {
        id: `tip-confirm-${Date.now()}`,
        role: 'assistant',
        kind: 'text',
        content: confirmContent,
      };
      setMessages(prev => [...prev, confirmMsg]);
    }
  };

  const handleSimulateSalary = () => {
    maybeShowSalaryInsight(250000);
  };

  const handleRecommendProducts = () => {
    // Add user message
    const userMsg: TextMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      kind: "text",
      content: "Подобрать продукт 💼",
    };
    setMessages(prev => [...prev, userMsg]);

    // Show typing indicator
    const typingMsg: TextMessage = {
      id: 'typing',
      role: 'assistant',
      kind: 'text',
      content: 'typing...',
    };
    setMessages(prev => [...prev, typingMsg]);

    // Show products after delay
    setTimeout(() => {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        const productsMsg: ProductRecommendationMessage = {
          id: `products-${Date.now()}`,
          role: "assistant",
          kind: "product-recommendation",
          products: PRODUCTS_MOCK,
        };
        return [...withoutTyping, productsMsg];
      });
    }, 800);
  };

  const handleProductAction = (action: string, product: ProductMock) => {
    const [actionType, productId] = action.split(':');
    
    switch (actionType) {
      case 'open_product':
        setProductDialog({ open: true, product });
        break;
      
      case 'open_calculator':
        toast({
          title: "Калькулятор",
          description: "Функция в разработке",
        });
        break;
      
      case 'open_risk_disclaimer':
        toast({
          title: "⚠️ Предупреждение о рисках",
          description: "Инвестиции связаны с риском. Рекомендуем консультацию со специалистом.",
        });
        break;
    }

    // Add confirmation message
    const confirmMsg: TextMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      kind: 'text',
      content: `Окей, открыл ${actionType === 'open_product' ? 'условия' : 'информацию'} «${product.name}» ✨`,
    };
    setMessages(prev => [...prev, confirmMsg]);
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
      content: `Отложил ${new Intl.NumberFormat("ru-KZ").format(amount)} ₸ на «${goal.name}». Баркат растёт! 🌿`,
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
            rawMerchant: `Накопление: ${goal.name}`,
            note: `Автосейв ${action.source || 'manual'}`,
          });

          const confirmMsg: TextMessage = {
            id: `action-confirm-${Date.now()}`,
            role: "assistant",
            kind: "text",
            content: `✅ Отложено ${formatAmount(action.amount)} ₸ на «${goal.name}»`,
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
      case 'open_challenges': {
        if (onShowChallenges) {
          onShowChallenges();
        }
        toast({
          title: "Открываю челленджи",
          description: "Создавайте вызовы и экономьте",
        });
        break;
      }
      case 'create_challenge': {
        toast({
          title: "Создание челленджа",
          description: "Функция в разработке - используйте кнопку 'Создать челлендж'",
        });
        if (onShowChallenges) {
          onShowChallenges();
        }
        break;
      }
      case 'checkin': {
        toast({
          title: "Чек-ин выполнен",
          description: action.note ? action.note : "Отличная работа! Продолжайте в том же духе 💪",
        });
        // TODO: Link with useChallenges hook
        break;
      }
      case 'pay_bill': {
        toast({
          title: "Платёж выполнен",
          description: `${action.merchant}: ${formatAmount(action.amount)} ₸`,
        });
        // Add expense transaction
        addTransaction({
          date: new Date().toISOString(),
          amount: -action.amount,
          rawMerchant: action.merchant,
          note: 'Оплата по напоминанию',
        });
        break;
      }
      case 'transfer_to_goal': {
        const goal = goals.find(g => g.id === action.goalId);
        if (goal) {
          onContribute(action.goalId, action.amount, new Date().toISOString());
          addTransaction({
            date: new Date().toISOString(),
            amount: -action.amount,
            rawMerchant: `Накопление: ${goal.name}`,
            note: 'Перевод по напоминанию',
          });
          const confirmMsg: TextMessage = {
            id: `action-confirm-${Date.now()}`,
            role: "assistant",
            kind: "text",
            content: `✅ Переведено ${formatAmount(action.amount)} ₸ на цель «${goal.name}»`,
          };
          setMessages((prev) => [...prev, confirmMsg]);
        }
        break;
      }
      case 'open_budget_planner': {
        toast({
          title: "Планировщик бюджета",
          description: "Функция в разработке",
        });
        break;
      }
      case 'open_challenge_checkin': {
        if (onShowChallenges) {
          onShowChallenges();
        }
        toast({
          title: "Открываю челлендж",
          description: "Отметьте чек-ин прямо в челленджах",
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
    
    // Check for product recommendation triggers
    const productTriggers = [
      '#recommend_products',
      'какой продукт рекомендуешь',
      'подбери продукт',
      'подобрать продукт',
      'рекомендуй продукт',
      'куда вложить',
      'подбери депозит',
      'какой депозит',
    ];
    
    const shouldShowProducts = productTriggers.some(trigger => 
      userMessage.toLowerCase().includes(trigger.toLowerCase())
    );
    
    if (shouldShowProducts) {
      handleRecommendProducts();
      return;
    }
    
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
   - Используй эмодзи (💡📊💰🏡🕌✅📈⚡)
   - Нумерованные списки для шагов
   - **Жирный текст** для важных моментов
   - Короткие параграфы (3-5 предложений)
5. Если клиент упоминает цель — используй данные из snapshot.goals
6. Если данных недостаточно — спроси у клиента.
7. Предлагай конкретные действия через JSON-команды (@@ACTION).
8. Будь дружелюбным, поддерживающим и соблюдай исламские принципы халяль.
9. ЯЗЫК: **ВСЕГДА отвечай на русском языке**, независимо от того, на каком языке пишет пользователь.
   - Если пользователь пишет на казахском, узбекском, английском или другом языке — вежливо переведи его вопрос в уме и ответь только на русском.
   - Пиши простыми словами, избегай жаргона.
   - Тон общения: дружелюбный, заботливый, уверенный.

НОВАЯ ФУНКЦИЯ - ЧЕЛЛЕНДЖИ:
Ты можешь предлагать клиенту персональные челленджи по сокращению трат:
- Отказ от определённого мерчанта (кофейни, доставка)
- Сокращение трат по категории на N%
- С автоматическим откладыванием сэкономленного
- С штрафами при срыве (Swear Jar)

Команды для челленджей:
- {"type":"open_challenges"} - открыть страницу челленджей
- {"type":"create_challenge","scope":{"kind":"merchant","value":"Starbucks"},"durationDays":7,"target":{"mode":"amount","value":10000},"hacks":[{"type":"swear_jar","enabled":true,"penalty":1000}]}

Примеры хороших ответов:
❌ "Вам нужно больше откладывать"
✅ "Отличная цель! 🏡 Давайте посчитаем: при ваших расходах ${snapshot.totalSpend.toLocaleString()} ₸/мес вы можете откладывать ${snapshot.freeCash.toLocaleString()} ₸. Сколько месяцев вам удобно копить?"
✅ "Вижу, вы часто тратите на кофе ☕ - может попробуем челлендж '7 дней без Starbucks'? За неделю сэкономим примерно 10 000 ₸ на вашу цель!"

После рекомендации всегда предлагай действие:
"Хотите, я покажу план накоплений? 📊"
"Может, посмотрим, где можно сократить расходы? 💡"
"Подключить халяль-депозит под эту цель? 💰"
"Создать челлендж и начать экономить? ⚡"

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
        <div className="flex gap-2">
          <Button
            onClick={handleGetTips}
            size="sm"
            variant="outline"
            className="flex-1 gap-2 hover:bg-accent"
          >
            <Lightbulb className="h-4 w-4" />
            Советы от ассистента
          </Button>
          <Button
            onClick={handleSimulateSalary}
            size="sm"
            variant="outline"
            className="flex-1 gap-2 hover:bg-accent"
          >
            <Wallet className="h-4 w-4" />
            Симулировать зарплату
          </Button>
        </div>
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

          // Product recommendation message
          if (message.kind === "product-recommendation") {
            return (
              <div key={message.id} className="flex justify-start fade-in">
                <div className="max-w-[85%]">
                  <Card className="p-4 bg-card border-l-4 border-primary/30">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-primary">Zaman AI</span>
                    </div>
                    <ProductRecommendationMessage 
                      products={message.products} 
                      onActionClick={handleProductAction} 
                    />
                  </Card>
                </div>
              </div>
            );
          }

          // Tip message
          if (message.kind === "tip") {
            return (
              <div key={message.id} className="flex justify-start fade-in">
                <div className="max-w-[85%]">
                  <TipMessage 
                    tip={message.tip} 
                    onActionClick={(action) => handleTipAction(message.tip, action)} 
                  />
                </div>
              </div>
            );
          }

          // Typing indicator
          if (message.kind === "text" && message.id === "typing" && message.content === "typing...") {
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
                {message.role === "assistant" && message.kind === "text" ? (
                  <AssistantMessage content={message.content} />
                ) : message.kind === "text" ? (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                ) : null}
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
            onKeyPress={(e) => e.key === "Enter" && !loading && !isRecording && handleSend()}
            placeholder={isRecording ? "🎤 Идет запись..." : "Напишите ваш вопрос..."}
            className={`flex-1 border-primary/20 focus:border-primary transition-all ${
              isRecording ? 'bg-red-500/5 border-red-500/30' : ''
            }`}
            disabled={loading || isRecording}
          />
          <Button
            size="icon"
            variant="outline"
            className={`hover:bg-accent border-primary/20 transition-all ${
              isRecording ? 'bg-red-500/10 border-red-500 animate-pulse' : ''
            }`}
            title={isRecording ? "Запись..." : "Голосовой ввод"}
            onClick={handleVoiceRecording}
            disabled={loading || isRecording}
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
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
      
      <ProductDetailDialog
        open={productDialog.open}
        onOpenChange={(open) => setProductDialog({ ...productDialog, open })}
        product={productDialog.product}
      />

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
