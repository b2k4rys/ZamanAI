import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, Transaction } from '@/types/customer';
import { customers as seedCustomers } from '@/data/customers';
import { normalizeMerchant, categorizeMerchant } from '@/lib/merchantNormalization';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'zaman.customers.v1';
const ACTIVE_KEY = 'zaman.activeCustomerId';

interface CustomerContextType {
  customers: Customer[];
  activeCustomer: Customer;
  setActiveCustomerId: (id: string) => void;
  addTransaction: (txn: Omit<Transaction, 'id' | 'merchant' | 'category'>) => void;
  updateTransaction: (txnId: string, txn: Partial<Transaction>) => void;
  deleteTransaction: (txnId: string) => void;
  generateMonth: () => void;
  resetToSeed: () => void;
  exportCustomer: () => string;
  importCustomer: (json: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

function loadCustomers(): Customer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load customers from localStorage', e);
  }
  return seedCustomers;
}

function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (e) {
    console.error('Failed to save customers to localStorage', e);
  }
}

function getActiveCustomerId(): string {
  return localStorage.getItem(ACTIVE_KEY) || seedCustomers[0].id;
}

function setActiveCustomerIdStorage(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [activeCustomerId, setActiveCustomerIdState] = useState<string>(() => getActiveCustomerId());

  const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  const setActiveCustomerId = (id: string) => {
    setActiveCustomerIdState(id);
    setActiveCustomerIdStorage(id);
    toast({
      title: 'Клиент изменён',
      description: `Переключено на ${customers.find(c => c.id === id)?.name}`,
    });
  };

  const addTransaction = (txn: Omit<Transaction, 'id' | 'merchant' | 'category'>) => {
    const merchant = normalizeMerchant(txn.rawMerchant);
    const category = categorizeMerchant(merchant);
    
    const newTxn: Transaction = {
      ...txn,
      id: `tx-${Date.now()}-${Math.random()}`,
      merchant,
      category,
    };

    setCustomers(prev => 
      prev.map(c => 
        c.id === activeCustomerId
          ? { ...c, txns: [...c.txns, newTxn] }
          : c
      )
    );

    toast({
      title: 'Транзакция добавлена',
      description: `${merchant}: ${Math.abs(txn.amount).toLocaleString('ru-KZ')} ₸`,
    });
  };

  const updateTransaction = (txnId: string, updates: Partial<Transaction>) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === activeCustomerId
          ? {
              ...c,
              txns: c.txns.map(t =>
                t.id === txnId
                  ? {
                      ...t,
                      ...updates,
                      merchant: updates.rawMerchant
                        ? normalizeMerchant(updates.rawMerchant)
                        : t.merchant,
                      category: updates.rawMerchant
                        ? categorizeMerchant(normalizeMerchant(updates.rawMerchant))
                        : t.category,
                    }
                  : t
              ),
            }
          : c
      )
    );

    toast({
      title: 'Транзакция обновлена',
    });
  };

  const deleteTransaction = (txnId: string) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === activeCustomerId
          ? { ...c, txns: c.txns.filter(t => t.id !== txnId) }
          : c
      )
    );

    toast({
      title: 'Транзакция удалена',
      variant: 'destructive',
    });
  };

  const generateMonth = () => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === activeCustomerId
          ? {
              ...c,
              txns: c.txns.map(t => ({
                ...t,
                amount: Math.round(t.amount * (0.9 + Math.random() * 0.2)),
              })),
            }
          : c
      )
    );

    toast({
      title: 'Месяц сгенерирован',
      description: 'Расходы обновлены с вариацией ±10%',
    });
  };

  const resetToSeed = () => {
    setCustomers(seedCustomers);
    setActiveCustomerId(seedCustomers[0].id);
    toast({
      title: 'Данные сброшены',
      description: 'Восстановлены исходные профили',
    });
  };

  const exportCustomer = (): string => {
    return JSON.stringify(activeCustomer, null, 2);
  };

  const importCustomer = (json: string) => {
    try {
      const imported = JSON.parse(json) as Customer;
      
      if (!imported.id || !imported.name || !imported.txns) {
        throw new Error('Invalid customer format');
      }

      setCustomers(prev => {
        const existing = prev.find(c => c.id === imported.id);
        if (existing) {
          return prev.map(c => (c.id === imported.id ? imported : c));
        }
        return [...prev, imported];
      });

      setActiveCustomerId(imported.id);

      toast({
        title: 'Профиль импортирован',
        description: `Загружен профиль ${imported.name}`,
      });
    } catch (e) {
      toast({
        title: 'Ошибка импорта',
        description: 'Неверный формат JSON',
        variant: 'destructive',
      });
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        activeCustomer,
        setActiveCustomerId,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        generateMonth,
        resetToSeed,
        exportCustomer,
        importCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
}
