import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components';
import { COLORS } from '../constants';
import { useAuthStore } from '../stores';
import { authService } from '../services';
import { PassphraseSetupScreen } from './PassphraseSetupScreen';

export const SecuritySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showPassphraseSetup, setShowPassphraseSetup] = useState(false);
  const [isChangingPassphrase, setIsChangingPassphrase] = useState(false);

  const {
    isEnabled: authEnabled,
    setEnabled: setAuthEnabled,
  } = useAuthStore();

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>App Lock</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Passphrase Lock</Text>
              <Text style={styles.settingHint}>Require passphrase to open app</Text>
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
              style={styles.changeButton}
              onPress={handleChangePassphrase}
            >
              <Icon name="edit-2" size={16} color={COLORS.primary} />
              <Text style={styles.changeButtonText}>Change Passphrase</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card style={styles.infoCard}>
          <Icon name="info" size={18} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            When enabled, the app will lock automatically when you switch away or close it. Your passphrase is stored securely on device and never transmitted.
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  changeButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
