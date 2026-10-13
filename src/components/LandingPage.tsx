import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import TapButton from './TapButton';
import { CommonStyles, LandingPageStyles } from '../styles/AppStyles';
import { DatabaseHelper } from '../database/DatabaseHelper';
import { ProgressService } from '../services/ProgressService';
import PieChart from './PieChart';

type LandingPageProps = {
  onNavigateToCards: () => void;
  onNavigateToNumbers: () => void;
  onNavigateToQuiz: () => void;
  onNavigateToPractice: () => void;
  databaseHelper: DatabaseHelper;
  progressService: ProgressService;
};

const LandingPage = ({
  onNavigateToCards,
  onNavigateToNumbers,
  onNavigateToQuiz,
  onNavigateToPractice,
  databaseHelper,
  progressService,
}: LandingPageProps) => {
  const [lettersProgress, setLettersProgress] = useState({ viewed: 0, total: 0, percentage: 0 });
  const [numbersProgress, setNumbersProgress] = useState({ viewed: 0, total: 0, percentage: 0 });

  const calculateProgress = () => {
    const letterTotal = databaseHelper.getCharacterCount('letter');
    const numberTotal = databaseHelper.getCharacterCount('number');
    const letterSummary = progressService.getProgressSummary('letter', letterTotal);
    const numberSummary = progressService.getProgressSummary('number', numberTotal);
    setLettersProgress({
      viewed: letterSummary.completedCharacters,
      total: letterTotal,
      percentage: letterSummary.completionPercentage,
    });
    setNumbersProgress({
      viewed: numberSummary.completedCharacters,
      total: numberTotal,
      percentage: numberSummary.completionPercentage,
    });
  };

  useEffect(() => {
    calculateProgress();
    return progressService.subscribe(calculateProgress);
  }, [databaseHelper, progressService]);

  return (
    <View style={CommonStyles.container}>
      <View style={LandingPageStyles.header}>
        <Text style={LandingPageStyles.appSubtitle}>האותיות והמספרים של שיר</Text>
      </View>

      <ScrollView contentContainerStyle={LandingPageStyles.featuresContainer}>
        <TapButton style={LandingPageStyles.featureCard} onPress={onNavigateToCards}>
          <View style={LandingPageStyles.featureCardContent}>
            <View style={LandingPageStyles.featureLeft}>
              <View style={LandingPageStyles.featureContent}>
                <Text style={LandingPageStyles.featureTitle}>א,ב,ג...</Text>
              </View>
            </View>
            <View style={LandingPageStyles.pieChartContainer}>
              <PieChart percentage={lettersProgress.percentage} size={72} strokeWidth={7} />
            </View>
          </View>
        </TapButton>

        <TapButton style={LandingPageStyles.featureCard} onPress={onNavigateToNumbers}>
          <View style={LandingPageStyles.featureCardContent}>
            <View style={LandingPageStyles.featureLeft}>
              <View style={LandingPageStyles.featureContent}>
                <Text style={LandingPageStyles.featureTitle}>{'\u200F'}1,2,3...</Text>
              </View>
            </View>
            <View style={LandingPageStyles.pieChartContainer}>
              <PieChart percentage={numbersProgress.percentage} size={72} strokeWidth={7} />
            </View>
          </View>
        </TapButton>

        <TapButton style={LandingPageStyles.featureCard} onPress={onNavigateToQuiz}>
          <View style={LandingPageStyles.featureCardContent}>
            <View style={LandingPageStyles.featureLeft}>
              <View style={LandingPageStyles.featureContent}>
                <Text style={LandingPageStyles.featureTitle}>חידון</Text>
              </View>
            </View>
            <View style={LandingPageStyles.pieChartContainer}>
              <Text style={LandingPageStyles.quizMark}>❓</Text>
            </View>
          </View>
        </TapButton>

        <TapButton style={LandingPageStyles.featureCard} onPress={onNavigateToPractice}>
          <View style={LandingPageStyles.featureCardContent}>
            <View style={LandingPageStyles.featureLeft}>
              <View style={LandingPageStyles.featureContent}>
                <Text style={LandingPageStyles.featureTitle}>תרגול</Text>
              </View>
            </View>
            <View style={LandingPageStyles.pieChartContainer}>
              <Text style={LandingPageStyles.quizMark}>✏️</Text>
            </View>
          </View>
        </TapButton>
      </ScrollView>
      <View style={LandingPageStyles.creditWrap}>
        <Text style={LandingPageStyles.credit}>by Dana Hen  danahen1987@gmail.com</Text>
      </View>
    </View>
  );
};

export default LandingPage;
