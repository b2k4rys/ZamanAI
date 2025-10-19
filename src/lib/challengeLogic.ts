import { Challenge, ChallengeScope, SaveHack, Checkin, DayState, WeekDay, WeekView } from "@/types/challenge";
import { Transaction } from "@/types/transaction";
import { startOfWeek, addDays, isToday, isSameDay } from "date-fns";

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

/**
 * Build week view for challenge (Mon-Sun)
 */
export function buildWeekView(challenge: Challenge, now: Date = new Date()): WeekView {
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  
  return {
    weekStart: start.toISOString(),
    days: [...Array(7)].map((_, i) => {
      const d = addDays(start, i);
      const checkin = challenge.checkins.find(c => isSameDay(new Date(c.date), d));
      
      let state: DayState = 'rest';
      const challengeStart = new Date(challenge.startDate);
      const challengeEnd = new Date(challenge.endDate);
      
      if (d < challengeStart || d > challengeEnd) {
        state = 'rest';
      } else if (isToday(d)) {
        state = checkin?.state ?? 'today';
      } else if (d > new Date()) {
        state = 'rest';
      } else {
        state = checkin?.state ?? 'missed';
      }
      
      return { 
        w: i as WeekDay, 
        state,
        saved: checkin?.saved 
      };
    })
  };
}

/**
 * Recompute streaks based on checkins
 */
export function recomputeStreaks(challenge: Challenge): { current: number; best: number } {
  const sortedCheckins = [...challenge.checkins]
    .filter(c => c.state === 'done')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sortedCheckins.length === 0) {
    return { current: 0, best: 0 };
  }
  
  let current = 0;
  let maxStreak = 0;
  let tempStreak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate current streak from today backwards
  for (let i = 0; i < sortedCheckins.length; i++) {
    const checkinDate = new Date(sortedCheckins[i].date);
    checkinDate.setHours(0, 0, 0, 0);
    
    if (i === 0) {
      // Check if most recent checkin is today or yesterday
      const daysDiff = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        current = 1;
      }
    } else {
      const prevDate = new Date(sortedCheckins[i - 1].date);
      prevDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((prevDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        if (i < current || current === 0) {
          current++;
        }
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  
  maxStreak = Math.max(maxStreak, tempStreak);
  const best = Math.max(challenge.bestStreak, maxStreak, current);
  
  return { current, best };
}

/**
 * Estimate daily saving based on baseline and target
 */
export function estimatedDailySaving(challenge: Challenge): number {
  const target = targetFromBaseline(challenge);
  const potentialSaving = challenge.baseline - target;
  return Math.round(potentialSaving / challenge.durationDays);
}

/**
 * Get week day label (Mon-Sun in Russian)
 */
export function getWeekDayLabel(day: WeekDay): string {
  const labels = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];
  return labels[day];
}

/**
 * Auto check-in challenge based on today's transactions
 * Returns { success: boolean, message?: string } for AI notification
 */
export function autoCheckin(
  challenge: Challenge, 
  transactions: Transaction[]
): { success: boolean; message: string; saved: number } {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already checked in today
  const existingCheckin = challenge.checkins.find(c => c.date === today);
  if (existingCheckin) {
    return { success: false, message: '', saved: 0 };
  }

  // Get today's transactions matching challenge scope
  const relevantTxns = transactions.filter(txn => {
    if (!txn.date.startsWith(today)) return false;
    if (txn.amount >= 0) return false; // only expenses
    return matchesScope(txn, challenge.scope);
  });

  const dailySaving = estimatedDailySaving(challenge);

  if (relevantTxns.length === 0) {
    // Success! No violations today
    const message = challenge.scope.kind === 'merchant'
      ? `Отлично! Сегодня без ${challenge.scope.value} — +${dailySaving.toLocaleString()} ₸ в копилку 🌿`
      : `Отлично! Сегодня категория ${challenge.scope.value} под контролем — +${dailySaving.toLocaleString()} ₸ 🌿`;
    
    return { success: true, message, saved: dailySaving };
  } else {
    // Violation detected
    const swearJar = findHack(challenge.hacks, 'swear_jar');
    const penalty = swearJar?.enabled ? swearJar.penalty : 0;
    
    const message = challenge.scope.kind === 'merchant'
      ? `Сегодня был визит в ${challenge.scope.value}${penalty > 0 ? `, но не страшно — я зачёл штраф ${penalty.toLocaleString()} ₸ в копилку 💡` : ''}`
      : `Сегодня были траты в категории ${challenge.scope.value}${penalty > 0 ? `, но зато штраф ${penalty.toLocaleString()} ₸ пошёл в копилку 💡` : ''}`;
    
    return { success: false, message, saved: 0 };
  }
}
