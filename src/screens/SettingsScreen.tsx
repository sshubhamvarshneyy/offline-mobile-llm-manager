import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '../components';
import { COLORS } from '../constants';
import { useAppStore, useChatStore, useAuthStore } from '../stores';
import { modelManager, llmService, authService } from '../services';
import { PassphraseSetupScreen } from './PassphraseSetupScreen';
import { SettingsStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [showPassphraseSetup, setShowPassphraseSetup] = useState(false);
  const [isChangingPassphrase, setIsChangingPassphrase] = useState(false);

  const {
    settings: rawSettings,
    updateSettings,
    downloadedModels,
    setOnboardingComplete,
  } = useAppStore();

  const {
    isEnabled: authEnabled,
    setEnabled: setAuthEnabled,
  } = useAuthStore();

  const settings = {
    systemPrompt: rawSettings?.systemPrompt ?? 'You are a helpful AI assistant.',
  };

  const { clearAllConversations } = useChatStore();

  const handleClearConversations = () => {
    Alert.alert(
      'Clear All Conversations',
      'This will delete all your chat history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearAllConversations();
            Alert.alert('Done', 'All conversations have been cleared.');
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all data including downloaded models, conversations, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await llmService.unloadModel();
              for (const model of downloadedModels) {
                await modelManager.deleteModel(model.id).catch(() => {});
              }
              clearAllConversations();
              setOnboardingComplete(false);
              await authService.removePassphrase();
              setAuthEnabled(false);
              Alert.alert('App Reset', 'Please restart the app to complete the reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePassphrase = async () => {
    if (authEnabled) {
      Alert.alert(
        'Disable Passphrase Lock',
        'Are you sure you want to disable passphrase protection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await authService.removePassphrase();
              setAuthEnabled(false);
            },
          },
        ]
      );
    } else {
      setIsChangingPassphrase(false);
      setShowPassphraseSetup(true);
    }
  };

  const handleChangePassphrase = () => {
    setIsChangingPassphrase(true);
    setShowPassphraseSetup(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Navigation Items */}
        <View style={styles.navSection}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('ModelSettings')}
          >
            <View style={[styles.navItemIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Icon name="sliders" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.navItemContent}>
              <Text style={styles.navItemTitle}>Model Settings</Text>
              <Text style={styles.navItemDesc}>Generation, performance, and image settings</Text>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('VoiceSettings')}
          >
            <View style={[styles.navItemIcon, { backgroundColor: COLORS.secondary + '20' }]}>
              <Icon name="mic" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.navItemContent}>
              <Text style={styles.navItemTitle}>Voice Transcription</Text>
              <Text style={styles.navItemDesc}>On-device speech to text</Text>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('DeviceInfo')}
          >
            <View style={[styles.navItemIcon, { backgroundColor: '#3B82F620' }]}>
              <Icon name="smartphone" size={20} color="#3B82F6" />
            </View>
            <View style={styles.navItemContent}>
              <Text style={styles.navItemTitle}>Device Information</Text>
              <Text style={styles.navItemDesc}>Hardware and compatibility</Text>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, styles.navItemLast]}
            onPress={() => navigation.navigate('StorageSettings')}
          >
            <View style={[styles.navItemIcon, { backgroundColor: '#F5972020' }]}>
              <Icon name="hard-drive" size={20} color="#F59720" />
            </View>
            <View style={styles.navItemContent}>
              <Text style={styles.navItemTitle}>Storage</Text>
              <Text style={styles.navItemDesc}>Models and data usage</Text>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.securityRow}>
            <View style={styles.securityInfo}>
              <Text style={styles.securityLabel}>Passphrase Lock</Text>
              <Text style={styles.securityHint}>Require passphrase to open app</Text>
            </View>
            <Switch
              value={authEnabled}
              onValueChange={handleTogglePassphrase}
              trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '80' }}
              thumbColor={authEnabled ? COLORS.primary : COLORS.textMuted}
            />
          </View>
          {authEnabled && (
            <TouchableOpacity
              style={styles.changePassphraseButton}
              onPress={handleChangePassphrase}
            >
              <Text style={styles.changePassphraseText}>Change Passphrase</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Default System Prompt */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Default System Prompt</Text>
          <Text style={styles.settingHelp}>
            Used when chatting without a project selected.
          </Text>
          <TextInput
            style={styles.textArea}
            value={settings.systemPrompt}
            onChangeText={(text) => updateSettings({ systemPrompt: text })}
            multiline
            numberOfLines={4}
            placeholder="Enter system prompt..."
            placeholderTextColor={COLORS.textMuted}
          />
        </Card>

        {/* Privacy */}
        <Card style={styles.privacyCard}>
          <View style={styles.privacyIconContainer}>
            <Icon name="lock" size={24} color={COLORS.secondary} />
          </View>
          <Text style={styles.privacyTitle}>Privacy First</Text>
          <Text style={styles.privacyText}>
            All your data stays on this device. No conversations, prompts, or
            personal information is ever sent to any server.
          </Text>
        </Card>

        {/* Data Management */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Button
            title="Clear All Conversations"
            variant="outline"
            onPress={handleClearConversations}
            style={styles.dangerButton}
          />
          <Button
            title="Reset App"
            variant="outline"
            onPress={handleResetApp}
            style={{ ...styles.dangerButton, marginBottom: 0 }}
          />
        </Card>

        {/* About */}
        <Card style={styles.section}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <Text style={styles.aboutText}>
            Local LLM brings AI to your device without compromising your privacy.
          </Text>
        </Card>
      </ScrollView>

      <Modal
        visible={showPassphraseSetup}
        animationType="slide"
        onRequestClose={() => setShowPassphraseSetup(false)}
      >
        <PassphraseSetupScreen
          isChanging={isChangingPassphrase}
          onComplete={() => setShowPassphraseSetup(false)}
          onCancel={() => setShowPassphraseSetup(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
  },
  navSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navItemLast: {
    borderBottomWidth: 0,
  },
  navItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navItemContent: {
    flex: 1,
  },
  navItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  navItemDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  securityInfo: {
    flex: 1,
  },
  securityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  securityHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  changePassphraseButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  changePassphraseText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  settingHelp: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  privacyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.secondary + '15',
    borderWidth: 1,
    borderColor: COLORS.secondary + '40',
    marginBottom: 16,
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
  dangerButton: {
    borderColor: COLORS.error,
    marginBottom: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  aboutText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
