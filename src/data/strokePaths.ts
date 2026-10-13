import { STROKE_VIEWBOX } from '../constants/tracing';
import { Point, RecordedStroke, Stroke, StrokeData } from '../types';
import { getRecordedStrokes } from './strokeStore';

function densify(points: Point[], spacing = 8): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.round(length / spacing));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

export function pathFromPoints(points: Point[]): string {
  if (!points.length) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

export function makeStrokes(raw: RecordedStroke[], spacing = 8): Stroke[] {
  return raw.map((s, index) => {
    const points = densify(
      s.coords.map(([x, y]) => ({ x, y })),
      spacing,
    );
    return {
      strokeNumber: index + 1,
      points,
      direction: s.direction,
      path: pathFromPoints(points),
    };
  });
}

function extent(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function startAtTop(points: Point[]): Point[] {
  if (points.length < 2) return points;
  return points[points.length - 1].y < points[0].y - 8 ? [...points].reverse() : points;
}

function glyphBox(character: string) {
  if (character === 'י') return { x: 100, y: 48, w: 100, h: 92 };
  if (character.length >= 3) return { x: 20, y: 72, w: 260, h: 156 };
  if (character.length === 2) return { x: 22, y: 58, w: 256, h: 184 };
  return { x: 28, y: 18, w: 244, h: 264 };
}

function fitStrokes(strokes: Stroke[], character: string): Stroke[] {
  const all = strokes.flatMap((stroke) => stroke.points);
  if (!all.length) return strokes;
  const box = extent(all);
  const width = Math.max(1, box.maxX - box.minX);
  const height = Math.max(1, box.maxY - box.minY);
  const target = glyphBox(character);
  let scale = target.h / height;
  if (width * scale > target.w) {
    scale = target.w / width;
  }
  const ox = target.x + (target.w - width * scale) / 2;
  const oy = target.y;
  return strokes.map((stroke, index) => {
    const points = stroke.points.map((p) => ({
      x: (p.x - box.minX) * scale + ox,
      y: (p.y - box.minY) * scale + oy,
    }));
    return { ...stroke, strokeNumber: index + 1, points, path: pathFromPoints(points) };
  });
}

function pack(
  character: string,
  raw: { coords: number[][]; direction: string }[],
  spacing = 8,
): StrokeData {
  const strokes = fitStrokes(
    makeStrokes(raw, spacing).map((stroke) => {
      const points = startAtTop(stroke.points);
      return { ...stroke, points, path: pathFromPoints(points) };
    }),
    character,
  );
  return { character, strokeCount: strokes.length, strokes };
}

function arc(cx: number, cy: number, rx: number, ry: number, fromDeg: number, toDeg: number, steps: number): number[][] {
  const from = (fromDeg * Math.PI) / 180;
  const to = (toDeg * Math.PI) / 180;
  const pts: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = from + ((to - from) * i) / steps;
    pts.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  return pts;
}

const letterStrokes: Record<string, StrokeData> = {
  א: pack('א', [
    { coords: [[78, 14], [50, 50], [22, 88]], direction: 'down' },
    { coords: [[20, 20], [50, 50]], direction: 'down' },
    { coords: [[50, 50], [80, 88]], direction: 'down' },
  ]),
  ב: pack('ב', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[18, 14], [18, 78]], direction: 'down' },
    { coords: [[82, 14], [82, 86], [24, 86]], direction: 'down' },
  ]),
  ג: pack('ג', [
    { coords: [[20, 14], [80, 14], [52, 46]], direction: 'down' },
    { coords: [[78, 48], [24, 88]], direction: 'down' },
  ]),
  ד: pack('ד', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[82, 14], [82, 88]], direction: 'down' },
  ]),
  ה: pack('ה', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[18, 40], [18, 88]], direction: 'down' },
    { coords: [[82, 14], [82, 88]], direction: 'down' },
  ]),
  ו: pack('ו', [
    { coords: [[50, 12], [50, 88]], direction: 'down' },
  ]),
  ז: pack('ז', [
    { coords: [[20, 14], [80, 14]], direction: 'across' },
    { coords: [[64, 14], [38, 88]], direction: 'down' },
  ]),
  ח: pack('ח', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[18, 14], [18, 88]], direction: 'down' },
    { coords: [[82, 14], [82, 88]], direction: 'down' },
  ]),
  ט: pack('ט', [
    { coords: [[50, 12], [50, 52]], direction: 'down' },
    { coords: [[20, 18], [20, 80], [50, 90], [80, 80]], direction: 'down' },
    { coords: [[80, 18], [80, 80]], direction: 'down' },
  ]),
  י: pack('י', [
    { coords: [[50, 18], [50, 48]], direction: 'down' },
  ]),
  כ: pack('כ', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[18, 14], [18, 70], [42, 88]], direction: 'down' },
    { coords: [[82, 14], [82, 88]], direction: 'down' },
  ]),
  ל: pack('ל', [
    { coords: [[50, 4], [50, 28], [20, 28]], direction: 'down' },
    { coords: [[20, 28], [20, 88], [78, 88], [84, 62]], direction: 'down' },
  ]),
  מ: pack('מ', [
    { coords: [[18, 14], [70, 14], [82, 28]], direction: 'across' },
    { coords: [[18, 14], [18, 88]], direction: 'down' },
    { coords: [[18, 50], [64, 50]], direction: 'across' },
    { coords: [[82, 28], [82, 88]], direction: 'down' },
  ]),
  נ: pack('נ', [
    { coords: [[22, 14], [78, 14], [78, 42]], direction: 'down' },
    { coords: [[22, 14], [22, 88]], direction: 'down' },
  ]),
  ס: pack('ס', [
    {
      coords: [
        [50, 10],
        [78, 22],
        [86, 50],
        [78, 80],
        [50, 90],
        [22, 80],
        [14, 50],
        [22, 22],
        [50, 10],
      ],
      direction: 'down',
    },
  ]),
  ע: pack('ע', [
    { coords: [[24, 18], [18, 50], [32, 86], [64, 90]], direction: 'down' },
    { coords: [[78, 18], [74, 50], [56, 82]], direction: 'down' },
  ]),
  פ: pack('פ', [
    { coords: [[18, 14], [78, 14], [84, 40], [68, 50], [18, 50]], direction: 'across' },
    { coords: [[18, 14], [18, 88]], direction: 'down' },
    { coords: [[48, 50], [56, 70], [50, 88]], direction: 'down' },
  ]),
  צ: pack('צ', [
    { coords: [[24, 14], [24, 48], [50, 58]], direction: 'down' },
    { coords: [[76, 14], [76, 48], [50, 58]], direction: 'down' },
    { coords: [[50, 58], [24, 88]], direction: 'down' },
    { coords: [[50, 58], [76, 88]], direction: 'down' },
  ]),
  ק: pack('ק', [
    { coords: [[22, 14], [78, 14]], direction: 'across' },
    { coords: [[22, 14], [22, 52], [78, 52]], direction: 'down' },
    { coords: [[78, 14], [78, 92]], direction: 'down' },
  ]),
  ר: pack('ר', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[82, 14], [82, 88]], direction: 'down' },
  ]),
  ש: pack('ש', [
    { coords: [[20, 18], [20, 88]], direction: 'down' },
    { coords: [[50, 12], [50, 88]], direction: 'down' },
    { coords: [[80, 18], [80, 88]], direction: 'down' },
    { coords: [[20, 88], [80, 88]], direction: 'across' },
  ]),
  ת: pack('ת', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[18, 14], [18, 88]], direction: 'down' },
    { coords: [[82, 14], [82, 70], [64, 88]], direction: 'down' },
  ]),
  ך: pack('ך', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[82, 14], [82, 96]], direction: 'down' },
  ]),
  ם: pack('ם', [
    { coords: [[18, 14], [82, 14]], direction: 'across' },
    { coords: [[18, 14], [18, 88]], direction: 'down' },
    { coords: [[82, 14], [82, 88]], direction: 'down' },
    { coords: [[18, 88], [82, 88]], direction: 'across' },
  ]),
  ן: pack('ן', [
    { coords: [[50, 12], [50, 96]], direction: 'down' },
  ]),
  ף: pack('ף', [
    { coords: [[20, 14], [78, 14], [84, 42], [60, 54], [20, 54]], direction: 'across' },
    { coords: [[20, 14], [20, 96]], direction: 'down' },
  ]),
  ץ: pack('ץ', [
    { coords: [[24, 14], [24, 48], [50, 58]], direction: 'down' },
    { coords: [[76, 14], [76, 50], [50, 58], [50, 96]], direction: 'down' },
  ]),
};

