export type DeckKind = 'letter' | 'number';

export type Point = {
  x: number;
  y: number;
};

export type Stroke = {
  strokeNumber: number;
  points: Point[];
  direction: string;
  path: string;
};

export type StrokeData = {
  character: string;
  strokeCount: number;
  strokes: Stroke[];
};

export type RecordedStroke = {
  coords: number[][];
  direction: string;
};

export type StrokeMap = Record<string, RecordedStroke[]>;

export type ExampleWord = {
  icon: string;
  text: string;
};

export type PracticeItem = {
  id: number;
  kind: DeckKind;
  character: string;
  nameNiqqud: string;
  speakText: string;
  sofit?: boolean;
  value?: number;
  digitParts?: number[];
  words: ExampleWord[];
  masculine?: string;
  feminine?: string;
};
