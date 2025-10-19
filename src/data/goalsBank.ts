import { GoalTemplate } from "@/types/goalTemplate";

export const GOALS_BANK_KEY = "zaman.goalsBank.v1";

export const DEFAULT_GOALS_BANK: GoalTemplate[] = [
  {
    id: "tpl.apartment.1room",
    type: "Квартира",
    name: "1-комнатная квартира",
    targetAmount: 20000000,
    monthlyPlan: 500000,
    deadline: "+40m",
    icon: "🏠",
    tags: ["недвижимость", "жилье"],
    description: "Первоначальный взнос на однокомнатную квартиру",
  },
  {
    id: "tpl.apartment.2room",
    type: "Квартира",
    name: "2-комнатная квартира",
    targetAmount: 35000000,
    monthlyPlan: 700000,
    deadline: "+50m",
    icon: "🏡",
    tags: ["недвижимость", "семья"],
    description: "Первоначальный взнос на двухкомнатную квартиру",
  },
  {
    id: "tpl.hajj.family",
    type: "Хадж",
    name: "Хадж (семья 2 чел)",
    targetAmount: 3000000,
    monthlyPlan: 150000,
    deadline: "+20m",
    icon: "🕌",
    tags: ["паломничество", "семья"],
    description: "Поездка на Хадж для двоих",
  },
  {
    id: "tpl.hajj.single",
    type: "Хадж",
    name: "Хадж (1 чел)",
    targetAmount: 1500000,
    monthlyPlan: 100000,
    deadline: "+15m",
    icon: "☪️",
    tags: ["паломничество"],
    description: "Поездка на Хадж",
  },
  {
    id: "tpl.edu.masters",
    type: "Образование",
    name: "Магистратура",
    targetAmount: 2500000,
    monthlyPlan: 125000,
    deadline: "+20m",
    icon: "🎓",
    tags: ["учеба", "карьера"],
    description: "Оплата магистерской программы",
  },
  {
    id: "tpl.edu.child",
    type: "Образование",
    name: "Образование ребенка",
    targetAmount: 5000000,
    monthlyPlan: 100000,
    deadline: "+50m",
    icon: "📚",
    tags: ["дети", "будущее"],
    description: "Фонд на обучение ребенка",
  },
  {
    id: "tpl.auto.new",
    type: "Авто",
    name: "Новый автомобиль",
    targetAmount: 8000000,
    monthlyPlan: 300000,
    deadline: "+27m",
    icon: "🚗",
    tags: ["транспорт"],
    description: "Первоначальный взнос на новое авто",
  },
  {
    id: "tpl.auto.used",
    type: "Авто",
    name: "Подержанный автомобиль",
    targetAmount: 3000000,
    monthlyPlan: 250000,
    deadline: "+12m",
    icon: "🚙",
    tags: ["транспорт", "экономия"],
    description: "Покупка авто с пробегом",
  },
  {
    id: "tpl.reserve.3m",
    type: "Резерв",
    name: "Резерв на 3 месяца",
    targetAmount: 900000,
    monthlyPlan: 100000,
    deadline: "+9m",
    icon: "🛡️",
    tags: ["безопасность"],
    description: "Финансовая подушка безопасности",
  },
  {
    id: "tpl.reserve.6m",
    type: "Резерв",
    name: "Резерв на 6 месяцев",
    targetAmount: 1800000,
    monthlyPlan: 150000,
    deadline: "+12m",
    icon: "💰",
    tags: ["безопасность", "стабильность"],
    description: "Расширенная финансовая подушка",
  },
  {
    id: "tpl.custom.wedding",
    type: "Своя",
    name: "Свадьба",
    targetAmount: 5000000,
    monthlyPlan: 300000,
    deadline: "+17m",
    icon: "💍",
    tags: ["семья", "событие"],
    description: "Организация свадебного торжества",
  },
  {
    id: "tpl.custom.vacation",
    type: "Своя",
    name: "Отпуск мечты",
    targetAmount: 1000000,
    monthlyPlan: 100000,
    deadline: "+10m",
    icon: "✈️",
    tags: ["путешествие", "отдых"],
    description: "Поездка в отпуск",
  },
];

export const getGoalsBank = (): GoalTemplate[] => {
  const stored = localStorage.getItem(GOALS_BANK_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load goals bank:", e);
    }
  }
  
  // Save default bank
  localStorage.setItem(GOALS_BANK_KEY, JSON.stringify(DEFAULT_GOALS_BANK));
  return DEFAULT_GOALS_BANK;
};
