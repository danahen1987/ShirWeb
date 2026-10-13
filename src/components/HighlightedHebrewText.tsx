import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';

const IS_NIQQUD = /[\u0591-\u05C7]/;

function stripNiqqud(value: string) {
  return value.replace(/[\u0591-\u05C7]/g, '');
}

function splitClusters(text: string): string[] {
  const clusters: string[] = [];
  for (const char of text) {
    if (IS_NIQQUD.test(char) && clusters.length > 0) {
      clusters[clusters.length - 1] += char;
    } else {
      clusters.push(char);
    }
  }
  return clusters;
}

const HighlightedHebrewText = ({
  text,
  letter,
  style,
  highlightStyle,
}: {
  text: string;
  letter: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
}) => {
  const target = stripNiqqud(letter);
  const clusters = splitClusters(text);

  return (
    <Text style={style}>
      {clusters.map((cluster, index) => {
        const isMatch = stripNiqqud(cluster) === target;
        return (
          <Text key={`${cluster}-${index}`} style={isMatch ? [styles.highlight, highlightStyle] : undefined}>
            {cluster}
          </Text>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  highlight: {
    color: '#3498db',
    fontWeight: '900',
  },
});

export default HighlightedHebrewText;
