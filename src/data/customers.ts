import { Customer } from "@/types/customer";
import { generateAidanaTxns, generateErlanTxns, generateAliyaTxns, generateDaniyarTxns } from "./generateTransactions";

export const customers: Customer[] = [
  {
    id: "aidana",
    name: "Айдана",
    monthlyIncome: 350000,
    savingsNow: 400000,
    expenses: [
      { category: "Еда", amount: 80000 },
      { category: "Транспорт", amount: 70000 },
      { category: "Подписки", amount: 25000 },
      { category: "Одежда", amount: 35000 },
      { category: "Развлечения", amount: 40000 },
      { category: "Другое", amount: 30000 },
    ],
    goals: [
      { 
        id: crypto.randomUUID(), 
        name: "Авто", 
        targetAmount: 5000000, 
        savedAmount: 1200000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "Car"
      },
      { 
        id: crypto.randomUUID(), 
        name: "Подушка безопасности", 
        targetAmount: 1000000, 
        savedAmount: 400000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "Shield"
      },
    ],
    language: "ru",
    txns: generateAidanaTxns(),
  },
  {
    id: "erlan",
    name: "Ерлан",
    monthlyIncome: 550000,
    savingsNow: 2500000,
    expenses: [
      { category: "Еда", amount: 120000 },
      { category: "Дом", amount: 150000 },
      { category: "Транспорт", amount: 60000 },
      { category: "Образование", amount: 50000 },
      { category: "Развлечения", amount: 45000 },
      { category: "Другое", amount: 40000 },
    ],
    goals: [
      { 
        id: crypto.randomUUID(), 
        name: "Квартира", 
        targetAmount: 30000000, 
        savedAmount: 8500000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "Home"
      },
      { 
        id: crypto.randomUUID(), 
        name: "Образование детей", 
        targetAmount: 5000000, 
        savedAmount: 2000000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "GraduationCap"
      },
    ],
    language: "ru",
    txns: generateErlanTxns(),
  },
  {
    id: "aliya",
    name: "Алия",
    monthlyIncome: 420000,
    savingsNow: 3200000,
    expenses: [
      { category: "Еда", amount: 70000 },
      { category: "Дом", amount: 90000 },
      { category: "Транспорт", amount: 40000 },
      { category: "Благотворительность", amount: 50000 },
      { category: "Образование", amount: 30000 },
      { category: "Другое", amount: 35000 },
    ],
    goals: [
      { 
        id: crypto.randomUUID(), 
        name: "Хадж", 
        targetAmount: 2500000, 
        savedAmount: 1800000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "Plane"
      },
      { 
        id: crypto.randomUUID(), 
        name: "Благотворительность", 
        targetAmount: 1000000, 
        savedAmount: 650000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "Heart"
      },
    ],
    language: "ru",
    txns: generateAliyaTxns(),
  },
  {
    id: "daniyar",
    name: "Данияр",
    monthlyIncome: 480000,
    savingsNow: 4500000,
    expenses: [
      { category: "Еда", amount: 75000 },
      { category: "Транспорт", amount: 50000 },
      { category: "Подписки", amount: 35000 },
      { category: "Развлечения", amount: 55000 },
      { category: "Образование", amount: 40000 },
      { category: "Другое", amount: 45000 },
    ],
    goals: [
      { 
        id: crypto.randomUUID(), 
        name: "Инвестиционный портфель", 
        targetAmount: 10000000, 
        savedAmount: 6200000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "TrendingUp"
      },
      { 
        id: crypto.randomUUID(), 
        name: "Пассивный доход", 
        targetAmount: 5000000, 
        savedAmount: 2800000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: "Wallet"
      },
    ],
    language: "ru",
    txns: generateDaniyarTxns(),
  },
];
