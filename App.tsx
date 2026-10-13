import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, I18nManager } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import LandingPage from './src/components/LandingPage';
import SimplePracticeCard from './src/components/SimplePracticeCard';
import QuizSelectPage from './src/components/QuizSelectPage';
import QuizModePage from './src/components/QuizModePage';
import PracticeSelectPage from './src/components/PracticeSelectPage';
import PracticeModePage from './src/components/PracticeModePage';
import { DatabaseInitializer } from './src/database/DatabaseInitializer';
import { DatabaseHelper } from './src/database/DatabaseHelper';
import { ProgressService } from './src/services/ProgressService';
import ttsService from './src/services/TTSService';
import { CommonStyles } from './src/styles/AppStyles';
import { DeckKind } from './src/types';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type AppView = 'landing' | 'cards' | 'numbers' | 'quizSelect' | 'quiz' | 'practiceSelect' | 'practice';
type QuizType = 'letters' | 'numbers';

const LANDSCAPE_VIEWS: AppView[] = ['practiceSelect', 'practice'];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [quizType, setQuizType] = useState<QuizType>('letters');
  const [practiceDeck, setPracticeDeck] = useState<DeckKind>('letter');
  const [practiceStartPosition, setPracticeStartPosition] = useState(0);
  const [practiceReturnView, setPracticeReturnView] = useState<AppView>('practiceSelect');
  const [progressService] = useState(() => new ProgressService());
  const [databaseHelper, setDatabaseHelper] = useState<DatabaseHelper | null>(null);
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    ttsService.init();

    const initializeDatabase = async () => {
      const dbInit = new DatabaseInitializer(progressService);
      const dbReady = await dbInit.initializeDatabase();
      if (dbReady) {
        setDatabaseHelper(dbInit.getDatabaseHelper());
        setDatabaseReady(true);
      }
    };

    initializeDatabase();
  }, [progressService]);

  useEffect(() => {
    const lock = LANDSCAPE_VIEWS.includes(currentView)
      ? ScreenOrientation.OrientationLock.LANDSCAPE
      : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    ScreenOrientation.lockAsync(lock).catch(() => {});
  }, [currentView]);

  if (!databaseReady || !databaseHelper) {
    return (
      <View style={CommonStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={CommonStyles.loadingText}>טוען את שיר...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {currentView === 'landing' && (
        <LandingPage
          onNavigateToCards={() => setCurrentView('cards')}
          onNavigateToNumbers={() => setCurrentView('numbers')}
          onNavigateToQuiz={() => setCurrentView('quizSelect')}
          onNavigateToPractice={() => setCurrentView('practiceSelect')}
          databaseHelper={databaseHelper}
          progressService={progressService}
        />
      )}
      {currentView === 'cards' && (
        <SimplePracticeCard
          deck="letter"
          onBackToLanding={() => setCurrentView('landing')}
          onNavigateToPractice={(position) => {
            setPracticeDeck('letter');
            setPracticeStartPosition(position);
            setPracticeReturnView('cards');
            setCurrentView('practice');
          }}
          databaseHelper={databaseHelper}
        />
      )}
      {currentView === 'numbers' && (
        <SimplePracticeCard
          deck="number"
          onBackToLanding={() => setCurrentView('landing')}
          onNavigateToPractice={(position) => {
            setPracticeDeck('number');
            setPracticeStartPosition(position);
            setPracticeReturnView('numbers');
            setCurrentView('practice');
          }}
          databaseHelper={databaseHelper}
        />
      )}
      {currentView === 'quizSelect' && (
        <QuizSelectPage
          onBack={() => setCurrentView('landing')}
          onSelectLetters={() => {
            setQuizType('letters');
            setCurrentView('quiz');
          }}
          onSelectNumbers={() => {
            setQuizType('numbers');
            setCurrentView('quiz');
          }}
        />
      )}
      {currentView === 'quiz' && (
        <QuizModePage
          quizType={quizType}
          databaseHelper={databaseHelper}
          progressService={progressService}
          onBack={() => setCurrentView('quizSelect')}
        />
      )}
      {currentView === 'practiceSelect' && (
        <PracticeSelectPage
          onBack={() => setCurrentView('landing')}
          onSelectLetters={() => {
            setPracticeDeck('letter');
            setPracticeStartPosition(0);
            setPracticeReturnView('practiceSelect');
            setCurrentView('practice');
          }}
          onSelectNumbers={() => {
            setPracticeDeck('number');
            setPracticeStartPosition(0);
            setPracticeReturnView('practiceSelect');
            setCurrentView('practice');
          }}
        />
      )}
      {currentView === 'practice' && (
        <PracticeModePage
          deck={practiceDeck}
          initialPosition={practiceStartPosition}
          databaseHelper={databaseHelper}
          onBack={() => {
            setPracticeStartPosition(0);
            setCurrentView(practiceReturnView);
          }}
        />
      )}
    </>
  );
}
