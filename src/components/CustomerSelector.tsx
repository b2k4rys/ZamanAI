import { User, Download, Upload, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/contexts/CustomerContext";
import { Card } from "@/components/ui/card";
import { useRef } from "react";

export const CustomerSelector = () => {
  const { 
    customers, 
    activeCustomer, 
    setActiveCustomerId,
    resetToSeed,
    exportCustomer,
    importCustomer,
  } = useCustomer();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportCustomer();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCustomer.name.toLowerCase()}-profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importCustomer(json);
      };
      reader.readAsText(file);
    }
  };

  const totalSpend = Math.abs(
    activeCustomer.txns.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)
  );
  const freeCash = Math.max(activeCustomer.monthlyIncome - totalSpend, 0);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select value={activeCustomer.id} onValueChange={setActiveCustomerId}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Импорт
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetToSeed}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Сброс
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm bg-primary/5 rounded-lg p-3 border border-primary/20">
        <div>
          <span className="text-muted-foreground">Расходы за месяц: </span>
          <span className="font-semibold text-foreground">
            {totalSpend.toLocaleString('ru-KZ')} ₸
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Свободный остаток: </span>
          <span className="font-semibold text-primary">
            {freeCash.toLocaleString('ru-KZ')} ₸
          </span>
        </div>
      </div>
    </Card>
  );
};
