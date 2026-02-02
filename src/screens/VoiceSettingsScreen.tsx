import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components';
import { COLORS } from '../constants';
import { useWhisperStore } from '../stores';
import { WHISPER_MODELS } from '../services';

export const VoiceSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    downloadedModelId: whisperModelId,
    isDownloading: isWhisperDownloading,
    downloadProgress: whisperProgress,
    downloadModel: downloadWhisperModel,
    deleteModel: deleteWhisperModel,
    error: whisperError,
    clearError: clearWhisperError,
  } = useWhisperStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Voice Transcription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.description}>
            Download a Whisper model to enable on-device voice input. All transcription happens locally - no data is sent to any server.
          </Text>

          {whisperModelId ? (
            <View style={styles.modelInfo}>
              <View style={styles.modelHeader}>
                <Text style={styles.modelName}>
                  {WHISPER_MODELS.find(m => m.id === whisperModelId)?.name || whisperModelId}
                </Text>
                <Text style={styles.modelStatus}>Downloaded</Text>
              </View>
              <Button
                title="Remove Model"
                variant="outline"
                size="small"
                onPress={() => {
                  Alert.alert(
                    'Remove Whisper Model',
                    'This will disable voice input until you download a model again.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: deleteWhisperModel },
                    ]
                  );
                }}
                style={styles.removeButton}
              />
            </View>
          ) : isWhisperDownloading ? (
            <View style={styles.downloading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.downloadingText}>
                Downloading... {Math.round(whisperProgress * 100)}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${whisperProgress * 100}%` }]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.modelList}>
              <Text style={styles.selectLabel}>Select a model to download:</Text>
              {WHISPER_MODELS.slice(0, 3).map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={styles.modelOption}
                  onPress={() => downloadWhisperModel(model.id)}
                >
                  <View style={styles.modelOptionInfo}>
                    <Text style={styles.modelOptionName}>{model.name}</Text>
                    <Text style={styles.modelOptionSize}>{model.size} MB</Text>
                  </View>
                  <Text style={styles.modelOptionDesc}>{model.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {whisperError && (
            <TouchableOpacity onPress={clearWhisperError}>
              <Text style={styles.error}>{whisperError}</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card style={styles.privacyCard}>
          <View style={styles.privacyIconContainer}>
            <Icon name="mic" size={24} color={COLORS.secondary} />
          </View>
          <Text style={styles.privacyTitle}>Privacy First</Text>
          <Text style={styles.privacyText}>
            Voice transcription happens entirely on your device. Your audio is never sent to any server or stored anywhere.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  modelInfo: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modelStatus: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeButton: {
    borderColor: COLORS.error,
  },
  downloading: {
    alignItems: 'center',
    padding: 16,
  },
  downloadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  modelList: {
    gap: 8,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  modelOption: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modelOptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modelOptionSize: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  modelOptionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  error: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 12,
    textAlign: 'center',
  },
  privacyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.secondary + '15',
    borderWidth: 1,
    borderColor: COLORS.secondary + '40',
  },
  privacyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
