import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoalTemplate } from "@/types/goalTemplate";
import { Shuffle } from "lucide-react";

interface GoalBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: GoalTemplate[];
  onAddSelected: (templateIds: string[]) => void;
}

export const GoalBankDialog = ({
  open,
  onOpenChange,
  templates,
  onAddSelected,
}: GoalBankDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectRandom = () => {
    const randomIdx = Math.floor(Math.random() * templates.length);
    const randomId = templates[randomIdx].id;
    setSelectedIds(new Set([randomId]));
  };

  const selectN = (n: number) => {
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, n).map((t) => t.id);
    setSelectedIds(new Set(picked));
  };

  const handleAdd = () => {
    onAddSelected(Array.from(selectedIds));
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎯 Банк целей</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={selectRandom}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Случайная
            </Button>
            <Button
              onClick={() => selectN(3)}
              variant="outline"
              size="sm"
            >
              3 случайных
            </Button>
            <Button
              onClick={() => selectN(5)}
              variant="outline"
              size="sm"
            >
              5 случайных
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((tpl) => {
              const isSelected = selectedIds.has(tpl.id);
              return (
                <Card
                  key={tpl.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "ring-2 ring-primary bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => toggleTemplate(tpl.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {tpl.icon && (
                          <span className="text-2xl">{tpl.icon}</span>
                        )}
                        <div className="font-semibold text-foreground truncate">
                          {tpl.name}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {tpl.type}
                      </div>
                      <div className="text-sm text-foreground">
                        {(tpl.targetAmount / 1000000).toFixed(1)} млн ₸
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(tpl.monthlyPlan / 1000).toFixed(0)} тыс ₸/мес
                      </div>
                      {tpl.description && (
                        <div className="text-xs text-muted-foreground mt-2">
                          {tpl.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Выбрано: {selectedIds.size}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedIds(new Set());
                  onOpenChange(false);
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleAdd}
                disabled={selectedIds.size === 0}
              >
                Добавить выбранные
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
