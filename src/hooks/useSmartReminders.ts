import { useState, useEffect } from "react";
import { Reminder, ReminderState } from "@/types/reminder";
import { Transaction } from "@/types/transaction";
import { Goal } from "@/types/goal";
import { Challenge } from "@/types/challenge";
import { generateReminders } from "@/lib/reminderDetection";
import { differenceInHours } from "date-fns";

const STORAGE_KEY = "zaman.reminders.v1";
const COOLDOWN_HOURS = 6;

export function useSmartReminders(
  txns: Transaction[],
  goals: Goal[],
  challenges: Challenge[]
) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setReminders(parsed);
      } catch (e) {
        console.error("Failed to load reminders:", e);
      }
    }
  }, []);

  // Save to localStorage
  const saveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newReminders));
  };

  // Check if we should generate new reminders (respect cooldown)
  const shouldGenerate = () => {
    const lastGenerated = reminders
      .filter(r => r.state === 'new' || r.state === 'shown')
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0];

    if (!lastGenerated) return true;

    const hoursSince = differenceInHours(new Date(), new Date(lastGenerated.ts));
    return hoursSince >= COOLDOWN_HOURS;
  };

  // Generate new reminders
  const refresh = () => {
    if (!shouldGenerate()) return;

    const newReminders = generateReminders(txns, goals, challenges);
    
    // Dedupe with existing
    const existingIds = new Set(reminders.map(r => r.id));
    const filtered = newReminders.filter(r => !existingIds.has(r.id));

    if (filtered.length > 0) {
      saveReminders([...reminders, ...filtered]);
    }
  };

  // Update reminder state
  const updateReminder = (id: string, state: ReminderState) => {
    saveReminders(
      reminders.map(r => r.id === id ? { ...r, state } : r)
    );
  };

  // Dismiss reminder
  const dismissReminder = (id: string) => {
    updateReminder(id, 'dismissed');
  };

  // Snooze reminder
  const snoozeReminder = (id: string, hours: number) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    updateReminder(id, 'snoozed');
    
    // Set timer to bring it back
    setTimeout(() => {
      updateReminder(id, 'new');
    }, hours * 60 * 60 * 1000);
  };

  // Mark as done
  const completeReminder = (id: string) => {
    updateReminder(id, 'done');
  };

  // Get active reminders
  const activeReminders = reminders.filter(r => 
    r.state === 'new' || r.state === 'shown'
  );

  // Get top reminder (highest priority)
  const topReminder = activeReminders.sort((a, b) => b.priority - a.priority)[0];

  return {
    reminders,
    activeReminders,
    topReminder,
    refresh,
    updateReminder,
    dismissReminder,
    snoozeReminder,
    completeReminder,
  };
}
