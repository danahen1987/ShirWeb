import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  const characterRefs = useRef<Array<View | null>>([]);
  const [viewportSize, setViewportSize] = useState(isVertical ? 300 : screenWidth);

  const scrollerNode = () => {
    const view = scrollViewRef.current as (ScrollView & {
      getScrollableNode?: () => HTMLElement | null;
    }) | null;
    return view?.getScrollableNode?.() ?? null;
  };

  const autoScrollToCharacter = useCallback((characterIndex: number) => {
    const run = () => {
      const scroller = scrollerNode();
      const item = characterRefs.current[characterIndex] as unknown as HTMLElement | null;
      if (!scroller || !item || typeof item.getBoundingClientRect !== 'function') return;
      const itemBox = item.getBoundingClientRect();
      const frame = scroller.getBoundingClientRect();
      const delta = isVertical
        ? itemBox.top + itemBox.height / 2 - (frame.top + frame.height / 2)
        : itemBox.left + itemBox.width / 2 - (frame.left + frame.width / 2);
      if (Math.abs(delta) < 2) return;
      if (isVertical) scroller.scrollTop += delta;
      else scroller.scrollLeft += delta;
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [isVertical]);

  useEffect(() => {
    if (characters.length > 0 && currentPosition > 0) {
      autoScrollToCharacter(currentPosition - 1);
    }
  }, [currentPosition, characters.length, autoScrollToCharacter, viewportSize]);

  useEffect(() => {
    if (isVertical) return;
    const scroller = scrollerNode();
    if (!scroller) return;
    const onWheel = (event: WheelEvent) => {
      if (scroller.scrollWidth <= scroller.clientWidth + 1) return;
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = horizontal ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      scroller.scrollLeft += horizontal ? delta : -delta;
      event.preventDefault();
    };
    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, [isVertical, characters.length]);

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
      const character = characters[index];
      if (character && onCharacterSelect) {
        onCharacterSelect(character.id, index + 1);
        autoScrollToCharacter(index);
      }
    },
    [characters, onCharacterSelect, autoScrollToCharacter],
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
            ? [
                CharacterNavigationRibbonStyles.verticalScrollContent,
                { paddingVertical: Math.max(12, viewportSize / 2 - 28) },
              ]
            : [
                CharacterNavigationRibbonStyles.scrollContent,
                { paddingHorizontal: Math.max(24, viewportSize / 2 - 27) },
              ]
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
          const next = isVertical ? height : width || screenWidth;
          setViewportSize((prev) => (Math.abs(prev - next) < 2 ? prev : next));
          if (currentPosition > 0) autoScrollToCharacter(currentPosition - 1);
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
