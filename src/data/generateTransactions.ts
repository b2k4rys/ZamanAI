import { Transaction } from "@/types/transaction";
import { normalizeMerchant, categorizeMerchant } from "@/lib/merchantNormalization";

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function tx(rawMerchant: string, amount: number, daysAgo: number): Transaction {
  const merchant = normalizeMerchant(rawMerchant);
  const category = categorizeMerchant(merchant);
  return {
    id: `tx-${Date.now()}-${Math.random()}`,
    date: randomDate(daysAgo),
    amount: -Math.abs(amount),
    rawMerchant,
    merchant,
    category,
  };
}

// Айдана: молодой специалист, высокий транспорт и подписки
export function generateAidanaTxns(): Transaction[] {
  return [
    // Transport (high)
    ...Array.from({ length: 45 }, (_, i) => tx('Yandex Go', 800 + Math.random() * 600, i * 2)),
    tx('Bolt', 1200, 15),
    tx('Bolt', 950, 28),
    
    // Food
    ...Array.from({ length: 30 }, (_, i) => tx('DoDo Pizza', 2500 + Math.random() * 1500, i * 3)),
    ...Array.from({ length: 25 }, (_, i) => tx('Magnum', 3500 + Math.random() * 2000, i * 4)),
    tx('KFC', 3200, 5),
    tx('Burger King', 2800, 12),
    tx('Small', 4500, 18),
    
    // Subscriptions
    tx('Netflix', 2990, 1),
    tx('Netflix', 2990, 31),
    tx('Netflix', 2990, 61),
    tx('Spotify', 899, 5),
    tx('Spotify', 899, 35),
    tx('Yandex Plus', 499, 10),
    tx('Yandex Plus', 499, 40),
    tx('Beeline', 8500, 3),
    tx('Beeline', 8500, 33),
    
    // Clothing
    tx('Wildberries', 18000, 8),
    tx('Kaspi Market', 12500, 22),
    tx('Ozon', 9800, 45),
    
    // Entertainment
    tx('Кинопарк', 4500, 14),
    tx('Кинопарк', 3800, 42),
    ...Array.from({ length: 10 }, (_, i) => tx('Coffee Shop', 1200 + Math.random() * 800, i * 7)),
  ];
}

// Ерлан: семья, большие расходы на дом и еду
export function generateErlanTxns(): Transaction[] {
  return [
    // Home (rent/utilities)
    tx('Аренда квартиры', 150000, 1),
    tx('Алматыэнергосбыт', 18000, 5),
    tx('Казахтелеком', 12000, 8),
    
    // Food (family groceries)
    ...Array.from({ length: 40 }, (_, i) => tx('Magnum', 8000 + Math.random() * 5000, i * 2)),
    ...Array.from({ length: 20 }, (_, i) => tx('Ramstore', 12000 + Math.random() * 8000, i * 4)),
    tx('Small', 6500, 3),
    tx('Small', 7200, 9),
    
    // Transport
    tx('Бензин Helios', 25000, 7),
    tx('Бензин Helios', 22000, 21),
    tx('Yandex Go', 1200, 14),
    tx('Yandex Go', 950, 28),
    
    // Education
    tx('Курсы английского', 30000, 2),
    tx('Книги Meloman', 8500, 15),
    tx('Школьные принадлежности', 12000, 25),
    
    // Entertainment
    tx('DoDo Pizza', 5500, 6),
    tx('KFC', 4800, 20),
    tx('Кинопарк', 8000, 18),
    
    // Subscriptions
    tx('Kcell', 15000, 4),
    tx('Kcell', 15000, 34),
    tx('YouTube Premium', 1490, 10),
    tx('YouTube Premium', 1490, 40),
  ];
}

// Алия: высокая благотворительность, цель - хадж
export function generateAliyaTxns(): Transaction[] {
  return [
    // Home
    tx('Аренда', 90000, 1),
    tx('Алматыэнергосбыт', 12000, 6),
    
    // Food
    ...Array.from({ length: 30 }, (_, i) => tx('Magnum', 4000 + Math.random() * 3000, i * 3)),
    tx('Small', 5500, 8),
    tx('Ramstore', 8000, 18),
    
    // Transport
    ...Array.from({ length: 20 }, (_, i) => tx('Yandex Go', 600 + Math.random() * 400, i * 4)),
    
    // Charity (high)
    tx('Благотворительный фонд', 25000, 1),
    tx('Мечеть пожертвование', 15000, 10),
    tx('Садака', 10000, 20),
    tx('Помощь семье', 20000, 28),
    
    // Education
    tx('Курсы арабского', 20000, 5),
    tx('Книги по исламу', 5500, 15),
    
    // Subscriptions
    tx('Beeline', 12000, 3),
    tx('Beeline', 12000, 33),
    
    // Other
    tx('Аптека', 4500, 12),
    tx('Wildberries', 8500, 22),
  ];
}

// Данияр: фриланс, высокие развлечения и подписки, интерес к инвестициям
export function generateDaniyarTxns(): Transaction[] {
  return [
    // Food
    ...Array.from({ length: 25 }, (_, i) => tx('Magnum', 4500 + Math.random() * 2500, i * 3)),
    ...Array.from({ length: 15 }, (_, i) => tx('DoDo Pizza', 3000 + Math.random() * 2000, i * 5)),
    tx('Burger King', 3500, 8),
    tx('KFC', 4200, 22),
    
    // Transport
    ...Array.from({ length: 18 }, (_, i) => tx('Yandex Go', 900 + Math.random() * 600, i * 4)),
    tx('Bolt', 1500, 12),
    
    // Subscriptions (tech-heavy)
    tx('Netflix', 2990, 2),
    tx('Netflix', 2990, 32),
    tx('Spotify', 899, 5),
    tx('Spotify', 899, 35),
    tx('YouTube Premium', 1490, 8),
    tx('YouTube Premium', 1490, 38),
    tx('Apple Music', 999, 12),
    tx('Apple Music', 999, 42),
    tx('ChatGPT Plus', 5000, 10),
    tx('ChatGPT Plus', 5000, 40),
    tx('Kcell', 18000, 4),
    tx('Kcell', 18000, 34),
    
    // Entertainment (high)
    tx('PlayStation Store', 12000, 6),
    tx('Steam', 8500, 14),
    tx('Кинопарк', 5500, 18),
    tx('Кинопарк', 4800, 42),
    ...Array.from({ length: 12 }, (_, i) => tx('Coffee Shop', 1500 + Math.random() * 1000, i * 6)),
    
    // Education/Books
    tx('Курсы программирования', 25000, 3),
    tx('Книги технические', 8500, 16),
    
    // Other
    tx('Wildberries', 15000, 20),
    tx('Kaspi Market', 12000, 35),
  ];
}
