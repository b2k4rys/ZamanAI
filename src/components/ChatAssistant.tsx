import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Здравствуйте! Я — ваш финансовый ассистент Zaman. Чем могу помочь?",
    },
  ]);
  const [input, setInput] = useState("");

  const quickPrompts = [
    "Как накопить на квартиру?",
    "Посчитай расходы за месяц",
    "Подбери депозит",
    "Планирование хаджа",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    
    // Simulate assistant response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Отличный вопрос! Давайте вместе разберемся с вашими финансами.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="flex h-[600px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
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
        ))}
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
          <Button onClick={handleSend} size="icon" className="bg-primary hover:bg-primary-hover">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
