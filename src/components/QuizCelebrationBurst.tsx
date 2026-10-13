import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const CELEBRATION_EMOJIS = ['🎉', '🥳', '🤩', '🏆', '🥇', '🌟', '🎊', '👏', '💯', '🚀', '💥', '👑', '🌈', '⭐'];
const SPARKLES = ['✨', '⭐', '💫', '🌟'];

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const QuizCelebrationBurst = () => {
  const emoji = useMemo(() => pick(CELEBRATION_EMOJIS), []);
  const scale = useRef(new Animated.Value(0.08)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0.4),
      glyph: pick(SPARKLES),
      angle: Math.random() * Math.PI * 2,
      distance: 90 + Math.random() * 70,
    })),
  ).current;

  useEffect(() => {
    const burst = Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.35,
          friction: 3.2,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      ...particles.map((particle) =>
        Animated.parallel([
          Animated.timing(particle.x, {
            toValue: Math.cos(particle.angle) * particle.distance,
            duration: 720,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.sin(particle.angle) * particle.distance,
            duration: 720,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1.1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 720,
            delay: 180,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);

    burst.start();
    return () => burst.stop();
  }, [opacity, particles, rotate, scale]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '8deg'],
  });

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {particles.map((particle, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.sparkle,
            {
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          {particle.glyph}
        </Animated.Text>
      ))}
      <Animated.View style={{ opacity, transform: [{ scale }, { rotate: spin }] }}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 148,
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 28,
  },
});

export default QuizCelebrationBurst;
