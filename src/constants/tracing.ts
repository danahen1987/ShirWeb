import { Dimensions } from 'react-native';

export const STROKE_VIEWBOX = 300;

export function getTraceCanvasSize(reservedHeight: number) {
  const { width, height } = Dimensions.get('window');
  return Math.max(300, Math.round(Math.min(width - 8, height - reservedHeight)));
}

export function faintLetterSize(character: string, canvasSize: number) {
  if (character === 'י') return canvasSize * 0.4;
  if (character.length > 2) return canvasSize * 0.36;
  if (character.length === 2) return canvasSize * 0.5;
  return canvasSize * 0.86;
}

export function faintLetterPadding(canvasSize: number) {
  return Math.max(8, Math.round(canvasSize * 0.04));
}
