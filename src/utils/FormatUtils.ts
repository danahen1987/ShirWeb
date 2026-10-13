import { PracticeItem, StrokeData } from '../types';

export class FormatUtils {
  static formatCharacter(character: PracticeItem | null) {
    if (!character) return null;

    return {
      id: character.id,
      character: character.character?.trim(),
      nameNiqqud: character.nameNiqqud?.trim(),
      speakText: character.speakText?.trim(),
      kind: character.kind,
    };
  }

  static formatProgressSummary(summary: {
    totalCharacters?: number;
    completedCharacters?: number;
    totalPractices?: number;
  } | null) {
    if (!summary) return { totalCharacters: 0, completedCharacters: 0, totalPractices: 0, completionPercentage: 0 };

    return {
      totalCharacters: summary.totalCharacters || 0,
      completedCharacters: summary.completedCharacters || 0,
      totalPractices: summary.totalPractices || 0,
      completionPercentage:
        summary.totalCharacters && summary.totalCharacters > 0
          ? Math.round((summary.completedCharacters || 0) / summary.totalCharacters * 100)
          : 0,
    };
  }

  static formatStrokeData(strokeData: StrokeData | null) {
    if (!strokeData) return null;

    return {
      strokes: Array.isArray(strokeData.strokes) ? strokeData.strokes : [],
      totalStrokes: strokeData.strokeCount || 0,
    };
  }

  static sanitizeText(text: string) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().replace(/[<>]/g, '');
  }
}
