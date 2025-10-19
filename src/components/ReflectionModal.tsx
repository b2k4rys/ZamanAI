import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReflectionCarousel } from './ReflectionCarousel';
import { useReflection } from '@/hooks/useReflection';
import type { Transaction } from '@/types/transaction';
import type { Goal } from '@/types/goal';
import { Download, Share2, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { format, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ReflectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  goals: Goal[];
  onAction?: (action: string, data?: any) => void;
}

export const ReflectionModal = ({
  open,
  onOpenChange,
  transactions,
  goals,
  onAction,
}: ReflectionModalProps) => {
  // Generate list of last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'LLLL yyyy', { locale: ru }),
    };
  });

  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const { reflectionData, saveLastMonth } = useReflection(transactions, goals, selectedMonth);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    saveLastMonth(month);
  };

  const handleDownloadPNG = async () => {
    try {
      const element = document.getElementById('reflection-carousel');
      if (!element) {
        throw new Error('Carousel element not found');
      }

      toast({
        title: 'Генерация изображения...',
        description: 'Подождите несколько секунд',
      });

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `financial-reflection-${selectedMonth}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: 'Отчёт сохранён!',
        description: 'Изображение загружено на ваше устройство',
      });
    } catch (error) {
      console.error('Failed to download PNG:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изображение',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Мой финансовый ${reflectionData.month.monthName}`,
          text: reflectionData.captions.join('\n'),
        });
        toast({
          title: 'Успешно!',
          description: 'Отчёт отправлен',
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(reflectionData.captions.join('\n'));
        toast({
          title: 'Скопировано!',
          description: 'Текст отчёта скопирован в буфер обмена',
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось поделиться отчётом',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            📊 Financial Reflection
          </DialogTitle>
        </DialogHeader>

        {/* Month Selector */}
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Выберите месяц" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Empty State */}
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              Транзакций нет — добавь данные или выбери другой месяц
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Закрыть
            </Button>
          </div>
        ) : (
          <>
            {/* Carousel */}
            <ReflectionCarousel slides={reflectionData.slides} onAction={onAction} />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button onClick={handleDownloadPNG} className="flex-1" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Сохранить PNG
              </Button>
              <Button onClick={handleShare} className="flex-1" variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
