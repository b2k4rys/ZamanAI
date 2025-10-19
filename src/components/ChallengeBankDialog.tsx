import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChallengeTemplate } from "@/types/challengeTemplate";
import { Badge } from "@/components/ui/badge";
import { Shuffle } from "lucide-react";

interface ChallengeBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ChallengeTemplate[];
  onAddSelected: (templateIds: string[]) => void;
}

export const ChallengeBankDialog = ({
  open,
  onOpenChange,
  templates,
  onAddSelected,
}: ChallengeBankDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleTemplate = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectRandom = () => {
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    setSelectedIds(new Set([randomTemplate.id]));
  };

  const selectN = (n: number) => {
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, n).map(t => t.id);
    setSelectedIds(new Set(selected));
  };

  const handleAdd = () => {
    onAddSelected(Array.from(selectedIds));
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Банк шаблонов челленджей</DialogTitle>
          <DialogDescription>
            Выберите шаблоны для создания новых челленджей
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectRandom}>
              <Shuffle className="h-4 w-4 mr-2" />
              Случайный
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectN(3)}>
              Заполнить 3
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectN(6)}>
              Заполнить 6
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all hover:border-primary ${
                  selectedIds.has(template.id) ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleTemplate(template.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(template.id)}
                    onCheckedChange={() => toggleTemplate(template.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      {template.icon && (
                        <span className="text-2xl">{template.icon}</span>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm leading-tight">
                          {template.title}
                        </h3>
                        {template.place && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.place}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {template.period === 'month' ? 'Месяц' : 'Неделя'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Цель: {template.targetAmount.toLocaleString('ru-KZ')} ₸
                      </span>
                    </div>
                    {template.note && (
                      <p className="text-xs text-muted-foreground italic">
                        {template.note}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Выбрано: {selectedIds.size}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={handleAdd} disabled={selectedIds.size === 0}>
                Добавить выбранные
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
