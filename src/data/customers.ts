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
      { title: "Авто", target: 5000000 },
      { title: "Подушка безопасности", target: 1000000 },
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
      { title: "Квартира", target: 30000000 },
      { title: "Образование детей", target: 5000000 },
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
      { title: "Хадж", target: 2500000 },
      { title: "Благотворительность", target: 1000000 },
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
      { title: "Инвестиционный портфель", target: 10000000 },
      { title: "Пассивный доход", target: 5000000 },
    ],
    language: "ru",
    txns: generateDaniyarTxns(),
  },
];
