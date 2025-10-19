import { Goal } from '@/types/goal';

const CUSTOMERS_KEY = 'zaman.customers.v1';
const ACTIVE_CUSTOMER_KEY = 'zaman.activeCustomerId';

type Customer = {
  id: string;
  name: string;
  txns: any[];
  goals?: Goal[];
  [key: string]: any;
};

export function getActiveCustomer() {
  const id = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
  if (!id) {
    throw new Error('No active customer');
  }

  const customersJson = localStorage.getItem(CUSTOMERS_KEY);
  if (!customersJson) {
    throw new Error('No customers data');
  }

  const customers: Customer[] = JSON.parse(customersJson);
  const idx = customers.findIndex((c: Customer) => c.id === id);
  
  if (idx === -1) {
    throw new Error('Active customer not found');
  }

  return { customers, idx, customer: customers[idx] };
}

export function getGoals(): Goal[] {
  try {
    const { customer } = getActiveCustomer();
    return customer.goals || [];
  } catch (e) {
    console.error('Failed to get goals:', e);
    return [];
  }
}

export function saveGoals(nextGoals: Goal[]) {
  try {
    const { customers, idx } = getActiveCustomer();
    customers[idx].goals = nextGoals;
    customers[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    
    // Dispatch event for UI synchronization
    window.dispatchEvent(new CustomEvent('goals:updated'));
  } catch (e) {
    console.error('Failed to save goals:', e);
    throw e;
  }
}

export function addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
  const goals = getGoals();
  const newGoal: Goal = {
    ...goal,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveGoals([...goals, newGoal]);
  return newGoal;
}

export function updateGoal(goalId: string, updates: Partial<Goal>) {
  const goals = getGoals();
  const updatedGoals = goals.map(g => 
    g.id === goalId 
      ? { ...g, ...updates, updatedAt: new Date().toISOString() }
      : g
  );
  saveGoals(updatedGoals);
}

export function deleteGoal(goalId: string) {
  const goals = getGoals();
  saveGoals(goals.filter(g => g.id !== goalId));
}

export function addContribution(goalId: string, amount: number) {
  const goals = getGoals();
  const updatedGoals = goals.map(g => {
    if (g.id === goalId) {
      const newSavedAmount = (Number(g.savedAmount) || 0) + amount;
      return {
        ...g,
        savedAmount: newSavedAmount,
        updatedAt: new Date().toISOString(),
      };
    }
    return g;
  });
  saveGoals(updatedGoals);
}
