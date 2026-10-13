import React from 'react';
import { View, Text } from 'react-native';
import { faintLetterPadding, faintLetterSize } from '../constants/tracing';

const FaintLetter = ({ character, canvasSize }: { character: string; canvasSize: number }) => {
  const letterSize = faintLetterSize(character, canvasSize);
  const pad = faintLetterPadding(canvasSize);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: pad,
        right: pad,
        top: pad,
        bottom: pad,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: letterSize,
          color: '#cfcfcf',
          includeFontPadding: false,
          textAlign: 'center',
          lineHeight: letterSize,
        }}
      >
        {character}
      </Text>
    </View>
  );
};

export default FaintLetter;
