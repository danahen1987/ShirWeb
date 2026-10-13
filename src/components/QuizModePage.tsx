import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Alert, Dimensions } from 'react-native';
import TapButton from './TapButton';
import { QuizModeStyles, SimpleCharacterCardStyles } from '../styles/AppStyles';
import { LEARNING_CONFIG } from '../constants/AppConstants';
import { QUIZ_COUNT_EMOJIS } from '../data/quizEmojis';
import { DatabaseHelper } from '../database/DatabaseHelper';
import { ProgressService } from '../services/ProgressService';
import { ExampleWord, PracticeItem } from '../types';
import NavChevron from './NavChevron';
import QuizCelebrationBurst from './QuizCelebrationBurst';

type QuizTab = 'numbers' | 'letters';

type QuizOption = {
  key: string;
  text: string;
  icon?: string;
};

type QuizQuestion = {
  type: QuizTab;
  character: string;
  emoji?: string;
  count?: number;
  options: QuizOption[];
  correctAnswer: number;
};

const BLUE_BALLOONS = ['🔵', '🔵', '🔵', '🔵', '🔵'];
const SOFIT_LETTERS = new Set(['ך', 'ם', 'ן', 'ף', 'ץ']);

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => 0.5 - Math.random());

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const uniqueWordsFromPool = (letters: PracticeItem[]): ExampleWord[] => {
  const seen = new Set<string>();
  const words: ExampleWord[] = [];
  letters.forEach((letter) => {
    letter.words.forEach((word) => {
      if (!seen.has(word.text)) {
        seen.add(word.text);
        words.push(word);
      }
    });
  });
  return words;
};

const wordMatchesLetter = (word: ExampleWord, letter: string) => {
  const text = word.text.trim();
  if (!text) return false;
  if (SOFIT_LETTERS.has(letter)) {
    return text[text.length - 1] === letter;
  }
  return text[0] === letter;
};

const splitWordsForLetter = (letter: string, pool: PracticeItem[]) => {
  const words = uniqueWordsFromPool(pool);
  return {
    matching: words.filter((word) => wordMatchesLetter(word, letter)),
    distractors: words.filter((word) => !wordMatchesLetter(word, letter)),
  };
};

const letterCanBeQuestion = (letter: PracticeItem, pool: PracticeItem[]) => {
  const { matching, distractors } = splitWordsForLetter(letter.character, pool);
  return matching.length >= 1 && distractors.length >= 4;
};

const isQuizNumber = (item: PracticeItem | null): item is PracticeItem =>
  !!item && item.value != null && item.value <= LEARNING_CONFIG.visibleNumberMax;

const hasAnyViewedProgress = (progressService: ProgressService) =>
  progressService.getViewedCharacters('letter').length > 0 ||
  progressService.getViewedCharacters('number').length > 0;

const BALLOON_GAP = 12;
const PREFERRED_BALLOON_SIZE = 184;

type BalloonPoint = { x: number; y: number };

type BalloonLayout = {
  positions: BalloonPoint[];
  size: number;
  height: number;
};

type StoredQuestion = {
  question: QuizQuestion;
  balloonLayout: BalloonLayout;
  selectedAnswer: number | null;
  isCorrect: boolean;
  answered: boolean;
};

const balloonDistance = (a: BalloonPoint, b: BalloonPoint) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const balloonSizeForWidth = (containerWidth: number) =>
  Math.min(PREFERRED_BALLOON_SIZE, Math.floor((Math.max(containerWidth, PREFERRED_BALLOON_SIZE) - BALLOON_GAP) / 2));

const packedBalloonSlot = (index: number, width: number, size: number): BalloonPoint => {
  const twoColWidth = size * 2 + BALLOON_GAP;
  const left = Math.max(0, (width - twoColWidth) / 2);
  const right = left + size + BALLOON_GAP;
  const center = Math.max(0, (width - size) / 2);
  const row = size + BALLOON_GAP;
  const slots = [
    { x: left, y: 0 },
    { x: right, y: 0 },
    { x: left, y: row },
    { x: right, y: row },
    { x: center, y: row * 2 },
  ];
  return slots[index] || { x: 0, y: 0 };
};

const isFarEnough = (candidate: BalloonPoint, others: BalloonPoint[], minDistance: number) =>
  others.every((point) => balloonDistance(point, candidate) >= minDistance);

