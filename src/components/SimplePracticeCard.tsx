import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import TapButton from './TapButton';
import { DatabaseHelper } from '../database/DatabaseHelper';
import { DeckKind, PracticeItem } from '../types';
import { CommonStyles, SimpleCharacterCardStyles } from '../styles/AppStyles';
import CharacterNavigationRibbon from './CharacterNavigationRibbon';
import InteractiveStrokePracticeModal from './InteractiveStrokePracticeModal';
import HighlightedHebrewText from './HighlightedHebrewText';
import WordCarousel from './WordCarousel';
import NavChevron from './NavChevron';
import TapHintFinger from './TapHintFinger';
import ttsService from '../services/TTSService';
import { dismissTapHint, isTapHintVisible } from '../utils/sessionHints';

const NUMBER_CARD_ICONS = [
  '🍎',
  '⭐',
  '🎈',
  '🐸',
  '🍌',
  '🍋',
  '🍓',
  '⚽',
  '🦋',
  '🥕',
  '🐻',
  '🐦',
  '🌸',
  '🍪',
  '🐟',
  '🌙',
  '🐝',
  '🚗',
  '🐶',
  '🐱',
];

const NumberIcons = ({ value }: { value: number }) => {
  if (value <= 0) return null;
  const icon = NUMBER_CARD_ICONS[(value - 1) % NUMBER_CARD_ICONS.length];
  const size = value <= 1 ? 112 : value <= 3 ? 88 : value <= 6 ? 68 : value <= 10 ? 52 : 40;
  return (
    <View style={[SimpleCharacterCardStyles.numberIcons, { gap: size > 60 ? 16 : 8 }]}>
      {Array.from({ length: value }, (_, index) => (
        <Text key={`${icon}-${index}`} style={{ fontSize: size, lineHeight: size + 8 }}>
          {icon}
        </Text>
      ))}
    </View>
  );
};

type SimplePracticeCardProps = {
  deck: DeckKind;
  onBackToLanding: () => void;
  onNavigateToPractice: (position: number) => void;
  databaseHelper: DatabaseHelper;
};

