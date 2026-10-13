import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import TapButton from './TapButton';
import { CharacterNavigationRibbonStyles } from '../styles/AppStyles';
import { PracticeItem } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type CharacterNavigationRibbonProps = {
  characters: PracticeItem[];
  currentPosition: number;
  onCharacterSelect: (id: number, position: number) => void;
  currentCharacter: PracticeItem | null;
  viewedCharacters?: Set<number>;
  orientation?: 'horizontal' | 'vertical';
};

const CharacterNavigationRibbon = ({
  characters,
  currentPosition,
  onCharacterSelect,
  viewedCharacters = new Set(),
  orientation = 'horizontal',
}: CharacterNavigationRibbonProps) => {
  const isVertical = orientation === 'vertical';
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);
  const characterRefs = useRef<Array<View | null>>([]);
  const viewportSizeRef = useRef(isVertical ? 300 : screenWidth);

  const autoScrollToCharacter = useCallback((characterIndex: number, animated = true) => {
    if (!scrollViewRef.current) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    isScrollingRef.current = true;

    scrollTimeoutRef.current = setTimeout(() => {
      const node = characterRefs.current[characterIndex];
      const itemSize = 54;
      const offset = 20;
      const fallback = characterIndex * itemSize + offset;
      const finish = () => {
        setTimeout(() => {
          isScrollingRef.current = false;
        }, animated ? 300 : 0);
      };

      if (!node || !scrollViewRef.current) {
        scrollViewRef.current?.scrollTo(
          isVertical ? { y: Math.max(0, fallback), animated } : { x: Math.max(0, fallback), animated },
        );
        finish();
        return;
      }

      try {
        node.measureLayout(
          scrollViewRef.current as unknown as number,
          (x, y, width, height) => {
            if (isVertical) {
              const itemCenter = y + height / 2;
              const scrollToY = itemCenter - viewportSizeRef.current / 2;
              scrollViewRef.current?.scrollTo({
                y: Math.max(0, scrollToY),
                animated,
              });
            } else {
              const characterCenter = x + width / 2;
              const scrollToX = characterCenter - viewportSizeRef.current / 2 + offset;
              scrollViewRef.current?.scrollTo({
                x: Math.max(0, scrollToX),
                animated,
              });
            }
            finish();
          },
          () => {
            scrollViewRef.current?.scrollTo(
              isVertical ? { y: Math.max(0, fallback), animated } : { x: Math.max(0, fallback), animated },
            );
            finish();
          },
        );
      } catch {
        scrollViewRef.current?.scrollTo(
          isVertical ? { y: Math.max(0, fallback), animated } : { x: Math.max(0, fallback), animated },
        );
        finish();
      }
    }, 100);
  }, [isVertical]);

  useEffect(() => {
    if (characters.length > 0 && currentPosition > 0) {
      autoScrollToCharacter(currentPosition - 1, true);
    }
  }, [currentPosition, characters.length, autoScrollToCharacter]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const getCharacterTextStyle = (character: string, isCurrent = false, isViewed = false) => {
    const characterLength = character ? character.length : 1;
    let fontSize = 18;
    if (characterLength > 1) {
      fontSize = Math.max(12, 18 - (characterLength - 1) * 3);
    }
    if (isCurrent) {
      fontSize = Math.min(fontSize + 2, 24);
    }
    const style: { fontSize: number; fontWeight: '500'; color?: string } = {
      fontSize,
      fontWeight: '500',
    };
    if (!isViewed) {
      style.color = CharacterNavigationRibbonStyles.characterText.color;
    }
    return style;
  };

  const handleCharacterPress = useCallback(
    (index: number) => {
      if (!isVertical && isScrollingRef.current) {
        return;
      }
      const character = characters[index];
      if (character && onCharacterSelect) {
        if (!isVertical) {
          isScrollingRef.current = true;
        }
        onCharacterSelect(character.id, index + 1);
        autoScrollToCharacter(index, true);
      }
    },
    [characters, onCharacterSelect, autoScrollToCharacter, isVertical],
  );

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <View style={isVertical ? CharacterNavigationRibbonStyles.verticalContainer : CharacterNavigationRibbonStyles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal={!isVertical}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          isVertical
            ? CharacterNavigationRibbonStyles.verticalScrollContent
            : CharacterNavigationRibbonStyles.scrollContent
        }
        style={isVertical ? CharacterNavigationRibbonStyles.verticalScrollView : CharacterNavigationRibbonStyles.scrollView}
        decelerationRate={0.98}
        scrollEventThrottle={16}
        bounces={false}
        pagingEnabled={false}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        scrollEnabled
        directionalLockEnabled={false}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          viewportSizeRef.current = isVertical ? height : width || screenWidth;
        }}
      >
        {characters.map((character, index) => {
          const isCurrent = currentPosition > 0 && index + 1 === currentPosition;
          const isViewed = viewedCharacters.has(character.id);
          const isCurrentlySelected = isCurrent;
          const isViewedButNotCurrent = isViewed && !isCurrent;

          return (
            <View
              key={`${character.id}-${index}`}
              ref={(el) => {
                characterRefs.current[index] = el;
              }}
              collapsable={false}
            >
              <TapButton
                style={[
                  CharacterNavigationRibbonStyles.characterItem,
                  isVertical && CharacterNavigationRibbonStyles.verticalCharacterItem,
                  isCurrentlySelected && CharacterNavigationRibbonStyles.currentCharacterItem,
                  isViewedButNotCurrent && CharacterNavigationRibbonStyles.viewedCharacterItem,
                ]}
                onPress={() => handleCharacterPress(index)}
                hitSlop={8}
              >
                <Text
                  style={[
                    getCharacterTextStyle(character.character, isCurrent, isViewedButNotCurrent),
                    isCurrentlySelected && CharacterNavigationRibbonStyles.currentCharacterText,
                    isViewedButNotCurrent && CharacterNavigationRibbonStyles.viewedCharacterText,
                  ]}
                >
                  {character.character}
                </Text>
                <Text
                  style={[
                    CharacterNavigationRibbonStyles.positionText,
                    isCurrentlySelected && CharacterNavigationRibbonStyles.currentPositionText,
                  ]}
                >
                  {index + 1}
                </Text>
              </TapButton>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CharacterNavigationRibbon;
