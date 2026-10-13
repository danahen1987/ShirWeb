export const APP_CONFIG = {
  name: 'שיר',
  version: '1.0.0',
  defaultLanguage: 'he-IL',
  supportedLanguages: ['he-IL', 'en-US'],
};

export const LEARNING_CONFIG = {
  practiceThreshold: 3,
  strokePracticeEnabled: true,
  audioEnabled: true,
  progressTrackingEnabled: true,
  visibleNumberMax: 20,
};

export const UI_CONFIG = {
  animationDuration: 300,
  modalAnimationType: 'slide' as const,
  loadingTimeout: 10000,
  maxRetries: 3,
};

export const ERROR_MESSAGES = {
  databaseInit: 'לא הצלחנו לטעון את הנתונים',
  ttsInit: 'ההקראה לא זמינה כרגע',
  characterLoad: 'לא הצלחנו לטעון את הפריט',
  sentenceLoad: 'לא הצלחנו לטעון את הדוגמה',
  progressUpdate: 'לא הצלחנו לעדכן את ההתקדמות',
  unknownError: 'אירעה שגיאה. נסו שוב',
};

export const SUCCESS_MESSAGES = {
  characterCompleted: 'כל הכבוד! סיימתם לכתוב',
  progressSaved: 'ההתקדמות עודכנה',
};

export const VALIDATION_RULES = {
  character: {
    maxLength: 10,
  },
  sentence: {
    maxLength: 200,
  },
};

export const DEFAULTS = {
  currentCharacterId: 1,
  showDiscovery: false,
  showStrokePractice: false,
  showSentencePopup: false,
  isLoading: true,
  currentView: 'landing' as const,
};
