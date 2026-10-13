import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import TapButton from './TapButton';
import { CommonStyles, LandingPageStyles, PracticeModeStyles, QuizModeStyles } from '../styles/AppStyles';

const PracticeSelectPage = ({
  onBack,
  onSelectLetters,
  onSelectNumbers,
}: {
  onBack: () => void;
  onSelectLetters: () => void;
  onSelectNumbers: () => void;
}) => {
  return (
    <View style={CommonStyles.container}>
      <View style={PracticeModeStyles.selectTitleWrap}>
        <Text style={LandingPageStyles.appSubtitle}>תרגול</Text>
      </View>

      <ScrollView contentContainerStyle={LandingPageStyles.featuresContainer}>
        <TapButton style={LandingPageStyles.featureCard} onPress={onSelectLetters}>
          <View style={LandingPageStyles.featureCardContent}>
            <View style={LandingPageStyles.featureLeft}>
              <View style={LandingPageStyles.featureContent}>
                <Text style={LandingPageStyles.featureTitle}>אותיות</Text>
              </View>
            </View>
          </View>
        </TapButton>

        <TapButton style={LandingPageStyles.featureCard} onPress={onSelectNumbers}>
          <View style={LandingPageStyles.featureCardContent}>
            <View style={LandingPageStyles.featureLeft}>
              <View style={LandingPageStyles.featureContent}>
                <Text style={LandingPageStyles.featureTitle}>מספרים</Text>
              </View>
            </View>
          </View>
        </TapButton>

        <TapButton style={QuizModeStyles.selectBackButton} onPress={onBack}>
          <Text style={QuizModeStyles.selectBackText}>חזור</Text>
        </TapButton>
      </ScrollView>
    </View>
  );
};

export default PracticeSelectPage;
