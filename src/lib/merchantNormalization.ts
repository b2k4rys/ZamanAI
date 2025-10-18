const merchantMap: Record<string, string> = {
  // Food delivery
  'dodo': 'DoDo Pizza',
  'dodopizza': 'DoDo Pizza',
  'dodo pizza': 'DoDo Pizza',
  
  // Transport
  'yandex go': 'Yandex Go',
  'yango': 'Yandex Go',
  'yandex.go': 'Yandex Go',
  'bolt': 'Bolt',
  'indrive': 'inDrive',
  
  // Groceries
  'magnum': 'Magnum',
  'магнум': 'Magnum',
  'small': 'Small',
  'смол': 'Small',
  'рамстор': 'Ramstore',
  'ramstore': 'Ramstore',
  
  // E-commerce
  'kaspi': 'Kaspi Market',
  'wildberries': 'Wildberries',
  'ozon': 'Ozon',
  
  // Fast food
  'kfc': 'KFC',
  'burger king': 'Burger King',
  'бургер кинг': 'Burger King',
  'mcdonalds': 'McDonald\'s',
  'макдоналдс': 'McDonald\'s',
  
  // Mobile operators
  'beeline': 'Beeline',
  'kcell': 'Kcell',
  'activ': 'Activ',
  'алтел': 'Altel',
  'altel': 'Altel',
  
  // Subscriptions
  'netflix': 'Netflix',
  'spotify': 'Spotify',
  'youtube premium': 'YouTube Premium',
  'apple music': 'Apple Music',
  'yandex plus': 'Yandex Plus',
  'яндекс плюс': 'Yandex Plus',
  
  // Utilities
  'алматыэнергосбыт': 'Алматыэнергосбыт',
  'казахтелеком': 'Казахтелеком',
};

export function normalizeMerchant(raw: string): string {
  const lower = raw.toLowerCase().trim();
  
  // Check direct mapping
  if (merchantMap[lower]) {
    return merchantMap[lower];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(merchantMap)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  
  // Fallback: title case first part
  const parts = raw.split(/[\s-_]+/);
  if (parts.length > 0) {
    return parts[0]
      .split('')
      .map((c, i) => i === 0 ? c.toUpperCase() : c.toLowerCase())
      .join('');
  }
  
  return raw;
}

export function categorizeMerchant(merchant: string): Category {
  const lower = merchant.toLowerCase();
  
  // Food
  if (lower.match(/pizza|burger|kfc|food|cafe|coffee|restaurant|макдоналдс|магнум|small|рамстор/)) {
    return 'Еда';
  }
  
  // Transport
  if (lower.match(/yandex|yango|bolt|indrive|taxi|такси|petrol|gas|бензин/)) {
    return 'Транспорт';
  }
  
  // Subscriptions
  if (lower.match(/netflix|spotify|youtube|apple music|yandex plus|subscription/)) {
    return 'Подписки';
  }
  
  // Mobile/Internet
  if (lower.match(/beeline|kcell|activ|altel|казахтелеком|telecom/)) {
    return 'Подписки';
  }
  
  // Utilities/Home
  if (lower.match(/энергосбыт|water|utility|rent|аренда/)) {
    return 'Дом';
  }
  
  // Entertainment
  if (lower.match(/cinema|кино|theater|theatre|game|игр/)) {
    return 'Развлечения';
  }
  
  // Education
  if (lower.match(/course|книг|book|образован|universi/)) {
    return 'Образование';
  }
  
  // Health
  if (lower.match(/аптек|pharm|clinic|hospital|doctor|врач/)) {
    return 'Здоровье';
  }
  
  // Charity
  if (lower.match(/благотвор|charity|donation|мечет|mosque/)) {
    return 'Благотворительность';
  }
  
  return 'Другое';
}

type Category = 
  | 'Еда'
  | 'Транспорт'
  | 'Дом'
  | 'Подписки'
  | 'Развлечения'
  | 'Образование'
  | 'Здоровье'
  | 'Благотворительность'
  | 'Другое';
