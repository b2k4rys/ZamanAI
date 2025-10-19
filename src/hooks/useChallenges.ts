import { useState, useEffect } from "react";
import { Challenge, ChallengeAlert, Checkin } from "@/types/challenge";
import { Transaction } from "@/types/transaction";
import { toast } from "@/hooks/use-toast";
import { 
  matchesScope, 
  inDateRange, 
  getTodaySpend,
  targetFromBaseline,
  findHack,
  calcRoundup,
  clamp,
  isActive,
  buildWeekView,
  recomputeStreaks,
  estimatedDailySaving,
  autoCheckin
} from "@/lib/challengeLogic";

const STORAGE_KEY = "zaman.challenges.v2";

export function useChallenges(transactions: Transaction[]) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // Load challenges from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setChallenges(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load challenges:", e);
      }
    }
  }, []);

  // Save challenges to localStorage
  const saveChallenges = (newChallenges: Challenge[]) => {
    setChallenges(newChallenges);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newChallenges));
  };

  // Create new challenge
  const createChallenge = (challenge: Omit<Challenge, 'id' | 'saved' | 'checkins' | 'alerts' | 'currentStreak' | 'bestStreak' | 'weekView'>) => {
    const newChallenge: Challenge = {
      ...challenge,
      id: `ch_${Date.now()}`,
      saved: 0,
      checkins: [],
      alerts: [],
      currentStreak: 0,
      bestStreak: 0,
      weekView: { weekStart: new Date().toISOString(), days: [] },
    };
    
    // Build initial week view
    newChallenge.weekView = buildWeekView(newChallenge);
    
    saveChallenges([...challenges, newChallenge]);
    return newChallenge;
  };

  // Update challenge
  const updateChallenge = (id: string, updates: Partial<Challenge>) => {
    saveChallenges(
      challenges.map(ch => ch.id === id ? { ...ch, ...updates } : ch)
    );
  };

  // Delete challenge
  const deleteChallenge = (id: string) => {
    saveChallenges(challenges.filter(ch => ch.id !== id));
  };

  // Add alert to challenge
  const addAlert = (challengeId: string, type: ChallengeAlert['type'], text: string) => {
    const challenge = challenges.find(ch => ch.id === challengeId);
    if (!challenge) return;

    const alert: ChallengeAlert = {
      date: new Date().toISOString(),
      type,
      text,
    };

    updateChallenge(challengeId, {
      alerts: [...challenge.alerts, alert],
    });
  };

  // Evaluate transaction against all active challenges
  const evaluateTransaction = (txn: Transaction) => {
    challenges.forEach(challenge => {
      if (!isActive(challenge)) return;
      if (!inDateRange(txn.date, challenge)) return;
      if (!matchesScope(txn, challenge.scope)) return;
      if (txn.amount >= 0) return; // only expenses

      // Transaction matches challenge scope - potential violation
      const swearJar = findHack(challenge.hacks, 'swear_jar');
      if (swearJar?.enabled) {
        const penalty = swearJar.penalty;
        updateChallenge(challenge.id, {
          saved: challenge.saved + penalty,
        });
        addAlert(challenge.id, 'near_fail', `Трата ${Math.abs(txn.amount).toLocaleString()} ₸. Штраф ${penalty} ₸ зачислен в копилку.`);
      } else {
        addAlert(challenge.id, 'near_fail', `Трата ${Math.abs(txn.amount).toLocaleString()} ₸ по запрещённому месту`);
      }

      // Apply roundups if enabled
      const roundups = findHack(challenge.hacks, 'roundups');
      if (roundups?.enabled) {
        const roundup = calcRoundup(txn.amount, roundups.roundTo);
        if (roundup > 0) {
          updateChallenge(challenge.id, {
            saved: challenge.saved + roundup,
          });
        }
      }
    });
  };

  // Perform check-in for today
  const doCheckin = (challengeId: string, options: { note?: string; saved?: number; auto?: boolean } = {}) => {
    const challenge = challenges.find(ch => ch.id === challengeId);
    if (!challenge) return;

    const todayISO = new Date().toISOString().split('T')[0];
    const existingIdx = challenge.checkins.findIndex(c => c.date.startsWith(todayISO));
    
    const saved = options.saved ?? estimatedDailySaving(challenge);
    const checkin: Checkin = {
      date: new Date().toISOString(),
      state: 'done',
      saved,
      note: options.note,
      auto: options.auto,
    };

    let newCheckins = [...challenge.checkins];
    if (existingIdx >= 0) {
      newCheckins[existingIdx] = checkin;
    } else {
      newCheckins.push(checkin);
    }

    const newSaved = challenge.saved + saved;
    const { current, best } = recomputeStreaks({ ...challenge, checkins: newCheckins });

    updateChallenge(challengeId, {
      saved: newSaved,
      checkins: newCheckins,
      currentStreak: current,
      bestStreak: best,
      weekView: buildWeekView({ ...challenge, checkins: newCheckins }),
    });

    if (!options.auto) {
      toast({
        title: "Чек-ин засчитан! 👍",
        description: `Сэкономлено ${saved.toLocaleString()} ₸`,
      });
    }
  };

  // Daily check-in for all active challenges (auto)
  const performDailyCheckin = () => {
    challenges.forEach(challenge => {
      if (!isActive(challenge)) return;

      const todaySpend = getTodaySpend(transactions, challenge);
      const targetDaily = targetFromBaseline(challenge) / 30;
      
      // Auto check-in if within target
      if (todaySpend <= targetDaily) {
        const delta = Math.max(0, targetDaily - todaySpend);
        
        let saved = delta;
        const smartSave = findHack(challenge.hacks, 'smart_save');
        if (smartSave?.enabled && delta > 0) {
          saved += clamp(delta * 0.3, 500, smartSave.dailyMax);
        }
        
        doCheckin(challenge.id, { saved, auto: true });
      } else {
        // Mark as missed
        const todayISO = new Date().toISOString().split('T')[0];
        const existingIdx = challenge.checkins.findIndex(c => c.date.startsWith(todayISO));
        
        if (existingIdx < 0) {
          const checkin: Checkin = {
            date: new Date().toISOString(),
            state: 'missed',
            saved: 0,
            auto: true,
          };
          
          updateChallenge(challenge.id, {
            checkins: [...challenge.checkins, checkin],
            weekView: buildWeekView(challenge),
          });
        }
      }

      // Check for milestones
      const newSaved = challenge.saved;
      if (newSaved >= challenge.target.value * 0.5 && challenge.saved < challenge.target.value * 0.5) {
        addAlert(challenge.id, 'milestone', `🎉 Полпути! Уже сэкономлено ${newSaved.toLocaleString()} ₸`);
      }
    });
  };

  // Daily auto check-in for all active challenges
  const runAutoCheckins = (): Array<{ challengeId: string; message: string; saved: number }> => {
    const results: Array<{ challengeId: string; message: string; saved: number }> = [];
    
    challenges.forEach(challenge => {
      if (!isActive(challenge)) return;

      const result = autoCheckin(challenge, transactions);
      
      if (result.success) {
        // Successful day - do checkin
        doCheckin(challenge.id, { saved: result.saved, auto: true });
        results.push({ 
          challengeId: challenge.id, 
          message: result.message, 
          saved: result.saved 
        });
      } else if (result.message) {
        // Failed day with message (e.g., swear jar)
        const todayISO = new Date().toISOString().split('T')[0];
        const existingIdx = challenge.checkins.findIndex(c => c.date.startsWith(todayISO));
        
        if (existingIdx < 0) {
          const swearJar = findHack(challenge.hacks, 'swear_jar');
          const penalty = swearJar?.enabled ? swearJar.penalty : 0;
          
          const checkin: Checkin = {
            date: new Date().toISOString(),
            state: 'missed',
            saved: 0,
            auto: true,
          };
          
          let newSaved = challenge.saved;
          if (penalty > 0) {
            newSaved += penalty;
          }
          
          updateChallenge(challenge.id, {
            checkins: [...challenge.checkins, checkin],
            saved: newSaved,
            weekView: buildWeekView({ ...challenge, checkins: [...challenge.checkins, checkin] }),
          });
          
          results.push({ 
            challengeId: challenge.id, 
            message: result.message, 
            saved: penalty 
          });
        }
      }
    });
    
    return results;
  };

  return {
    challenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    addAlert,
    evaluateTransaction,
    performDailyCheckin,
    doCheckin,
    runAutoCheckins,
  };
}
