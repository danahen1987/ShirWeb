import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Animated } from 'react-native';
import TapButton from './TapButton';
import Svg, { Circle, Path } from 'react-native-svg';
import { InteractiveStrokePracticeModalStyles, SimpleCharacterCardStyles } from '../styles/AppStyles';
import { getStrokeData } from '../data/strokePaths';
import { subscribeStrokeStore } from '../data/strokeStore';
import TracingCanvas from './TracingCanvas';
import NavChevron from './NavChevron';

const InteractiveStrokePracticeModal = ({
  visible,
  onClose,
  character,
  onComplete,
  onNext,
  onPrevious,
  canGoNext = false,
  canGoPrevious = false,
}: {
  visible: boolean;
  onClose: () => void;
  character: string | null;
  onComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}) => {
  const [strokeData, setStrokeData] = useState(character ? getStrokeData(character) : null);
  const [completedStrokes, setCompletedStrokes] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const scale = useRef(new Animated.Value(0.35)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideSuccess = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setShowSuccess(false);
    });
  };

  useEffect(() => {
    if (character) {
      setStrokeData(getStrokeData(character));
      setCompletedStrokes(0);
      setShowSuccess(false);
      scale.setValue(0.35);
      opacity.setValue(0);
    }
    return subscribeStrokeStore(() => {
      if (character) setStrokeData(getStrokeData(character));
    });
  }, [character, scale, opacity]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const handleStrokeComplete = (strokeIndex: number) => {
    setCompletedStrokes(strokeIndex + 1);
  };

  const handleAllStrokesComplete = () => {
    onComplete?.();
    setShowSuccess(true);
    scale.setValue(0.35);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hideSuccess, 1800);
  };

  if (!visible || !character) {
    return null;
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View {...{ dir: 'rtl' as const }} style={InteractiveStrokePracticeModalStyles.centeredView}>
        <View style={InteractiveStrokePracticeModalStyles.modalView}>
          <View style={InteractiveStrokePracticeModalStyles.header}>
            <TapButton
              style={SimpleCharacterCardStyles.backButton}
              onPress={onClose}
              accessibilityLabel="חזור"
            >
              <NavChevron direction="left" size={22} />
            </TapButton>
            <Text style={InteractiveStrokePracticeModalStyles.modalTitle}>
              תרגול כתיבה · {character}
            </Text>
            <View style={InteractiveStrokePracticeModalStyles.headerSide} />
          </View>

          <View style={{ flex: 1, width: '100%' }}>
            {strokeData ? (
              <TracingCanvas
                key={character}
                character={character}
                strokeData={strokeData}
                onStrokeComplete={handleStrokeComplete}
                onAllStrokesComplete={handleAllStrokesComplete}
              />
            ) : (
              <View style={InteractiveStrokePracticeModalStyles.noDataContainer}>
                <Text style={InteractiveStrokePracticeModalStyles.noDataText}>
                  אין נתוני כתיבה עבור {character} ({completedStrokes})
                </Text>
              </View>
            )}

            {showSuccess && (
              <TapButton
                feedback={false}
                onPress={hideSuccess}
                style={InteractiveStrokePracticeModalStyles.successOverlay}
              >
                <Animated.View style={{ opacity, transform: [{ scale }] }}>
                  <Svg width={220} height={220} viewBox="0 0 120 120">
                    <Circle cx="60" cy="60" r="56" fill="#27ae60" />
                    <Path
                      d="M34 62 L52 82 L88 40"
                      stroke="#ffffff"
                      strokeWidth={12}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Animated.View>
              </TapButton>
            )}

            <TapButton
              style={[
                InteractiveStrokePracticeModalStyles.navArrow,
                InteractiveStrokePracticeModalStyles.navArrowLeft,
                !canGoNext && InteractiveStrokePracticeModalStyles.navArrowDisabled,
              ]}
              onPress={onNext}
              disabled={!canGoNext}
            >
              <NavChevron direction="right" />
            </TapButton>
            <TapButton
              style={[
                InteractiveStrokePracticeModalStyles.navArrow,
                InteractiveStrokePracticeModalStyles.navArrowRight,
                !canGoPrevious && InteractiveStrokePracticeModalStyles.navArrowDisabled,
              ]}
              onPress={onPrevious}
              disabled={!canGoPrevious}
            >
              <NavChevron direction="left" />
            </TapButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InteractiveStrokePracticeModal;
