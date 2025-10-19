import { useState, useEffect } from "react";
import { Challenge, ChallengeAlert } from "@/types/challenge";
import { Transaction } from "@/types/transaction";
import { 
  matchesScope, 
  inDateRange, 
  getTodaySpend,
  targetFromBaseline,
  findHack,
  calcRoundup,
  clamp,
  isActive
} from "@/lib/challengeLogic";

const STORAGE_KEY = "zaman.challenges.v1";

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
  const createChallenge = (challenge: Omit<Challenge, 'id' | 'saved' | 'checkins' | 'alerts'>) => {
    const newChallenge: Challenge = {
      ...challenge,
      id: `ch_${Date.now()}`,
      saved: 0,
      checkins: [],
      alerts: [],
    };
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

  // Daily check-in for all active challenges
  const performDailyCheckin = () => {
    challenges.forEach(challenge => {
      if (!isActive(challenge)) return;

      const todaySpend = getTodaySpend(transactions, challenge);
      const targetSpend = targetFromBaseline(challenge);
      const baselineDaily = challenge.baseline / 30;
      const targetDaily = targetSpend / 30;
      const delta = Math.max(0, baselineDaily - todaySpend);

      // Update saved amount
      let newSaved = challenge.saved + delta;

      // Apply smart save if enabled
      const smartSave = findHack(challenge.hacks, 'smart_save');
      if (smartSave?.enabled && delta > 0) {
        const saveAmount = clamp(delta * 0.3, 500, smartSave.dailyMax);
        newSaved += saveAmount;
      }

      updateChallenge(challenge.id, {
        saved: newSaved,
        checkins: [
          ...challenge.checkins,
          {
            date: new Date().toISOString(),
            done: todaySpend <= targetDaily,
          }
        ]
      });

      // Check for milestones
      if (newSaved >= challenge.target.value * 0.5 && challenge.saved < challenge.target.value * 0.5) {
        addAlert(challenge.id, 'milestone', `🎉 Полпути! Уже сэкономлено ${newSaved.toLocaleString()} ₸`);
      }
    });
  };

  return {
    challenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    addAlert,
    evaluateTransaction,
    performDailyCheckin,
  };
}
