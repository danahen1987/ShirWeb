import { VALIDATION_RULES } from '../constants/AppConstants';

export class ValidationUtils {
  static validateCharacter(character: string) {
    if (!character || typeof character !== 'string') {
      return { isValid: false, message: 'נדרש תו' };
    }

    if (character.length > VALIDATION_RULES.character.maxLength) {
      return {
        isValid: false,
        message: `התו ארוך מדי`,
      };
    }

    return { isValid: true, message: 'תקין' };
  }

  static validateSentence(sentence: string) {
    if (!sentence || typeof sentence !== 'string') {
      return { isValid: false, message: 'נדרש משפט' };
    }

    if (sentence.length > VALIDATION_RULES.sentence.maxLength) {
      return {
        isValid: false,
        message: 'המשפט ארוך מדי',
      };
    }

    return { isValid: true, message: 'תקין' };
  }

  static validateCharacterId(characterId: number) {
    if (!characterId || typeof characterId !== 'number') {
      return { isValid: false, message: 'מזהה הפריט חייב להיות מספר' };
    }

    if (characterId < 1) {
      return { isValid: false, message: 'מזהה הפריט חייב להיות גדול מ-0' };
    }

    return { isValid: true, message: 'תקין' };
  }
}