const digitStrokes: Record<string, StrokeData> = {
  '0': pack(
    '0',
    [{ coords: arc(50, 50, 36, 42, -55, -55 - 360, 40), direction: 'down' }],
    8,
  ),
  '1': pack(
    '1',
    [
      { coords: [[50, 8], [24, 32]], direction: 'down' },
      { coords: [[50, 8], [50, 92]], direction: 'down' },
    ],
    8,
  ),
  '2': pack(
    '2',
    [
      {
        coords: [
          ...arc(50, 28, 34, 22, 200, 20, 18),
          [72, 48],
          [48, 64],
          [26, 82],
          [20, 92],
          [86, 92],
        ],
        direction: 'down',
      },
    ],
    8,
  ),
  '3': pack(
    '3',
    [
      {
        coords: [...arc(52, 28, 32, 20, 200, 450, 16), ...arc(54, 70, 32, 22, 280, 520, 16)],
        direction: 'down',
      },
    ],
    8,
  ),
  '4': pack(
    '4',
    [
      { coords: [[22, 8], [18, 62], [86, 62]], direction: 'down' },
      { coords: [[68, 8], [68, 92]], direction: 'down' },
    ],
    8,
  ),
  '5': pack(
    '5',
    [
      { coords: [[22, 8], [22, 40], ...arc(52, 68, 34, 26, 200, 150, 16)], direction: 'down' },
      { coords: [[22, 8], [82, 8]], direction: 'across' },
    ],
    8,
  ),
  '6': pack(
    '6',
    [
      {
        coords: [[72, 10], [48, 12], [26, 28], ...arc(48, 64, 32, 30, 200, 200 + 300, 24)],
        direction: 'down',
      },
    ],
    8,
  ),
  '7': pack(
    '7',
    [{ coords: [[14, 8], [86, 8], [42, 92]], direction: 'down' }],
    8,
  ),
  '8': pack('8', [
    { coords: arc(50, 28, 28, 22, -50, -50 - 360, 24), direction: 'down' },
    { coords: arc(50, 72, 30, 22, -90, -90 - 360, 24), direction: 'down' },
  ]),
  '9': pack(
    '9',
    [
      {
        coords: [...arc(50, 32, 30, 24, 20, 20 - 330, 24), [82, 40], [82, 92]],
        direction: 'down',
      },
    ],
    8,
  ),
};

