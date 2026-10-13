import { DeckKind, PracticeItem } from '../types';
import { lettersData } from '../data/letters';
import { numbersData } from '../data/numbers';
import { ProgressService } from '../services/ProgressService';

export class DatabaseHelper {
  private items: PracticeItem[] = [];
  progressService: ProgressService;

  constructor(progressService: ProgressService) {
    this.progressService = progressService;
  }

  async initializeDatabase() {
    this.items = [...lettersData, ...numbersData];
    return true;
  }

  getAllCharacters(kind?: DeckKind) {
    if (!kind) return [...this.items];
    return this.items.filter((item) => item.kind === kind);
  }

  getCharacter(id: number) {
    return this.items.find((item) => item.id === id) || null;
  }

  getCharacterCount(kind?: DeckKind) {
    return this.getAllCharacters(kind).length;
  }

  async markCharacterAsViewed(_userId: number, characterId: number) {
    const item = this.getCharacter(characterId);
    if (!item) return false;
    return this.progressService.markCharacterAsViewed(characterId, item.kind);
  }

  async getViewedCharacters(_userId: number, kind?: DeckKind) {
    return this.progressService.getViewedCharacters(kind).map((record) => ({
      character_id: record.characterId,
      last_accessed: record.lastAccessed,
      times_practiced: record.timesPracticed,
    }));
  }

  async getUserProgressSummary(_userId: number, kind: DeckKind) {
    const total = this.getCharacterCount(kind);
    return this.progressService.getProgressSummary(kind, total);
  }
}
