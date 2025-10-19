import { useState, useEffect } from "react";
import { Tip } from "@/types/tip";
import { Transaction } from "@/types/transaction";
import { Goal } from "@/types/goal";
import { Challenge } from "@/types/challenge";
import { generateSmartTips } from "@/lib/tipDetection";
import { differenceInHours } from "date-fns";

const STORAGE_KEY = "zaman.tips.v1";
const COOLDOWN_HOURS = 6;

export function useSmartTips(
  txns: Transaction[],
  goals: Goal[],
  challenges: Challenge[]
) {
  const [tips, setTips] = useState<Tip[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTips(parsed);
      } catch (e) {
        console.error("Failed to load tips:", e);
      }
    }
  }, []);

  // Save to localStorage
  const saveTips = (newTips: Tip[]) => {
    setTips(newTips);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTips));
  };

  // Check if we should generate new tips (respect cooldown)
  const shouldGenerate = () => {
    const lastGenerated = tips
      .filter(t => !t.shown)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0];

    if (!lastGenerated) return true;

    const hoursSince = differenceInHours(new Date(), new Date(lastGenerated.ts));
    return hoursSince >= COOLDOWN_HOURS;
  };

  // Generate new tips (manual trigger)
  const generateTips = () => {
    const newTips = generateSmartTips(txns, goals, challenges);
    
    // Dedupe with existing
    const existingIds = new Set(tips.map(t => t.id));
    const filtered = newTips.filter(t => !existingIds.has(t.id));

    if (filtered.length > 0) {
      saveTips([...tips, ...filtered]);
      return filtered;
    }
    
    return [];
  };

  // Auto-generate tips (with cooldown)
  const autoGenerateTips = () => {
    if (!shouldGenerate()) return [];
    return generateTips();
  };

  // Mark tip as shown
  const markShown = (id: string) => {
    saveTips(
      tips.map(t => t.id === id ? { ...t, shown: true } : t)
    );
  };

  // Get unshown tips
  const unshownTips = tips.filter(t => !t.shown);

  // Get top tip (highest priority)
  const topTip = unshownTips.sort((a, b) => b.priority - a.priority)[0];

  return {
    tips,
    unshownTips,
    topTip,
    generateTips,
    autoGenerateTips,
    markShown,
  };
}
