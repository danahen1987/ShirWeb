import { DeckKind } from '../types';
import { ValidationUtils } from '../utils/ValidationUtils';
import { FormatUtils } from '../utils/FormatUtils';

type ProgressRecord = {
  characterId: number;
  kind: DeckKind;
  completed: boolean;
  lastAccessed: number;
  timesPracticed: number;
};

const STORAGE_KEY = 'shir-progress-v1';

function readStoredProgress(): Map<number, ProgressRecord> {
  if (typeof localStorage === 'undefined') return new Map();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as ProgressRecord[];
    if (!Array.isArray(parsed)) return new Map();
    return new Map(parsed.map((record) => [record.characterId, record]));
  } catch {
    return new Map();
  }
}

function writeStoredProgress(progress: Map<number, ProgressRecord>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...progress.values()]));
  } catch {
    // The site still works if the browser blocks storage.
  }
}

export class ProgressService {
  private progressCache = readStoredProgress();
  private listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    writeStoredProgress(this.progressCache);
    this.listeners.forEach((listener) => listener());
  }

  async updateProgress(characterId: number, kind: DeckKind, completed = false) {
    const validation = ValidationUtils.validateCharacterId(characterId);
    if (!validation.isValid) {
      return { success: false, message: validation.message };
    }

    const existing = this.progressCache.get(characterId);
    this.progressCache.set(characterId, {
      characterId,
      kind,
      completed: completed || existing?.completed || false,
      lastAccessed: Date.now(),
      timesPracticed: (existing?.timesPracticed || 0) + (completed ? 1 : 0),
    });
    this.notify();
    return { success: true, message: completed ? 'Character marked as completed' : 'Progress updated' };
  }

  async markCharacterAsViewed(characterId: number, kind: DeckKind) {
    const existing = this.progressCache.get(characterId);
    const wasNew = !existing;
    this.progressCache.set(characterId, {
      characterId,
      kind,
      completed: existing?.completed || false,
      lastAccessed: Date.now(),
      timesPracticed: existing?.timesPracticed || 0,
    });
    this.notify();
    return wasNew;
  }

  async markCharacterCompleted(characterId: number, kind: DeckKind) {
    return this.updateProgress(characterId, kind, true);
  }

  getViewedCharacters(kind?: DeckKind) {
    return Array.from(this.progressCache.values()).filter((record) => !kind || record.kind === kind);
  }

  getViewedIds(kind?: DeckKind) {
    return new Set(this.getViewedCharacters(kind).map((record) => record.characterId));
  }

  getLastViewedCharacterId(kind: DeckKind) {
    const viewed = this.getViewedCharacters(kind).sort((a, b) => b.lastAccessed - a.lastAccessed);
    return viewed[0]?.characterId ?? null;
  }

  getCharacterProgress(characterId: number) {
    return this.progressCache.get(characterId) || null;
  }

  getProgressSummary(kind: DeckKind, totalCharacters: number) {
    const viewed = this.getViewedCharacters(kind);
    return FormatUtils.formatProgressSummary({
      totalCharacters,
      completedCharacters: viewed.length,
      totalPractices: viewed.reduce((sum, record) => sum + record.timesPracticed, 0),
    });
  }

  async getLearningStats(kind: DeckKind, totalCharacters: number) {
    const summary = this.getProgressSummary(kind, totalCharacters);
    return {
      totalCharacters,
      completedCharacters: summary.completedCharacters,
      totalPractices: summary.totalPractices,
      completionPercentage: summary.completionPercentage,
      remainingCharacters: totalCharacters - summary.completedCharacters,
    };
  }

  clearAllProgress() {
    this.progressCache.clear();
    this.notify();
    return { success: true, message: 'All progress cleared' };
  }
}
