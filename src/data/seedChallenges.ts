import { Challenge } from "@/types/challenge";

export const seedChallenges: Omit<Challenge, 'id' | 'saved' | 'checkins' | 'alerts'>[] = [
  {
    title: "7 дней без кофе ☕",
    scope: { kind: 'merchant', value: 'Starbucks' },
    durationDays: 7,
    target: { mode: 'amount', value: 10000 },
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baseline: 15000,
    status: 'active',
    hacks: [
      { type: 'swear_jar', enabled: true, penalty: 1000 }
    ],
  },
  {
    title: "−30% на доставку до конца месяца 🍕",
    scope: { kind: 'category', value: 'Еда' },
    durationDays: 30,
    target: { mode: 'percent', value: 30 },
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baseline: 80000,
    status: 'active',
    hacks: [
      { type: 'roundups', enabled: true, roundTo: 100 },
      { type: 'smart_save', enabled: true, dailyMax: 1500 }
    ],
    goalId: 'apt',
  },
  {
    title: "Такси ≤ 40 000 ₸ в месяц 🚕",
    scope: { kind: 'merchant', value: 'Yandex Go' },
    durationDays: 30,
    target: { mode: 'amount', value: 15000 },
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baseline: 55000,
    status: 'active',
    hacks: [
      { type: 'smart_save', enabled: true, dailyMax: 1500 }
    ],
  },
];
