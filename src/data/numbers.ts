import { PracticeItem } from '../types';
import { NUMBERS_CSV, parseNumbersCsv } from './parseLettersCsv';
import { LEARNING_CONFIG } from '../constants/AppConstants';

function digitParts(n: number): number[] {
  return String(n).split('').map((d) => Number(d));
}

const allNumbersData: PracticeItem[] = parseNumbersCsv(NUMBERS_CSV).map((row) => ({
  id: 1000 + row.value,
  kind: 'number',
  character: String(row.value),
  nameNiqqud: row.feminine,
  speakText: row.feminine.replace(/[\u0591-\u05C7]/g, ''),
  value: row.value,
  digitParts: digitParts(row.value),
  words: [],
  masculine: row.masculine,
  feminine: row.feminine,
}));

export const numbersData: PracticeItem[] = allNumbersData.filter(
  (item) => item.value != null && item.value <= LEARNING_CONFIG.visibleNumberMax,
);
