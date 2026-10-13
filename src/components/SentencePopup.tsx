import React from 'react';
import { View, Text, Modal } from 'react-native';
import TapButton from './TapButton';
import { SentencePopupStyles } from '../styles/AppStyles';
import ttsService from '../services/TTSService';

type SentencePopupData = {
  sentence: string;
  sentenceHebrewTranslation?: string;
};

const SentencePopup = ({
  visible,
  onClose,
  sentence,
}: {
  visible: boolean;
  onClose: () => void;
  sentence: SentencePopupData | null;
}) => {
  if (!sentence) return null;

  const handleSentenceSound = () => {
    if (sentence.sentence) {
      ttsService.speakSentence(sentence.sentence);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View {...{ dir: 'rtl' as const }} style={SentencePopupStyles.centeredView}>
        <View style={SentencePopupStyles.modalView}>
          <TapButton style={SentencePopupStyles.closeButtonTopRight} onPress={onClose}>
            <Text style={SentencePopupStyles.closeButtonText}>✕</Text>
          </TapButton>

          <View style={SentencePopupStyles.content}>
            <View style={SentencePopupStyles.sentenceSection}>
              <Text style={SentencePopupStyles.sentenceText}>{sentence.sentence}</Text>
            </View>
            {!!sentence.sentenceHebrewTranslation &&
              sentence.sentenceHebrewTranslation !== sentence.sentence && (
                <View style={SentencePopupStyles.sentenceSection}>
                  <Text style={SentencePopupStyles.sentenceTranslation}>
                    {sentence.sentenceHebrewTranslation}
                  </Text>
                </View>
              )}
          </View>

          <TapButton
            style={{
              backgroundColor: '#3498db',
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 8,
              marginTop: 15,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleSentenceSound}
          >
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>השמע</Text>
          </TapButton>
        </View>
      </View>
    </Modal>
  );
};

export default SentencePopup;
