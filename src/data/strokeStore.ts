import bundledStrokes from './recordedStrokes.json';
import { RecordedStroke, StrokeMap } from '../types';

const STORAGE_KEY = 'shir.strokeMap';

function cloneMap(map: StrokeMap): StrokeMap {
  return JSON.parse(JSON.stringify(map)) as StrokeMap;
}

function roundCoord(value: number) {
  return Math.round(value * 10) / 10;
}

function inferDirection(coords: number[][]) {
  if (coords.length < 2) return 'down';
  const first = coords[0];
  const last = coords[coords.length - 1];
  const dx = Math.abs(last[0] - first[0]);
  const dy = Math.abs(last[1] - first[1]);
  return dx > dy * 1.15 ? 'across' : 'down';
}

const bundled = (bundledStrokes || {}) as StrokeMap;
let overlay: StrokeMap = {};
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function readWebStorage(): StrokeMap {
  try {
    const storage = (globalThis as { localStorage?: { getItem(key: string): string | null } }).localStorage;
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StrokeMap;
  } catch {
    return {};
  }
}

function writeWebStorage(map: StrokeMap) {
  try {
    const storage = (globalThis as { localStorage?: { setItem(key: string, value: string): void } }).localStorage;
    storage?.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Native builds have no localStorage; export still works.
  }
}

overlay = readWebStorage();

export function subscribeStrokeStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStrokeMap(): StrokeMap {
  return { ...bundled, ...cloneMap(overlay) };
}

export function getRecordedStrokes(character: string): RecordedStroke[] | null {
  const strokes = overlay[character] || bundled[character];
  return strokes?.length ? strokes : null;
}

export function hasRecordedStrokes(character: string) {
  return Boolean(getRecordedStrokes(character)?.length);
}

export function recordedCharacterSet() {
  return new Set(
    Object.entries(getStrokeMap())
      .filter(([, strokes]) => strokes?.length)
      .map(([character]) => character),
  );
}

export function simplifyStroke(points: { x: number; y: number }[], minDistance = 2.4): RecordedStroke {
  const coords: number[][] = [];
  points.forEach((point) => {
    const x = roundCoord(point.x);
    const y = roundCoord(point.y);
    const last = coords[coords.length - 1];
    if (!last || Math.hypot(x - last[0], y - last[1]) >= minDistance) {
      coords.push([x, y]);
    }
  });
  if (points.length && coords.length) {
    const end = points[points.length - 1];
    const last = coords[coords.length - 1];
    if (last[0] !== roundCoord(end.x) || last[1] !== roundCoord(end.y)) {
      coords.push([roundCoord(end.x), roundCoord(end.y)]);
    }
  }
  return { coords, direction: inferDirection(coords) };
}

export function saveCharacterStrokes(character: string, strokes: RecordedStroke[]) {
  overlay = {
    ...overlay,
    [character]: strokes.filter((stroke) => stroke.coords.length > 1),
  };
  writeWebStorage(overlay);
  notify();
  if (__DEV__) {
    console.log(`[strokeStore] saved ${character}`, JSON.stringify(overlay[character]));
  }
}

export function deleteCharacterStrokes(character: string) {
  const next = { ...overlay };
  delete next[character];
  overlay = next;
  writeWebStorage(overlay);
  notify();
}

function compactStrokeMap(map: StrokeMap) {
  return `${JSON.stringify(map)}\n`;
}

export function exportStrokeMapJson() {
  return compactStrokeMap(getStrokeMap());
}

export function exportCharacterJson(character: string) {
  const strokes = getRecordedStrokes(character);
  if (!strokes?.length) return '';
  return compactStrokeMap({ [character]: strokes });
}
