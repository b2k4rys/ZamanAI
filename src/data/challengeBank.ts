import { ChallengeTemplate } from "@/types/challengeTemplate";

export const CHALLENGE_BANK_KEY = "zaman.challengeBank.v1";

export const DEFAULT_CHALLENGE_BANK: ChallengeTemplate[] = [
  {
    id: "tpl.taxi.month.40k",
    title: "Такси ≤ 40 000 ₸ в месяц",
    place: "Yandex Go",
    period: "month",
    targetAmount: 15000,
    defaultSaved: 0,
    icon: "🚕",
    scope: { kind: 'merchant', value: 'Yandex Go' },
  },
  {
    id: "tpl.food.week.noDelivery",
    title: "Еда: неделя без доставки",
    period: "week",
    targetAmount: 7000,
    defaultSaved: 0,
    icon: "🍔",
    scope: { kind: 'category', value: 'Еда' },
  },
  {
    id: "tpl.subs.month.minusOne",
    title: "Подписки −1 в этом месяце",
    period: "month",
    targetAmount: 3000,
    defaultSaved: 0,
    icon: "📺",
    note: "Проверить Netflix/IVI/Okko",
  },
  {
    id: "tpl.coffee.week.10k",
    title: "Кофе-брейк ≤ 10 000 ₸ в неделю",
    place: "Starbucks",
    period: "week",
    targetAmount: 10000,
    defaultSaved: 0,
    icon: "☕",
    scope: { kind: 'merchant', value: 'Starbucks' },
  },
  {
    id: "tpl.entertain.month.30k",
    title: "Развлечения ≤ 30 000 ₸ в месяц",
    period: "month",
    targetAmount: 30000,
    defaultSaved: 0,
    icon: "🎉",
    scope: { kind: 'category', value: 'Развлечения' },
  },
  {
    id: "tpl.taxi.walk.3x",
    title: "Прогулки вместо такси: 3 раза/неделю",
    period: "week",
    targetAmount: 3,
    defaultSaved: 0,
    icon: "🚶",
    note: "2–3 км пешком",
  },
  {
    id: "tpl.groceries.week.20k",
    title: "Продукты ≤ 20 000 ₸ в неделю",
    period: "week",
    targetAmount: 20000,
    defaultSaved: 0,
    icon: "🛒",
    scope: { kind: 'category', value: 'Продукты' },
  },
  {
    id: "tpl.shopping.month.minus15",
    title: "Шопинг: −15% к прошлому месяцу",
    period: "month",
    targetAmount: 50000,
    defaultSaved: 0,
    icon: "🛍️",
    scope: { kind: 'category', value: 'Одежда' },
  },
  {
    id: "tpl.transport.month.minus20",
    title: "Транспорт: −20% к прошлому месяцу",
    period: "month",
    targetAmount: 40000,
    defaultSaved: 0,
    icon: "🚌",
    scope: { kind: 'category', value: 'Транспорт' },
  },
  {
    id: "tpl.eatingout.week.2x",
    title: "Еда вне дома ≤ 2 раза/неделю",
    period: "week",
    targetAmount: 2,
    defaultSaved: 0,
    icon: "🍽️",
    scope: { kind: 'category', value: 'Рестораны' },
  },
  {
    id: "tpl.streams.clean",
    title: "Пересмотреть подписки: оставить ≤ 2",
    period: "month",
    targetAmount: 10000,
    defaultSaved: 0,
    icon: "📱",
    note: "Отменить неиспользуемые",
  },
  {
    id: "tpl.cashback.hunt",
    title: "Охота за кэшбеком: вернуть ≥ 3 000 ₸",
    period: "month",
    targetAmount: 3000,
    defaultSaved: 0,
    icon: "💰",
    note: "Использовать карту с максимальным кэшбеком",
  },
];

export const getChallengeBank = (): ChallengeTemplate[] => {
  const stored = localStorage.getItem(CHALLENGE_BANK_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load challenge bank:", e);
    }
  }
  
  // Save default bank
  localStorage.setItem(CHALLENGE_BANK_KEY, JSON.stringify(DEFAULT_CHALLENGE_BANK));
  return DEFAULT_CHALLENGE_BANK;
};