const SimplePracticeCard = ({
  deck,
  onBackToLanding,
  onNavigateToPractice,
  databaseHelper,
}: SimplePracticeCardProps) => {
  const [currentCharacter, setCurrentCharacter] = useState<PracticeItem | null>(null);
  const [currentCharacterId, setCurrentCharacterId] = useState(1);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [allCharacters, setAllCharacters] = useState<PracticeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showStrokePractice, setShowStrokePractice] = useState(false);
  const [selectedCharacterForStroke, setSelectedCharacterForStroke] = useState<string | null>(null);
  const [allCharactersData, setAllCharactersData] = useState(new Map<number, PracticeItem>());
  const [viewedCharacters, setViewedCharacters] = useState(new Set<number>());
  const [userViewedCount, setUserViewedCount] = useState(0);
  const [showTapHint, setShowTapHint] = useState(() => isTapHintVisible(deck));

  const getCharacterTextStyle = (character: string) => {
    const characterLength = character ? character.length : 1;
    let fontSize = deck === 'letter' ? 220 : 168;
    if (characterLength > 1) {
      fontSize = Math.max(72, fontSize - (characterLength - 1) * 28);
    }
    return {
      ...SimpleCharacterCardStyles.characterText,
      fontSize,
      lineHeight: fontSize + 36,
      textAlign: 'center' as const,
      alignSelf: 'center' as const,
      includeFontPadding: false,
    };
  };

  const loadViewedCharacters = () => {
    const viewed = databaseHelper.progressService.getViewedCharacters(deck);
    const viewedSet = new Set(viewed.map((record) => record.characterId));
    setViewedCharacters(viewedSet);
    setUserViewedCount(viewedSet.size);
    return viewedSet;
  };

  const trackCharacterView = async (characterId: number) => {
    const wasNewView = await databaseHelper.markCharacterAsViewed(1, characterId);
    setViewedCharacters((prev) => new Set(prev).add(characterId));
    if (wasNewView) {
      const viewed = databaseHelper.progressService.getViewedIds(deck);
      setUserViewedCount(viewed.size);
    }
  };

  const loadCharacter = (characterId: number, position: number) => {
    const characterData = allCharactersData.get(characterId);
    if (characterData) {
      setCurrentCharacter(characterData);
      setCurrentCharacterId(characterId);
      setCurrentPosition(position);
      setError(null);
      trackCharacterView(characterId);
    } else {
      setError('הפריט לא נמצא');
    }
  };

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const characters = databaseHelper.getAllCharacters(deck);
      if (characters.length === 0) {
        setError('אין נתונים');
        return;
      }
      setAllCharacters(characters);
      const characterDataMap = new Map<number, PracticeItem>();
      characters.forEach((char) => {
        characterDataMap.set(char.id, char);
      });
      setAllCharactersData(characterDataMap);
      loadViewedCharacters();

      const lastId = databaseHelper.progressService.getLastViewedCharacterId(deck);
      const lastIndex = lastId ? characters.findIndex((char) => char.id === lastId) : -1;
      const start = lastIndex >= 0 ? characters[lastIndex] : characters[0];
      const startPosition = lastIndex >= 0 ? lastIndex + 1 : 1;
      setCurrentCharacter(start);
      setCurrentCharacterId(start.id);
      setCurrentPosition(startPosition);
      await trackCharacterView(start.id);
    } catch (initError) {
      setError(initError instanceof Error ? initError.message : 'שגיאה בטעינה');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();
    setShowTapHint(isTapHintVisible(deck));
  }, [deck, databaseHelper]);

  const handleNext = useCallback(() => {
    const nextIndex = currentPosition;
    if (nextIndex < allCharacters.length) {
      const next = allCharacters[nextIndex];
      loadCharacter(next.id, currentPosition + 1);
      setSelectedCharacterForStroke(next.character);
    }
  }, [currentPosition, allCharacters]);

  const handlePrevious = useCallback(() => {
    const prevIndex = currentPosition - 2;
    if (prevIndex >= 0) {
      const previous = allCharacters[prevIndex];
      loadCharacter(previous.id, currentPosition - 1);
      setSelectedCharacterForStroke(previous.character);
    }
  }, [currentPosition, allCharacters]);

  const handleCharacterClick = useCallback((glyph: string) => {
    dismissTapHint(deck);
    setShowTapHint(false);
    setSelectedCharacterForStroke(glyph);
    setShowStrokePractice(true);
  }, [deck]);

  const handleCharacterSound = useCallback(() => {
    if (!currentCharacter) return;
    if (deck === 'number') {
      ttsService.speakCharacter(currentCharacter.feminine || currentCharacter.speakText);
      return;
    }
    ttsService.speakCharacter(currentCharacter.speakText || currentCharacter.nameNiqqud);
  }, [currentCharacter, deck]);

  const title = deck === 'letter' ? 'תרגול אותיות' : 'תרגול מספרים';

  if (isLoading) {
    return (
      <View style={CommonStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={CommonStyles.loadingText}>טוען...</Text>
        {error && <Text style={SimpleCharacterCardStyles.errorText}>{error}</Text>}
      </View>
    );
  }

  if (error || !currentCharacter) {
    return (
      <View style={CommonStyles.errorContainer}>
        <Text style={CommonStyles.errorText}>{error || 'אין נתונים'}</Text>
        <TapButton style={SimpleCharacterCardStyles.retryButton} onPress={initializeApp}>
          <Text style={SimpleCharacterCardStyles.retryButtonText}>נסו שוב</Text>
        </TapButton>
        <TapButton style={SimpleCharacterCardStyles.backButton} onPress={onBackToLanding}>
          <NavChevron direction="left" size={22} />
        </TapButton>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <View style={SimpleCharacterCardStyles.header}>
        <TapButton style={SimpleCharacterCardStyles.backButton} onPress={onBackToLanding}>
          <NavChevron direction="left" size={22} />
        </TapButton>
        <View style={SimpleCharacterCardStyles.headerTitleContainer}>
          <Text style={SimpleCharacterCardStyles.title}>{title}</Text>
          <Text style={SimpleCharacterCardStyles.userIndicator}>נצפו: {userViewedCount}</Text>
        </View>
        <Text style={SimpleCharacterCardStyles.characterCounter}>
          {currentPosition} / {allCharacters.length}
        </Text>
      </View>

      <CharacterNavigationRibbon
        characters={allCharacters}
        currentPosition={currentPosition}
        onCharacterSelect={loadCharacter}
        currentCharacter={currentCharacter}
        viewedCharacters={viewedCharacters}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      >
        <View style={SimpleCharacterCardStyles.letterSection}>
          <View style={SimpleCharacterCardStyles.characterContainer}>
            {viewedCharacters.has(currentCharacterId) && (
              <View style={SimpleCharacterCardStyles.viewedStar}>
                <Text style={SimpleCharacterCardStyles.starText}>★</Text>
              </View>
            )}
            <TapButton
              style={SimpleCharacterCardStyles.individualCharacter}
              onPress={() => handleCharacterClick(currentCharacter.character)}
            >
              <Text style={getCharacterTextStyle(currentCharacter.character)}>
                {currentCharacter.character}
              </Text>
              {showTapHint && !showStrokePractice && <TapHintFinger />}
            </TapButton>
            <TapButton
              style={SimpleCharacterCardStyles.practiceLinkButton}
              onPress={() => onNavigateToPractice(currentPosition)}
            >
              <Text style={SimpleCharacterCardStyles.practiceLinkIcon}>✏️</Text>
              <Text style={SimpleCharacterCardStyles.practiceLinkText}>תרגול</Text>
            </TapButton>
          </View>

          <TapButton
            style={[
              SimpleCharacterCardStyles.cardNavArrow,
              SimpleCharacterCardStyles.cardNavArrowLeft,
              currentPosition <= 1 && SimpleCharacterCardStyles.cardNavArrowDisabled,
            ]}
            onPress={handlePrevious}
            disabled={currentPosition <= 1}
          >
            <NavChevron direction="left" />
          </TapButton>

          <TapButton
            style={[
              SimpleCharacterCardStyles.cardNavArrow,
              SimpleCharacterCardStyles.cardNavArrowRight,
              currentPosition >= allCharacters.length && SimpleCharacterCardStyles.cardNavArrowDisabled,
            ]}
            onPress={handleNext}
            disabled={currentPosition >= allCharacters.length}
          >
            <NavChevron direction="right" />
          </TapButton>
        </View>

        <Text style={SimpleCharacterCardStyles.strokePracticeHint}>
          {deck === 'letter' ? 'לחצו על האות לתרגול כתיבה' : 'לחצו על המספר לתרגול כתיבה'}
        </Text>

        {deck === 'letter' ? (
          <>
            <View style={SimpleCharacterCardStyles.discoveryField}>
              <TapButton onPress={handleCharacterSound}>
                <HighlightedHebrewText
                  text={currentCharacter.nameNiqqud}
                  letter={currentCharacter.character}
                  style={SimpleCharacterCardStyles.letterNameText}
                />
              </TapButton>
            </View>
            <View style={SimpleCharacterCardStyles.nameBalanceSpacer} />
            <View style={SimpleCharacterCardStyles.wordsDock}>
              <WordCarousel
                key={currentCharacterId}
                words={currentCharacter.words}
                letter={currentCharacter.character}
              />
            </View>
          </>
        ) : (
          <>
            <View style={SimpleCharacterCardStyles.discoveryField}>
              <View style={SimpleCharacterCardStyles.discoveryContent}>
                <TapButton onPress={() => ttsService.speakCharacter(currentCharacter.feminine || '')}>
                  <Text style={SimpleCharacterCardStyles.numberGenderLabel}>נקבה</Text>
                  <Text style={SimpleCharacterCardStyles.numberGenderText}>{currentCharacter.feminine}</Text>
                </TapButton>
                <TapButton onPress={() => ttsService.speakCharacter(currentCharacter.masculine || '')}>
                  <Text style={SimpleCharacterCardStyles.numberGenderLabel}>זכר</Text>
                  <Text style={SimpleCharacterCardStyles.numberGenderText}>{currentCharacter.masculine}</Text>
                </TapButton>
              </View>
            </View>
            <NumberIcons value={currentCharacter.value ?? 0} />
          </>
        )}
      </ScrollView>

      <InteractiveStrokePracticeModal
        visible={showStrokePractice}
        onClose={() => {
          setShowStrokePractice(false);
          setSelectedCharacterForStroke(null);
        }}
        character={selectedCharacterForStroke}
        onComplete={() => {
          databaseHelper.progressService.markCharacterCompleted(currentCharacterId, deck);
        }}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={currentPosition < allCharacters.length}
        canGoPrevious={currentPosition > 1}
      />
    </View>
  );
};

export default SimplePracticeCard;
