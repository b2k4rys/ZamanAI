export type ProductType = 'deposit' | 'murabaha' | 'ijara' | 'invest';

export interface ProductMock {
  id: string;
  name: string;
  type: ProductType;
  emoji: string;
  apr: string;
  pitch: string;
  cta: { label: string; action: string }[];
  details?: string;
}

export const PRODUCTS_MOCK: ProductMock[] = [
  {
    id: 'deposit_halal',
    type: 'deposit',
    emoji: '🏦',
    name: 'Халяль-депозит',
    apr: 'до ~15% годовых (прибыль)',
    pitch: 'Есть свободный остаток ≥30 000 ₸ — можно регулярно откладывать.',
    cta: [
      { label: 'Открыть депозит', action: 'open_product:deposit_halal' },
      { label: 'Рассчитать взнос', action: 'open_calculator:deposit' }
    ],
    details: 'Халяль-депозит — накопительный счёт по принципам исламского банкинга. Надёжный депозит с гарантированной доходностью, соответствующий принципам Шариата. Без риба, без неопределённости.'
  },
  {
    id: 'murabaha_tech',
    type: 'murabaha',
    emoji: '📱',
    name: 'Мурабаха (Техника)',
    apr: '~8% экв. прибыли',
    pitch: 'Высокие траты на подписки/развлечения — рассрочка без рибы.',
    cta: [
      { label: 'Подробнее', action: 'open_product:murabaha_tech' }
    ],
    details: 'Халяль-рассрочка на покупку техники, мебели, товаров для дома. Фиксированная наценка без процентов по принципам Шариата.'
  },
  {
    id: 'ijara_auto',
    type: 'ijara',
    emoji: '🚗',
    name: 'Иджара (Авто)',
    apr: '~12% экв. прибыли',
    pitch: 'Планируете авто на 12–36 мес — без процентной переплаты.',
    cta: [
      { label: 'Узнать условия', action: 'open_product:ijara_auto' }
    ],
    details: 'Халяль-финансирование автомобиля по принципу аренды с правом выкупа. Прозрачные условия, без скрытых комиссий.'
  },
  {
    id: 'invest_barkat',
    type: 'invest',
    emoji: '📈',
    name: 'Инвестиции «Баркат»',
    apr: 'от ~18% годовых',
    pitch: 'Запас ≥3 мес и свободный остаток — можно часть направить в проекты.',
    cta: [
      { label: 'Посмотреть проект', action: 'open_product:invest_barkat' },
      { label: 'Оценить риск', action: 'open_risk_disclaimer' }
    ],
    details: 'Инвестиционный портфель из халяль-активов. Диверсификация, профессиональное управление, прозрачная отчётность.'
  }
];
