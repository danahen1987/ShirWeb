import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import TapButton from './TapButton';
import { ExampleWord } from '../types';
import { WordCarouselStyles } from '../styles/AppStyles';
import HighlightedHebrewText from './HighlightedHebrewText';
import ttsService from '../services/TTSService';

const WordCarousel = ({
  words,
  letter,
}: {
  words: ExampleWord[];
  letter: string;
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const pageWidth = Math.max(260, screenWidth - 48);
  const lastIndex = words.length - 1;
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setPage(0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: pageWidth * Math.max(0, lastIndex),
        animated: false,
      });
    });
  }, [letter, lastIndex, pageWidth]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetPage = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    const logicalPage = lastIndex - offsetPage;
    setPage(Math.max(0, Math.min(logicalPage, lastIndex)));
  };

  if (!words.length) {
    return null;
  }

  return (
    <View style={WordCarouselStyles.container}>
      <View style={{ width: pageWidth, alignSelf: 'center', direction: 'ltr' }}>
        <ScrollView
          ref={scrollRef}
          key={letter}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          decelerationRate="fast"
          contentOffset={{ x: pageWidth * lastIndex, y: 0 }}
          style={{ width: pageWidth }}
        >
          {[...words].reverse().map((word, reversedIndex) => (
            <TapButton
              key={`${word.text}-${lastIndex - reversedIndex}`}
              style={[WordCarouselStyles.page, { width: pageWidth }]}
              onPress={() => ttsService.speakCharacter(word.text)}
            >
              {!!word.icon && <Text style={WordCarouselStyles.icon}>{word.icon}</Text>}
              <HighlightedHebrewText text={word.text} letter={letter} style={WordCarouselStyles.word} />
            </TapButton>
          ))}
        </ScrollView>
      </View>
      <View style={WordCarouselStyles.dots}>
        {words.map((word, index) => (
          <View
            key={`${word.text}-dot-${index}`}
            style={[
              WordCarouselStyles.dot,
              words.length - 1 - index === page && WordCarouselStyles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default WordCarousel;