const generateOrganicBalloonLayout = (itemCount: number, containerWidth: number): BalloonLayout => {
  const width = Math.max(containerWidth, PREFERRED_BALLOON_SIZE);
  const size = balloonSizeForWidth(width);
  const minDistance = size + BALLOON_GAP;
  const height = size * 3.4 + BALLOON_GAP * 2;
  const maxX = Math.max(0, width - size);
  const maxY = Math.max(0, height - size);
  const positions = Array.from({ length: itemCount }, (_, index) => packedBalloonSlot(index, width, size));

  for (let round = 0; round < 80; round++) {
    for (let i = 0; i < positions.length; i++) {
      const candidate = {
        x: Math.min(maxX, Math.max(0, positions[i].x + (Math.random() - 0.5) * size * 0.9)),
        y: Math.min(maxY, Math.max(0, positions[i].y + (Math.random() - 0.5) * size * 0.9)),
      };
      const others = positions.filter((_, index) => index !== i);
      if (isFarEnough(candidate, others, minDistance)) {
        positions[i] = candidate;
      }
    }
  }

  return { positions, size, height };
};

const QuizModePage = ({
  quizType,
  databaseHelper,
  progressService,
  onBack,
}: {
  quizType: QuizTab;
  databaseHelper: DatabaseHelper;
  progressService: ProgressService;
  onBack: () => void;
}) => {
  const [useAllData, setUseAllData] = useState(() => !hasAnyViewedProgress(progressService));
  const [viewedCharacters, setViewedCharacters] = useState<PracticeItem[]>([]);
  const [optionPool, setOptionPool] = useState<PracticeItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [balloonColors, setBalloonColors] = useState([...BLUE_BALLOONS]);
  const [balloonAreaWidth, setBalloonAreaWidth] = useState(Dimensions.get('window').width - 56);
  const [balloonLayout, setBalloonLayout] = useState(() =>
    generateOrganicBalloonLayout(5, Dimensions.get('window').width - 56),
  );
  const questionBankRef = useRef<StoredQuestion[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<PracticeItem[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedQuizLength, setSelectedQuizLength] = useState<number | null>(null);

  const viewedItemsForKind = (kind: 'letter' | 'number') =>
    progressService
      .getViewedCharacters(kind)
      .map((record) => databaseHelper.getCharacter(record.characterId))
      .filter((item): item is PracticeItem => !!item);

  const getPools = () => {
    if (quizType === 'numbers') {
      const numbers = (useAllData ? databaseHelper.getAllCharacters('number') : viewedItemsForKind('number')).filter(
        isQuizNumber,
      );
      return { questions: numbers, options: numbers };
    }

    const letters = useAllData ? databaseHelper.getAllCharacters('letter') : viewedItemsForKind('letter');
    return {
      questions: letters.filter((letter) => letterCanBeQuestion(letter, letters)),
      options: letters,
    };
  };

  const loadQuizPool = () => {
    const pools = getPools();
    setOptionPool(pools.options);
    setViewedCharacters(pools.questions);
  };

  useEffect(() => {
    loadQuizPool();
    return progressService.subscribe(loadQuizPool);
  }, [quizType, useAllData, databaseHelper, progressService]);

  const storeQuestion = (index: number, question: QuizQuestion, layout: BalloonLayout) => {
    questionBankRef.current[index] = {
      question,
      balloonLayout: layout,
      selectedAnswer: null,
      isCorrect: false,
      answered: false,
    };
  };

  const applyStoredQuestion = (stored: StoredQuestion) => {
    setCurrentQuestion(stored.question);
    setBalloonLayout(stored.balloonLayout);
    setSelectedAnswer(stored.selectedAnswer);
    setIsCorrect(stored.isCorrect);
    setShowResult(stored.answered);
    const colors = [...BLUE_BALLOONS];
    if (stored.answered && stored.selectedAnswer != null) {
      if (stored.isCorrect) {
        colors[stored.selectedAnswer] = '🟢';
      } else {
        colors[stored.selectedAnswer] = '🔴';
        colors[stored.question.correctAnswer] = '🟢';
      }
    }
    setBalloonColors(colors);
  };

  const generateNumbersQuestion = (character: PracticeItem, pool: PracticeItem[], index: number) => {
    const count = character.value ?? 0;
    const wrongAnswers = shuffle(pool.filter((item) => item.id !== character.id)).slice(0, 3);
    const optionItems = shuffle([character, ...wrongAnswers]);
    const question: QuizQuestion = {
      type: 'numbers',
      character: character.character,
      emoji: pickRandom(QUIZ_COUNT_EMOJIS),
      count,
      options: optionItems.map((item) => ({
        key: item.character,
        text: item.character,
      })),
      correctAnswer: optionItems.findIndex((item) => item.id === character.id),
    };
    storeQuestion(index, question, balloonLayout);
    setCurrentQuestion(question);
  };

  const generateLettersQuestion = (
    character: PracticeItem,
    index: number,
    questionsArray: PracticeItem[],
    pool: PracticeItem[],
  ) => {
    const { matching, distractors: unmatched } = splitWordsForLetter(character.character, pool);
    const correctWord = matching.length ? pickRandom(matching) : undefined;
    const distractors = shuffle(unmatched).slice(0, 4);

    if (!correctWord || distractors.length < 4) {
      generateQuestion(index + 1, questionsArray, pool);
      return;
    }

    const optionWords = shuffle([correctWord, ...distractors]);
    const layout = generateOrganicBalloonLayout(5, balloonAreaWidth);
    const question: QuizQuestion = {
      type: 'letters',
      character: character.character,
      options: optionWords.map((word) => ({
        key: word.text,
        icon: word.icon,
        text: word.text,
      })),
      correctAnswer: optionWords.findIndex((word) => word.text === correctWord.text),
    };
    storeQuestion(index, question, layout);
    setBalloonLayout(layout);
    setCurrentQuestion(question);
  };

  const generateQuestion = (index: number, questionsArray = shuffledQuestions, pool = optionPool) => {
    if (index >= questionsArray.length) {
      setQuizComplete(true);
      return;
    }
    const stored = questionBankRef.current[index];
    if (stored) {
      applyStoredQuestion(stored);
      return;
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setBalloonColors([...BLUE_BALLOONS]);
    const character = questionsArray[index];
    if (quizType === 'numbers') {
      generateNumbersQuestion(character, pool, index);
    } else {
      generateLettersQuestion(character, index, questionsArray, pool);
    }
  };

  const startQuizWithLength = (quizLength: number) => {
    const pools = getPools();
    if (pools.questions.length < 2) {
      Alert.alert(
        'אין פריטים לחידון',
        useAllData
          ? 'אין מספיק פריטים לחידון כרגע.'
          : quizType === 'numbers'
            ? 'צריך לפתוח לפחות שני מספרים עם כוכב כחול כדי להתחיל.'
            : 'צריך לפתוח לפחות שתי אותיות עם כוכב כחול כדי להתחיל.',
        [{ text: 'אישור' }],
      );
      return;
    }

    const actualQuizLength = Math.min(quizLength, pools.questions.length);
    const shuffled = shuffle(pools.questions).slice(0, actualQuizLength);
    questionBankRef.current = [];
    setOptionPool(pools.options);
    setViewedCharacters(pools.questions);
    setShuffledQuestions(shuffled);
    setQuizStarted(true);
    setQuestionIndex(0);
    setQuizComplete(false);
    setSelectedQuizLength(quizLength);
    generateQuestion(0, shuffled, pools.options);
  };

  const selectAnswer = (index: number) => {
    if (showResult || !currentQuestion) return;
    setSelectedAnswer(index);
    const correct = index === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }
    const newColors = [...BLUE_BALLOONS];
    if (correct) {
      newColors[index] = '🟢';
    } else {
      newColors[index] = '🔴';
      newColors[currentQuestion.correctAnswer] = '🟢';
    }
    setBalloonColors(newColors);
    const stored = questionBankRef.current[questionIndex];
    if (stored) {
      stored.selectedAnswer = index;
      stored.isCorrect = correct;
      stored.answered = true;
    }
  };

  const goToQuestion = (index: number) => {
    if (index < 0) return;
    if (index >= shuffledQuestions.length) {
      setQuizComplete(true);
      return;
    }
    setQuestionIndex(index);
    generateQuestion(index);
  };

  const resetQuiz = () => {
    questionBankRef.current = [];
    setQuizStarted(false);
    setQuizComplete(false);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setCurrentQuestion(null);
    setBalloonColors([...BLUE_BALLOONS]);
    setShuffledQuestions([]);
    setCorrectAnswers(0);
    setSelectedQuizLength(null);
  };

  const renderQuizNavArrows = (placement: 'overlay' | 'below') => {
    const canGoNext = showResult;
    const arrowStyle =
      placement === 'overlay'
        ? [SimpleCharacterCardStyles.cardNavArrow, SimpleCharacterCardStyles.cardNavArrowLeft]
        : [QuizModeStyles.footerNavArrow];

    const button = (
      <TapButton
        style={[...arrowStyle, !canGoNext && SimpleCharacterCardStyles.cardNavArrowDisabled]}
        onPress={() => goToQuestion(questionIndex + 1)}
        disabled={!canGoNext}
      >
        <NavChevron direction="right" />
      </TapButton>
    );

    if (placement === 'below') {
      return <View style={QuizModeStyles.footerNavRow}>{button}</View>;
    }
    return button;
  };

  const renderQuizStart = () => {
    const quizLengthOptions = [
      { length: 5, label: '5 שאלות' },
      { length: 10, label: '10 שאלות' },
      { length: 15, label: '15 שאלות' },
      { length: 25, label: '25 שאלות' },
    ];

    return (
      <View style={QuizModeStyles.quizStartContainer}>
        <Text style={QuizModeStyles.quizTitle}>{quizType === 'numbers' ? 'חידון מספרים' : 'חידון אותיות'}</Text>
        <Text style={QuizModeStyles.quizDescription}>
          {quizType === 'numbers' ? 'ספרו את האימוג’ים' : 'איזו מילה מתחילה באות'}
        </Text>
        <View style={QuizModeStyles.poolToggleContainer}>
          <TapButton
            style={[QuizModeStyles.poolToggleOption, useAllData && QuizModeStyles.poolToggleOptionActive]}
            onPress={() => {
              if (!useAllData) {
                setUseAllData(true);
                resetQuiz();
              }
            }}
          >
            <Text style={[QuizModeStyles.poolToggleText, useAllData && QuizModeStyles.poolToggleTextActive]}>
              כל האותיות והמספרים
            </Text>
          </TapButton>
          <TapButton
            style={[QuizModeStyles.poolToggleOption, !useAllData && QuizModeStyles.poolToggleOptionActive]}
            onPress={() => {
              if (useAllData) {
                setUseAllData(false);
                resetQuiz();
              }
            }}
          >
            <Text style={[QuizModeStyles.poolToggleText, !useAllData && QuizModeStyles.poolToggleTextActive]}>
              לפי האותיות והמספרים שנלמדו
            </Text>
          </TapButton>
        </View>
        <Text style={QuizModeStyles.characterCount}>{viewedCharacters.length} פריטים זמינים לחידון</Text>
        <View style={QuizModeStyles.quizLengthContainer}>
          {quizLengthOptions.map((option) => {
            const isSelected = selectedQuizLength === option.length;
            const isDisabled = viewedCharacters.length < option.length;
            return (
              <TapButton
                key={option.length}
                style={[
                  QuizModeStyles.quizLengthButton,
                  isSelected && !isDisabled && QuizModeStyles.selectedQuizLengthButton,
                  isDisabled && QuizModeStyles.disabledQuizLengthButton,
                ]}
                onPress={() => !isDisabled && startQuizWithLength(option.length)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    QuizModeStyles.quizLengthButtonText,
                    isSelected && !isDisabled && QuizModeStyles.selectedQuizLengthButtonText,
                    isDisabled && QuizModeStyles.disabledQuizLengthButtonText,
                  ]}
                >
                  {option.label}
                </Text>
              </TapButton>
            );
          })}
        </View>
      </View>
    );
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const emojiCount = currentQuestion.count ?? 0;
    const emojis = currentQuestion.emoji ? Array.from({ length: emojiCount }, () => currentQuestion.emoji) : [];

    return (
      <View style={QuizModeStyles.questionContainer}>
        <View style={QuizModeStyles.progressContainer}>
          <Text style={QuizModeStyles.progressText}>
            שאלה {questionIndex + 1} מתוך {shuffledQuestions.length}
          </Text>
          <View style={QuizModeStyles.progressBar}>
            <View
              style={[
                QuizModeStyles.progressFill,
                { width: `${((questionIndex + 1) / shuffledQuestions.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={QuizModeStyles.questionContent}>
          {quizType === 'numbers' ? (
            <View style={[QuizModeStyles.characterContainer, QuizModeStyles.numbersQuestionBox]}>
              <Text style={QuizModeStyles.questionPromptInBox}>ספרו את האימוג׳ים</Text>
              <View style={QuizModeStyles.emojiWrap}>
                {emojis.map((emoji, index) => (
                  <Text key={`${emoji}-${index}`} style={QuizModeStyles.emojiCountItem}>
                    {emoji}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <View style={QuizModeStyles.letterQuestionNavWrap}>
              <View style={[QuizModeStyles.characterContainer, { marginBottom: 0 }]}>
                <Text style={QuizModeStyles.questionPromptInBox}>
                  {SOFIT_LETTERS.has(currentQuestion.character)
                    ? 'איזה מילה נגמרת באות'
                    : 'איזו מילה מתחילה באות'}
                </Text>
                <Text style={QuizModeStyles.letterQuestionDisplay}>{currentQuestion.character}</Text>
              </View>
              {renderQuizNavArrows('overlay')}
            </View>
          )}

          <View
            style={
              quizType === 'numbers'
                ? QuizModeStyles.translationOptionsContainer
                : [QuizModeStyles.optionsContainer, { height: balloonLayout.height }]
            }
            onLayout={
              quizType === 'letters'
                ? (event) => {
                    const nextWidth = Math.round(event.nativeEvent.layout.width);
                    if (nextWidth > 0 && nextWidth !== balloonAreaWidth) {
                      setBalloonAreaWidth(nextWidth);
                    }
                  }
                : undefined
            }
          >
            {currentQuestion.options.map((option, index) => {
              if (quizType === 'numbers') {
                return (
                  <TapButton
                    key={option.key}
                    style={[
                      QuizModeStyles.translationOptionButton,
                      selectedAnswer === index && QuizModeStyles.selectedTranslationOption,
                      showResult && index === currentQuestion.correctAnswer && QuizModeStyles.correctTranslationOption,
                      showResult && selectedAnswer === index && !isCorrect && QuizModeStyles.incorrectTranslationOption,
                    ]}
                    onPress={() => selectAnswer(index)}
                  >
                    <Text
                      style={[
                        QuizModeStyles.translationOptionText,
                        selectedAnswer === index && QuizModeStyles.selectedTranslationOptionText,
                        showResult &&
                          index === currentQuestion.correctAnswer &&
                          QuizModeStyles.correctTranslationOptionText,
                        showResult &&
                          selectedAnswer === index &&
                          !isCorrect &&
                          QuizModeStyles.incorrectTranslationOptionText,
                      ]}
                    >
                      {option.text}
                    </Text>
                  </TapButton>
                );
              }

              const position = balloonLayout.positions[index] || { x: 0, y: 0 };
              const size = balloonLayout.size;
              return (
                <TapButton
                  key={option.key}
                  style={[
                    QuizModeStyles.optionButton,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      left: position.x,
                      top: position.y,
                    },
                  ]}
                  onPress={() => selectAnswer(index)}
                >
                  <Text
                    style={[
                      QuizModeStyles.balloonEmoji,
                      { fontSize: size * 0.64, lineHeight: size },
                    ]}
                  >
                    {balloonColors[index]}
                  </Text>
                  <View style={[QuizModeStyles.balloonLabel, { width: size * 0.68 }]}>
                    {option.icon ? <Text style={QuizModeStyles.balloonIcon}>{option.icon}</Text> : null}
                    <Text style={QuizModeStyles.balloonOptionText} numberOfLines={1}>
                      {option.text}
                    </Text>
                  </View>
                </TapButton>
              );
            })}
          </View>
          {quizType === 'numbers' && renderQuizNavArrows('below')}
        </View>
      </View>
    );
  };

  const renderQuizComplete = () => {
    const totalQuestions = shuffledQuestions.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    return (
      <View style={QuizModeStyles.completeContainer}>
        <QuizCelebrationBurst />
        <Text style={QuizModeStyles.completeTitle}>החידון הסתיים!</Text>
        <Text style={QuizModeStyles.scoreText}>הציון: {score}/100</Text>
        <Text style={QuizModeStyles.scoreDetails}>
          {correctAnswers} מתוך {totalQuestions} תשובות נכונות
        </Text>
        <Text style={QuizModeStyles.completeSubtext}>כל הכבוד!</Text>
        <TapButton style={QuizModeStyles.restartButton} onPress={resetQuiz}>
          <Text style={QuizModeStyles.restartButtonText}>חידון נוסף</Text>
        </TapButton>
      </View>
    );
  };

  return (
    <View style={QuizModeStyles.container}>
      <View style={QuizModeStyles.header}>
        <TapButton style={SimpleCharacterCardStyles.backButton} onPress={onBack}>
          <NavChevron direction="left" size={22} />
        </TapButton>
        <Text style={QuizModeStyles.headerTitle}>חידון</Text>
      </View>
      <ScrollView style={QuizModeStyles.content}>
        {!quizStarted && !quizComplete && renderQuizStart()}
        {quizStarted && !quizComplete && currentQuestion && renderQuestion()}
        {quizComplete && renderQuizComplete()}
      </ScrollView>
    </View>
  );
};

export default QuizModePage;
