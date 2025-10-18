import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomer } from "@/contexts/CustomerContext";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";
import { Transaction, Category } from "@/types/customer";
import { Badge } from "@/components/ui/badge";

const categories: Category[] = [
  'Еда', 'Транспорт', 'Дом', 'Подписки', 'Одежда', 'Развлечения', 
  'Образование', 'Благотворительность', 'Другое'
];

export const TransactionManager = () => {
  const { activeCustomer, addTransaction, updateTransaction, deleteTransaction, generateMonth } = useCustomer();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    rawMerchant: '',
    amount: '',
    note: '',
  });

  const recentTxns = [...activeCustomer.txns]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount === 0) return;

    if (editingTxn) {
      updateTransaction(editingTxn.id, {
        ...formData,
        amount: -Math.abs(amount),
      });
      setEditingTxn(null);
    } else {
      addTransaction({
        ...formData,
        amount: -Math.abs(amount),
      });
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      rawMerchant: '',
      amount: '',
      note: '',
    });
    setIsAddOpen(false);
  };

  const handleEdit = (txn: Transaction) => {
    setEditingTxn(txn);
    setFormData({
      date: txn.date,
      rawMerchant: txn.rawMerchant,
      amount: Math.abs(txn.amount).toString(),
      note: txn.note || '',
    });
    setIsAddOpen(true);
  };

  const handleDelete = (txnId: string) => {
    if (confirm('Удалить транзакцию?')) {
      deleteTransaction(txnId);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Мои транзакции</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateMonth}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Сгенерировать месяц
          </Button>

          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setEditingTxn(null);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                rawMerchant: '',
                amount: '',
                note: '',
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTxn ? 'Редактировать транзакцию' : 'Добавить транзакцию'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">Дата</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="merchant">Мерчант</Label>
                  <Input
                    id="merchant"
                    value={formData.rawMerchant}
                    onChange={(e) => setFormData({ ...formData, rawMerchant: e.target.value })}
                    placeholder="DoDo Pizza, Yandex Go..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Сумма (₸)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="note">Примечание (опционально)</Label>
                  <Input
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Заметка..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingTxn ? 'Сохранить' : 'Добавить'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Мерчант</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTxns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет транзакций
                </TableCell>
              </TableRow>
            ) : (
              recentTxns.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm">
                    {new Date(txn.date).toLocaleDateString('ru-KZ')}
                  </TableCell>
                  <TableCell className="font-medium">{txn.merchant || txn.rawMerchant}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{txn.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {Math.abs(txn.amount).toLocaleString('ru-KZ')} ₸
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(txn)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(txn.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Показано последних {Math.min(recentTxns.length, 50)} из {activeCustomer.txns.length} транзакций
      </p>
    </Card>
  );
};
