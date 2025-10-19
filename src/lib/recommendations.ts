import { Customer } from "@/types/customer";
import { Product, Recommendation } from "@/types/product";

export function recommend(customer: Customer, products: Product[]): Recommendation[] {
  const spend = Object.fromEntries(
    customer.expenses.map((e) => [e.category, e.amount])
  );
  const total = customer.expenses.reduce((s, e) => s + e.amount, 0);
  const freeCash = Math.max(customer.monthlyIncome - total, 0);
  
  const hasGoal = (name: string) =>
    (customer.goals || []).some((g) => g.name && g.name.toLowerCase().includes(name.toLowerCase()));

  const list: Recommendation[] = [];

  for (const p of products) {
    let score = 0;
    const why: string[] = [];

    // Депозит
    if (p.kind === "deposit" && !p.name.includes("Хадж")) {
      if (customer.savingsNow < 3 * total) {
        score += 60;
        why.push("Подушка < 3 месяцев расходов");
      }
      if (freeCash > 0) {
        score += 15;
        why.push(
          `Можно откладывать ~${Math.round(freeCash * 0.2).toLocaleString("ru-KZ")} ₸/мес`
        );
      }
    }

    // Хадж-копилка
    if (p.name.includes("Хадж")) {
      if (hasGoal("хадж")) {
        score += 70;
        why.push("Цель «Хадж» — специальный счёт");
      }
      if ((spend["Благотворительность"] || 0) > 0.08 * total) {
        score += 25;
        why.push("Высокая благотворительность");
      }
    }

    // Иджара Авто
    if (p.kind === "ijara" && p.name.includes("Авто")) {
      if ((spend["Транспорт"] || 0) > 0.18 * total) {
        score += 40;
        why.push("Высокие расходы на транспорт");
      }
      if (hasGoal("авто")) {
        score += 30;
        why.push("Цель «Авто»");
      }
    }

    // Иджара Жильё
    if (p.kind === "ijara" && p.name.includes("Жиль")) {
      if ((spend["Дом"] || 0) > 0.25 * total || hasGoal("квартир")) {
        score += 50;
        why.push("Цель «Квартира» / высокие расходы Дом");
      }
    }

    // Мурабаха
    if (p.kind === "murabaha") {
      const leisure = (spend["Подписки"] || 0) + (spend["Развлечения"] || 0);
      if (leisure > 0.15 * total) {
        score += 35;
        why.push("Высокие подписки/развлечения — рассрочка без риба");
      }
    }

    // Инвестиции
    if (p.kind === "invest") {
      if (
        customer.savingsNow >= 3 * total &&
        freeCash >= 0.15 * customer.monthlyIncome
      ) {
        score += 60;
        why.push("Есть запас >3 мес и свободный остаток ≥15%");
      }
      if (hasGoal("инвест") || hasGoal("портфель") || hasGoal("пассив")) {
        score += 25;
        why.push("Цель связана с инвестициями");
      }
    }

    // Карта
    if (p.kind === "card") {
      const heavy = (spend["Еда"] || 0) + (spend["Транспорт"] || 0);
      if (heavy > 0.35 * total) {
        score += 30;
        why.push("Кэшбек окупит часть повседневных трат");
      }
    }

    if (score > 0) {
      list.push({
        product: { ...p },
        score: Math.min(100, score),
        why: why.slice(0, 2),
      });
    }
  }

  // Сортировка и бейджи
  list.sort((a, b) => b.score - a.score);
  
  if (list[0]) {
    list[0].product.badge = "Рекомендовано";
  }
  
  list.forEach((r) => {
    if (r.product.kind === "ijara" && r.product.name.includes("Авто") && !r.product.badge) {
      r.product.badge = "Популярно";
    }
    if ((hasGoal("квартир") || hasGoal("хадж")) && !r.product.badge) {
      r.product.badge = "Для целей";
    }
  });

  return list.slice(0, 4);
}

export function generateMonthVariation(customer: Customer): Customer {
  return {
    ...customer,
    expenses: customer.expenses.map((e) => ({
      ...e,
      amount: Math.round(e.amount * (0.9 + Math.random() * 0.2)),
    })),
  };
}
