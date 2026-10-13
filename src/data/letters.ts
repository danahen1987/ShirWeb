import { PracticeItem } from '../types';
import { LETTERS_CSV, parseLettersCsv } from './parseLettersCsv';

const letterNames: { character: string; nameNiqqud: string; sofit?: boolean }[] = [
  { character: 'א', nameNiqqud: 'אָלֶף' },
  { character: 'ב', nameNiqqud: 'בֵּית' },
  { character: 'ג', nameNiqqud: 'גִּימֶל' },
  { character: 'ד', nameNiqqud: 'דָּלֶת' },
  { character: 'ה', nameNiqqud: 'הֵא' },
  { character: 'ו', nameNiqqud: 'וָו' },
  { character: 'ז', nameNiqqud: 'זַיִן' },
  { character: 'ח', nameNiqqud: 'חֵית' },
  { character: 'ט', nameNiqqud: 'טֵית' },
  { character: 'י', nameNiqqud: 'יוֹד' },
  { character: 'כ', nameNiqqud: 'כַּף' },
  { character: 'ל', nameNiqqud: 'לָמֶד' },
  { character: 'מ', nameNiqqud: 'מֵם' },
  { character: 'נ', nameNiqqud: 'נוּן' },
  { character: 'ס', nameNiqqud: 'סָמֶךְ' },
  { character: 'ע', nameNiqqud: 'עַיִן' },
  { character: 'פ', nameNiqqud: 'פֵּא' },
  { character: 'צ', nameNiqqud: 'צָדִי' },
  { character: 'ק', nameNiqqud: 'קוֹף' },
  { character: 'ר', nameNiqqud: 'רֵישׁ' },
  { character: 'ש', nameNiqqud: 'שִׁין' },
  { character: 'ת', nameNiqqud: 'תָּו' },
  { character: 'ך', nameNiqqud: 'כַּף סוֹפִית', sofit: true },
  { character: 'ם', nameNiqqud: 'מֵם סוֹפִית', sofit: true },
  { character: 'ן', nameNiqqud: 'נוּן סוֹפִית', sofit: true },
  { character: 'ף', nameNiqqud: 'פֵּא סוֹפִית', sofit: true },
  { character: 'ץ', nameNiqqud: 'צָדִי סוֹפִית', sofit: true },
];

const wordsByLetter = parseLettersCsv(LETTERS_CSV);

export const lettersData: PracticeItem[] = letterNames.map((letter, index) => ({
  id: index + 1,
  kind: 'letter',
  character: letter.character,
  nameNiqqud: letter.nameNiqqud,
  speakText: letter.nameNiqqud.replace(/[\u0591-\u05C7]/g, ''),
  sofit: letter.sofit,
  words: wordsByLetter[letter.character] || [],
}));
