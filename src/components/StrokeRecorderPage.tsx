import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  PanResponder,
  GestureResponderEvent,
  Share,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import TapButton from './TapButton';
import Svg, { Path } from 'react-native-svg';
import { CommonStyles, StrokeRecorderStyles, SimpleCharacterCardStyles, QuizModeStyles } from '../styles/AppStyles';
import { lettersData } from '../data/letters';
import { numbersData } from '../data/numbers';
import {
  deleteCharacterStrokes,
  exportCharacterJson,
  exportStrokeMapJson,
  getRecordedStrokes,
  hasRecordedStrokes,
  recordedCharacterSet,
  saveCharacterStrokes,
  simplifyStroke,
  subscribeStrokeStore,
} from '../data/strokeStore';
import { Point, RecordedStroke } from '../types';
import { STROKE_VIEWBOX, getTraceCanvasSize } from '../constants/tracing';
import CharacterNavigationRibbon from './CharacterNavigationRibbon';
import FaintLetter from './FaintLetter';
import { pathFromPoints } from '../data/strokePaths';

const STROKE_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#16a085'];

function recordedToDraft(strokes: RecordedStroke[] | null): Point[][] {
  if (!strokes?.length) return [];
  return strokes.map((stroke) => stroke.coords.map(([x, y]) => ({ x, y })));
}

function draftToRecorded(draft: Point[][]) {
  return draft.filter((stroke) => stroke.length > 1).map((stroke) => simplifyStroke(stroke));
}

const numberItems = numbersData;
const FIRST_UNRECORDED_NUMBER = '10';