export function strokesFromRecording(character: string, raw: RecordedStroke[]): StrokeData {
  const strokes = makeStrokes(splitLoopingDigit(character, raw), 8);
  return { character, strokeCount: strokes.length, strokes };
}

function splitLoopingDigit(character: string, raw: RecordedStroke[]): RecordedStroke[] {
  if (character !== '8' || raw.length !== 1) return raw;
  const coords = raw[0].coords;
  if (coords.length < 16) return raw;
  let lowest = 0;
  for (let index = 1; index < coords.length; index++) {
    if (coords[index][1] > coords[lowest][1]) lowest = index;
  }
  const waistY = (coords[0][1] + coords[lowest][1]) / 2;
  for (let index = lowest + 2; index < coords.length - 5; index++) {
    if (coords[index][1] <= waistY + 6) {
      return [
        { coords: coords.slice(0, index + 1), direction: 'down' },
        { coords: coords.slice(index), direction: raw[0].direction },
      ];
    }
  }
  return raw;
}

function getDigitStrokeData(digit: string): StrokeData | null {
  const recorded = getRecordedStrokes(digit);
  if (recorded?.length) return strokesFromRecording(digit, recorded);
  return digitStrokes[digit] || null;
}

export function getStrokeData(character: string): StrokeData | null {
  if (!character) return null;

  const recorded = getRecordedStrokes(character);
  if (recorded?.length) {
    return strokesFromRecording(character, recorded);
  }

  if (letterStrokes[character]) return letterStrokes[character];
  if (digitStrokes[character] && character.length === 1) {
    return getDigitStrokeData(character);
  }

  if (/^\d+$/.test(character) && character.length > 1) {
    const digits = character.split('');
    const combined: Stroke[] = [];
    const slotWidth = STROKE_VIEWBOX / digits.length;
    digits.forEach((digit, digitIndex) => {
      const data = getDigitStrokeData(digit);
      if (!data) return;
      const scale = Math.min(0.9, 0.85 * (2 / Math.max(2, digits.length)));
      const offsetX = digitIndex * slotWidth + (slotWidth - STROKE_VIEWBOX * scale) / 2;
      const offsetY = (STROKE_VIEWBOX - STROKE_VIEWBOX * scale) / 2;
      data.strokes.forEach((stroke) => {
        const points = stroke.points.map((p) => ({
          x: p.x * scale + offsetX,
          y: p.y * scale + offsetY,
        }));
        combined.push({
          strokeNumber: combined.length + 1,
          points,
          direction: stroke.direction,
          path: pathFromPoints(points),
        });
      });
    });
    const fitted = fitStrokes(combined, character);
    return { character, strokeCount: fitted.length, strokes: fitted };
  }

  return null;
}
