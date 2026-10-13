import * as Speech from 'expo-speech';
import { APP_CONFIG } from '../constants/AppConstants';

class TTSService {
  isInitialized = false;
  isSpeaking = false;

  async init() {
    if (this.isInitialized) return;
    try {
      this.isInitialized = true;
    } catch (error) {
      console.error('TTS Service initialization failed:', error);
      this.fallbackInit();
    }
  }

  fallbackInit() {
    this.isInitialized = true;
  }

  speak(text: string, options: Speech.SpeechOptions = {}) {
    if (!text || typeof text !== 'string') {
      return;
    }

    if (!this.isInitialized) {
      this.fallbackInit();
    }

    this.stop();

    try {
      Speech.speak(text, {
        language: options.language || APP_CONFIG.defaultLanguage,
        rate: options.rate ?? 0.6,
        pitch: options.pitch ?? 1.0,
        onStart: () => {
          this.isSpeaking = true;
        },
        onDone: () => {
          this.isSpeaking = false;
        },
        onStopped: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
        ...options,
      });
    } catch (error) {
      console.error('TTS speak error:', error);
    }
  }

  speakCharacter(character: string) {
    if (!character) return;
    this.speak(character, { rate: 0.3, pitch: 1.0, language: 'he-IL' });
  }

  speakItem(text: string) {
    this.speakCharacter(text);
  }

  speakSentence(sentence: string) {
    if (!sentence) return;
    this.speak(sentence, { rate: 0.35, pitch: 1.0, language: 'he-IL' });
  }

  stop() {
    try {
      Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('TTS stop error:', error);
    }
  }

  getIsSpeaking() {
    return this.isSpeaking;
  }

  isReady() {
    return this.isInitialized;
  }

  destroy() {
    this.stop();
    this.isInitialized = false;
  }
}

const ttsService = new TTSService();
export default ttsService;
