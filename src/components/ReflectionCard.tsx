import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface ReflectionCardProps {
  onOpen: () => void;
}

export const ReflectionCard = ({ onOpen }: ReflectionCardProps) => {
  return (
    <Card className="p-6 shadow-card hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h3 className="font-semibold text-foreground">📊 Financial Reflection</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Твой финансовый месяц в стиле Spotify Wrapped — красиво, понятно, мотивирующе.
        </p>

        <Button onClick={onOpen} className="w-full" size="lg">
          Сформировать отчёт
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Выбери месяц, посмотри прогресс, сохрани и поделись
        </div>
      </div>
    </Card>
  );
};
