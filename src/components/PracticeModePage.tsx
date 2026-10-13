import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import TapButton from './TapButton';
import { DatabaseHelper } from '../database/DatabaseHelper';
import { DeckKind, PracticeItem } from '../types';
import { getStrokeData } from '../data/strokePaths';
import { CommonStyles, PracticeModeStyles, SimpleCharacterCardStyles } from '../styles/AppStyles';
import CharacterNavigationRibbon from './CharacterNavigationRibbon';
import TracingCanvas from './TracingCanvas';
import FreeDrawCanvas from './FreeDrawCanvas';
import NavChevron from './NavChevron';

const COPY_COUNT = 5;
const COPY_GAP = 4;
const TAP_SLOP = { top: 16, bottom: 16, left: 16, right: 16 };

type TraceMode = 'line' | 'free';

const PracticeModePage = ({
  deck,
  initialPosition = 0,
  databaseHelper,
  onBack,
}: {
  deck: DeckKind;
  initialPosition?: number;
  databaseHelper: DatabaseHelper;
  onBack: () => void;
}) => {
  const characters = useMemo(() => databaseHelper.getAllCharacters(deck), [databaseHelper, deck]);
  const viewedCharacters = useMemo(
    () => databaseHelper.progressService.getViewedIds(deck),
    [databaseHelper, deck],
  );
  const [currentPosition, setCurrentPosition] = useState(
    initialPosition > 0 && initialPosition <= characters.length ? initialPosition : 0,
  );
  const [traceMode, setTraceMode] = useState<TraceMode>('line');
  const [clearNonce, setClearNonce] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const currentCharacter: PracticeItem | null = characters[currentPosition - 1] || null;
  const strokeData = currentCharacter ? getStrokeData(currentCharacter.character) : null;
  const clearSpace = traceMode === 'free' ? 64 : 0;
  const cellSize = Math.max(
    0,
    Math.floor(
      Math.min(
        canvasSize.height - 8 - clearSpace,
        (canvasSize.width - COPY_GAP * (COPY_COUNT - 1)) / COPY_COUNT,
      ),
    ),
  );

  const selectCharacter = (id: number, position: number) => {
    setCurrentPosition(position);
    setClearNonce((value) => value + 1);
    const item = characters.find((character) => character.id === id);
    if (item) {
      databaseHelper.markCharacterAsViewed(1, item.id).catch(() => {});
    }
  };

  const setMode = (mode: TraceMode) => {
    if (mode === traceMode) return;
    setTraceMode(mode);
  };

  const emptyPrompt = deck === 'letter' ? 'בחרו אות מהרשימה' : 'בחרו מספר מהרשימה';

  return (
    <View style={CommonStyles.container}>
      <View style={PracticeModeStyles.header} collapsable={false}>
        <View style={PracticeModeStyles.headerSide} pointerEvents="none" />
        <View style={PracticeModeStyles.headerCenter} collapsable={false}>
          <View style={PracticeModeStyles.toggleRow} collapsable={false}>
            <TapButton
              style={[PracticeModeStyles.toggleButton, traceMode === 'line' && PracticeModeStyles.toggleButtonActive]}
              onPress={() => setMode('line')}
              hitSlop={TAP_SLOP}
            >
              <Text style={[PracticeModeStyles.toggleText, traceMode === 'line' && PracticeModeStyles.toggleTextActive]}>
                לפי קו
              </Text>
            </TapButton>
            <TapButton
              style={[PracticeModeStyles.toggleButton, traceMode === 'free' && PracticeModeStyles.toggleButtonActive]}
              onPress={() => setMode('free')}
              hitSlop={TAP_SLOP}
            >
              <Text style={[PracticeModeStyles.toggleText, traceMode === 'free' && PracticeModeStyles.toggleTextActive]}>
                ציור חופשי
              </Text>
            </TapButton>
          </View>
          <TapButton
            style={SimpleCharacterCardStyles.backButton}
            onPress={onBack}
            hitSlop={TAP_SLOP}
          >
            <NavChevron direction="left" size={22} />
          </TapButton>
        </View>
        <View style={PracticeModeStyles.headerSide} pointerEvents="none" />
      </View>

      <View {...{ dir: 'ltr' as const }} style={PracticeModeStyles.body}>
        <View style={PracticeModeStyles.canvasColumn}>
          <View
            style={PracticeModeStyles.canvasArea}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setCanvasSize({ width, height });
            }}
          >
            {!currentCharacter ? (
              <Text style={PracticeModeStyles.emptyPrompt}>{emptyPrompt}</Text>
            ) : cellSize <= 0 ? null : (
              <>
                <View
                  pointerEvents={traceMode === 'line' ? 'auto' : 'none'}
                  style={traceMode === 'line' ? PracticeModeStyles.copiesRow : PracticeModeStyles.hiddenLayer}
                >
                  {Array.from({ length: COPY_COUNT }).map((_, index) => (
                    <View key={`${currentCharacter.character}-line-${index}`}>
                      <TracingCanvas
                        compact
                        size={cellSize}
                        character={currentCharacter.character}
                        strokeData={strokeData}
                      />
                    </View>
                  ))}
                </View>
                <View
                  pointerEvents={traceMode === 'free' ? 'auto' : 'none'}
                  style={traceMode === 'free' ? PracticeModeStyles.freeDrawStack : PracticeModeStyles.hiddenLayer}
                >
                  <FreeDrawCanvas
                    character={currentCharacter.character}
                    cellSize={cellSize}
                    clearNonce={clearNonce}
                  />
                  {traceMode === 'free' ? (
                    <View style={PracticeModeStyles.clearBar} pointerEvents="box-none">
                      <TapButton
                        style={PracticeModeStyles.clearButton}
                        onPress={() => setClearNonce((value) => value + 1)}
                        hitSlop={TAP_SLOP}
                      >
                        <Text style={PracticeModeStyles.clearButtonText}>נקה</Text>
                      </TapButton>
                    </View>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
        <CharacterNavigationRibbon
          orientation="vertical"
          characters={characters}
          currentPosition={currentPosition}
          currentCharacter={currentCharacter}
          viewedCharacters={viewedCharacters}
          onCharacterSelect={selectCharacter}
        />
        <View style={PracticeModeStyles.navSafePad} pointerEvents="none" />
      </View>
    </View>
  );
};

export default PracticeModePage;