const StrokeRecorderPage = ({ onBack }: { onBack: () => void }) => {
  const canvasSize = useMemo(() => getTraceCanvasSize(280), []);
  const [deck, setDeck] = useState<'letter' | 'number'>('letter');
  const [position, setPosition] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, Point[][]>>({});
  const [liveStroke, setLiveStroke] = useState<Point[]>([]);
  const [savedIds, setSavedIds] = useState(() => recordedCharacterSet());
  const [exportVisible, setExportVisible] = useState(false);
  const [exportJson, setExportJson] = useState('');

  const items = deck === 'letter' ? lettersData : numberItems;
  const current = items[position - 1];
  const character = current?.character || '';
  const draft = drafts[character] || recordedToDraft(getRecordedStrokes(character));
  const frameSizeRef = useRef(canvasSize);
  const liveRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const itemLabel = deck === 'letter' ? 'אות' : 'מספר';

  useEffect(() => {
    return subscribeStrokeStore(() => setSavedIds(recordedCharacterSet()));
  }, []);

  const setDraftFor = useCallback((letter: string, strokes: Point[][]) => {
    setDrafts((prev) => ({ ...prev, [letter]: strokes }));
  }, []);

  const toLocal = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    const size = frameSizeRef.current || canvasSize;
    return {
      x: Math.max(0, Math.min(STROKE_VIEWBOX, (locationX / size) * STROKE_VIEWBOX)),
      y: Math.max(0, Math.min(STROKE_VIEWBOX, (locationY / size) * STROKE_VIEWBOX)),
    };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          drawingRef.current = true;
          const point = toLocal(evt);
          liveRef.current = [point];
          setLiveStroke([point]);
        },
        onPanResponderMove: (evt) => {
          if (!drawingRef.current) return;
          const point = toLocal(evt);
          const last = liveRef.current[liveRef.current.length - 1];
          if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.4) return;
          liveRef.current = [...liveRef.current, point];
          setLiveStroke(liveRef.current);
        },
        onPanResponderRelease: () => {
          drawingRef.current = false;
          const finished = liveRef.current;
          liveRef.current = [];
          setLiveStroke([]);
          if (finished.length < 2) return;
          setDrafts((prev) => {
            const existing = prev[character] || recordedToDraft(getRecordedStrokes(character));
            return { ...prev, [character]: [...existing, finished] };
          });
        },
        onPanResponderTerminate: () => {
          drawingRef.current = false;
          liveRef.current = [];
          setLiveStroke([]);
        },
      }),
    [character, canvasSize],
  );

  const undo = () => setDraftFor(character, draft.slice(0, -1));
  const clear = () => setDraftFor(character, []);

  const save = () => {
    const recorded = draftToRecorded(draft);
    if (!recorded.length) {
      Alert.alert('אין מה לשמור', 'ציירו לפחות קו אחד.');
      return;
    }
    saveCharacterStrokes(character, recorded);
    openExport(`${JSON.stringify({ [character]: recorded })}\n`);
  };

  const removeSaved = () => {
    deleteCharacterStrokes(character);
    setDraftFor(character, []);
  };

  const openExport = (json: string) => {
    setExportJson(json);
    setExportVisible(true);
  };

  const shareJson = async (json: string) => {
    setExportJson(json);
    try {
      await Share.share({ message: json, title: 'recordedStrokes.json' });
    } catch {
      setExportVisible(true);
    }
  };

  const exportCurrentLetter = () => {
    const fromDraft = draftToRecorded(draft);
    const json = fromDraft.length
      ? `${JSON.stringify({ [character]: fromDraft })}\n`
      : exportCharacterJson(character);
    if (!json.trim()) {
      Alert.alert('אין מה לייצא', 'שמרו את האות קודם.');
      return;
    }
    openExport(json);
  };

  const savedCount = items.filter((item) => savedIds.has(item.character)).length;
  const isSaved = hasRecordedStrokes(character);

  const switchDeck = (nextDeck: 'letter' | 'number') => {
    setDeck(nextDeck);
    if (nextDeck === 'number') {
      const start = numberItems.findIndex((item) => item.character === FIRST_UNRECORDED_NUMBER);
      setPosition(start >= 0 ? start + 1 : 1);
    } else {
      setPosition(1);
    }
    setLiveStroke([]);
  };

  return (
    <View style={CommonStyles.container}>
      <View style={SimpleCharacterCardStyles.header}>
        <TapButton style={SimpleCharacterCardStyles.backButton} onPress={onBack}>
          <Text style={SimpleCharacterCardStyles.backButtonText}>חזרה</Text>
        </TapButton>
        <View style={SimpleCharacterCardStyles.headerTitleContainer}>
          <Text style={SimpleCharacterCardStyles.title}>הקלטת כתיבה</Text>
          <Text style={SimpleCharacterCardStyles.userIndicator}>
            {savedCount}/{items.length} {deck === 'letter' ? 'אותיות' : 'מספרים'}
          </Text>
        </View>
        <TapButton style={StrokeRecorderStyles.exportButton} onPress={exportCurrentLetter}>
          <Text style={StrokeRecorderStyles.exportButtonText}>ייצוא</Text>
        </TapButton>
      </View>

      <View style={QuizModeStyles.tabContainer}>
        <TapButton
          style={[QuizModeStyles.tabButton, deck === 'letter' && QuizModeStyles.activeTabButton]}
          onPress={() => switchDeck('letter')}
        >
          <Text style={[QuizModeStyles.tabButtonText, deck === 'letter' && QuizModeStyles.activeTabButtonText]}>
            אותיות
          </Text>
        </TapButton>
        <TapButton
          style={[QuizModeStyles.tabButton, deck === 'number' && QuizModeStyles.activeTabButton]}
          onPress={() => switchDeck('number')}
        >
          <Text style={[QuizModeStyles.tabButtonText, deck === 'number' && QuizModeStyles.activeTabButtonText]}>
            מספרים
          </Text>
        </TapButton>
      </View>

      <CharacterNavigationRibbon
        characters={items}
        currentPosition={position}
        currentCharacter={current}
        onCharacterSelect={(_id, nextPosition) => setPosition(nextPosition)}
        viewedCharacters={new Set(items.filter((item) => savedIds.has(item.character)).map((item) => item.id))}
      />

      <Text style={StrokeRecorderStyles.instruction}>
        ציירו את {character}. הרימו את האצבע בין קווים.
      </Text>
      <Text style={StrokeRecorderStyles.meta}>
        {draft.length} קווים{isSaved ? ' · שמור במאגר' : ''}
      </Text>

      <View
        collapsable={false}
        style={[StrokeRecorderStyles.canvasFrame, { width: canvasSize, height: canvasSize }]}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if (width > 0) frameSizeRef.current = width;
        }}
        {...panResponder.panHandlers}
      >
        <FaintLetter character={character} canvasSize={canvasSize} />
        <Svg
          pointerEvents="none"
          width={canvasSize}
          height={canvasSize}
          viewBox={`0 0 ${STROKE_VIEWBOX} ${STROKE_VIEWBOX}`}
        >
          {draft.map((stroke, index) => (
            <Path
              key={`${character}-${index}`}
              d={pathFromPoints(stroke)}
              stroke={STROKE_COLORS[index % STROKE_COLORS.length]}
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {liveStroke.length > 1 && (
            <Path
              d={pathFromPoints(liveStroke)}
              stroke={STROKE_COLORS[draft.length % STROKE_COLORS.length]}
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>

      <View style={StrokeRecorderStyles.actions}>
        <TapButton style={StrokeRecorderStyles.secondaryButton} onPress={undo} disabled={!draft.length}>
          <Text style={StrokeRecorderStyles.secondaryButtonText}>בטל קו</Text>
        </TapButton>
        <TapButton style={StrokeRecorderStyles.secondaryButton} onPress={clear} disabled={!draft.length}>
          <Text style={StrokeRecorderStyles.secondaryButtonText}>נקה</Text>
        </TapButton>
        <TapButton style={StrokeRecorderStyles.saveButton} onPress={save}>
          <Text style={StrokeRecorderStyles.saveButtonText}>שמור {itemLabel}</Text>
        </TapButton>
      </View>
      <View style={StrokeRecorderStyles.actions}>
        {isSaved && (
          <TapButton style={StrokeRecorderStyles.dangerButton} onPress={removeSaved}>
            <Text style={StrokeRecorderStyles.dangerButtonText}>מחק מהמאגר</Text>
          </TapButton>
        )}
        <TapButton
          style={StrokeRecorderStyles.secondaryButton}
          onPress={() => setPosition((prev) => Math.min(items.length, prev + 1))}
          disabled={position >= items.length}
        >
          <Text style={StrokeRecorderStyles.secondaryButtonText}>הבא</Text>
        </TapButton>
      </View>

      <Modal visible={exportVisible} animationType="slide" onRequestClose={() => setExportVisible(false)}>
        <View style={StrokeRecorderStyles.exportModal}>
          <Text style={StrokeRecorderStyles.exportTitle}>העתקה לצ׳אט</Text>
          <Text style={StrokeRecorderStyles.exportHint}>
            לחצו ארוכות על הטקסט, העתיקו, והדביקו כאן ספרה או אות אחת בכל פעם
          </Text>
          <ScrollView style={StrokeRecorderStyles.exportScroll}>
            <Text selectable style={StrokeRecorderStyles.exportCode}>
              {exportJson}
            </Text>
          </ScrollView>
          <View style={StrokeRecorderStyles.actions}>
            <TapButton style={StrokeRecorderStyles.secondaryButton} onPress={() => setExportVisible(false)}>
              <Text style={StrokeRecorderStyles.secondaryButtonText}>סגור</Text>
            </TapButton>
            <TapButton
              style={StrokeRecorderStyles.secondaryButton}
              onPress={() => openExport(exportStrokeMapJson())}
            >
              <Text style={StrokeRecorderStyles.secondaryButtonText}>הכל</Text>
            </TapButton>
            <TapButton style={StrokeRecorderStyles.saveButton} onPress={() => shareJson(exportJson)}>
              <Text style={StrokeRecorderStyles.saveButtonText}>שיתוף</Text>
            </TapButton>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StrokeRecorderPage;
