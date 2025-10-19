import { Challenge, ChallengeScope, SaveHack } from "@/types/challenge";
import { Transaction } from "@/types/transaction";

/**
 * Calculate baseline spending for a scope over the past N days
 */
export function calcBaseline(
  txns: Transaction[], 
  scope: ChallengeScope, 
  days: number = 60
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const relevantTxns = txns.filter(t => {
    const txDate = new Date(t.date);
    if (txDate < cutoff) return false;
    if (t.amount >= 0) return false; // only expenses
    
    return matchesScope(t, scope);
  });
  
  const total = relevantTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const avgPerMonth = total / Math.max(1, days / 30);
  
  return Math.round(avgPerMonth);
}

/**
 * Check if a transaction matches the challenge scope
 */
export function matchesScope(txn: Transaction, scope: ChallengeScope): boolean {
  if (scope.kind === 'category') {
    return txn.category === scope.value;
  } else {
    return txn.merchant?.toLowerCase() === scope.value.toLowerCase();
  }
}

/**
 * Check if transaction is within challenge date range
 */
export function inDateRange(txnDate: string, challenge: Challenge): boolean {
  const date = new Date(txnDate);
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);
  return date >= start && date <= end;
}

/**
 * Calculate target spending based on baseline and challenge target
 */
export function targetFromBaseline(challenge: Challenge): number {
  if (challenge.target.mode === 'percent') {
    return Math.round(challenge.baseline * (1 - challenge.target.value / 100));
  } else {
    return Math.round(challenge.baseline - challenge.target.value);
  }
}

/**
 * Get spending for a scope within a date range
 */
export function spendForScope(
  txns: Transaction[],
  scope: ChallengeScope,
  startDate: Date,
  endDate: Date
): number {
  return txns
    .filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate && 
             t.amount < 0 && 
             matchesScope(t, scope);
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Get today's spending for challenge scope
 */
export function getTodaySpend(txns: Transaction[], challenge: Challenge): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return spendForScope(txns, challenge.scope, today, tomorrow);
}

/**
 * Find a specific hack in challenge hacks
 */
export function findHack<T extends SaveHack['type']>(
  hacks: SaveHack[],
  type: T
): Extract<SaveHack, { type: T }> | undefined {
  return hacks.find(h => h.type === type) as Extract<SaveHack, { type: T }> | undefined;
}

/**
 * Calculate roundup amount
 */
export function calcRoundup(amount: number, roundTo: number): number {
  const abs = Math.abs(amount);
  const remainder = abs % roundTo;
  return remainder === 0 ? 0 : roundTo - remainder;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate days remaining in challenge
 */
export function daysRemaining(challenge: Challenge): number {
  const now = new Date();
  const end = new Date(challenge.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate days since challenge started
 */
export function daysElapsed(challenge: Challenge): number {
  const now = new Date();
  const start = new Date(challenge.startDate);
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate challenge progress (0-100)
 */
export function calcProgress(challenge: Challenge): number {
  const target = targetFromBaseline(challenge);
  const potential = challenge.baseline - target;
  if (potential <= 0) return 0;
  
  const progress = (challenge.saved / potential) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Check if challenge is still active (not expired)
 */
export function isActive(challenge: Challenge): boolean {
  if (challenge.status !== 'active') return false;
  const now = new Date();
  const end = new Date(challenge.endDate);
  return now <= end;
}

/**
 * Get challenge status color
 */
export function getStatusColor(status: Challenge['status']): string {
  switch (status) {
    case 'active': return 'text-primary';
    case 'completed': return 'text-green-600';
    case 'paused': return 'text-yellow-600';
    case 'failed': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
}

/**
 * Get challenge status badge variant
 */
export function getStatusVariant(status: Challenge['status']): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'active': return 'default';
    case 'completed': return 'secondary';
    case 'paused': return 'outline';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
}
