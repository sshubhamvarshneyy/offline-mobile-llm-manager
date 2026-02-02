import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Button, Card, ModelCard } from '../components';
import { COLORS } from '../constants';
import { useAppStore, useChatStore } from '../stores';
import { modelManager, llmService, hardwareService, onnxImageGeneratorService } from '../services';
import { DownloadedModel, Conversation, ONNXImageModel } from '../types';
import { MainTabParamList, ChatsStackParamList } from '../navigation/types';
import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type MainTabParamListWithNested = {
  HomeTab: undefined;
  ChatsTab: NavigatorScreenParams<ChatsStackParamList>;
  ProjectsTab: undefined;
  ModelsTab: undefined;
  SettingsTab: undefined;
};

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamListWithNested, 'HomeTab'>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

type ModelTab = 'text' | 'image';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [activeTab, setActiveTab] = useState<ModelTab>('text');

  const {
    downloadedModels,
    setDownloadedModels,
    activeModelId,
    setActiveModelId,
    downloadedImageModels,
    activeImageModelId,
    setActiveImageModelId,
    deviceInfo,
    setDeviceInfo,
  } = useAppStore();

  const { conversations, createConversation, setActiveConversation, deleteConversation } = useChatStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!deviceInfo) {
      const info = await hardwareService.getDeviceInfo();
      setDeviceInfo(info);
    }
    const models = await modelManager.getDownloadedModels();
    setDownloadedModels(models);
  };

  const handleSelectTextModel = async (model: DownloadedModel) => {
    if (activeModelId === model.id) {
      startNewChat(model.id);
      return;
    }

    setIsLoadingModel(true);
    try {
      await llmService.loadModel(model.filePath);
      setActiveModelId(model.id);
      Alert.alert('Model Loaded', `${model.name} is ready to use!`);
    } catch (error) {
      Alert.alert('Error', `Failed to load model: ${(error as Error).message}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const handleSelectImageModel = async (model: ONNXImageModel) => {
    if (activeImageModelId === model.id) {
      return;
    }

    setIsLoadingModel(true);
    try {
      await onnxImageGeneratorService.loadModel(model.modelPath);
      setActiveImageModelId(model.id);
      Alert.alert('Model Loaded', `${model.name} is ready for image generation!`);
    } catch (error) {
      Alert.alert('Error', `Failed to load model: ${(error as Error).message}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const handleDeleteTextModel = async (model: DownloadedModel) => {
    Alert.alert(
      'Delete Model',
      `Delete ${model.name}? This will free up ${hardwareService.formatBytes(model.fileSize)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeModelId === model.id) {
                await llmService.unloadModel();
                setActiveModelId(null);
              }
              await modelManager.deleteModel(model.id);
              const models = await modelManager.getDownloadedModels();
              setDownloadedModels(models);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete model.');
            }
          },
        },
      ]
    );
  };

  const startNewChat = (modelId: string) => {
    const conversationId = createConversation(modelId);
    setActiveConversation(conversationId);
    navigation.navigate('ChatsTab', { screen: 'Chat', params: { conversationId } });
  };

  const continueChat = (conversationId: string) => {
    setActiveConversation(conversationId);
    navigation.navigate('ChatsTab', { screen: 'Chat', params: { conversationId } });
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    Alert.alert(
      'Delete Conversation',
      `Delete "${conversation.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(conversation.id),
        },
      ]
    );
  };

  const renderRightActions = (conversation: Conversation) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDeleteConversation(conversation)}
    >
      <Icon name="trash-2" size={18} color={COLORS.text} />
    </TouchableOpacity>
  );

  const activeTextModel = downloadedModels.find((m) => m.id === activeModelId);
  const activeImageModel = downloadedImageModels.find((m) => m.id === activeImageModelId);
  const recentConversations = conversations.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Local LLM</Text>
          <Text style={styles.subtitle}>Private AI on your device</Text>
        </View>

        {/* Model Type Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'text' && styles.tabActive]}
            onPress={() => setActiveTab('text')}
          >
            <Icon
              name="message-square"
              size={16}
              color={activeTab === 'text' ? COLORS.text : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'text' && styles.tabTextActive]}>
              Text Models
            </Text>
            {downloadedModels.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{downloadedModels.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'image' && styles.tabActive]}
            onPress={() => setActiveTab('image')}
          >
            <Icon
              name="image"
              size={16}
              color={activeTab === 'image' ? COLORS.text : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'image' && styles.tabTextActive]}>
              Image Models
            </Text>
            {downloadedImageModels.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{downloadedImageModels.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Text Models Tab Content */}
        {activeTab === 'text' && (
          <>
            {/* Active Text Model */}
            {activeTextModel ? (
              <Card style={styles.activeModelCard}>
                <View style={styles.activeModelHeader}>
                  <View style={styles.activeIndicator} />
                  <Text style={styles.activeLabel}>Active</Text>
                </View>
                <View style={styles.activeModelInfo}>
                  <View style={styles.activeModelTextContainer}>
                    <Text style={styles.activeModelName} numberOfLines={1}>
                      {activeTextModel.name}
                    </Text>
                    <Text style={styles.activeModelDetails}>
                      {activeTextModel.quantization} · {hardwareService.formatBytes(activeTextModel.fileSize)}
                    </Text>
                  </View>
                  <Button
                    title="Chat"
                    size="small"
                    onPress={() => startNewChat(activeTextModel.id)}
                    loading={isLoadingModel}
                  />
                </View>
              </Card>
            ) : (
              <Card style={styles.noModelCard}>
                <Icon name="cpu" size={24} color={COLORS.textMuted} />
                <Text style={styles.noModelText}>No text model selected</Text>
                <Button
                  title="Browse Models"
                  variant="outline"
                  size="small"
                  onPress={() => navigation.navigate('ModelsTab')}
                />
              </Card>
            )}

            {/* Downloaded Text Models */}
            {downloadedModels.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Downloaded</Text>
                  <Button
                    title="Browse"
                    variant="ghost"
                    size="small"
                    onPress={() => navigation.navigate('ModelsTab')}
                  />
                </View>
                {downloadedModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={{
                      id: model.id,
                      name: model.name,
                      author: model.author,
                      credibility: model.credibility,
                    }}
                    downloadedModel={model}
                    isDownloaded
                    isActive={activeModelId === model.id}
                    onSelect={() => handleSelectTextModel(model)}
                    onDelete={() => handleDeleteTextModel(model)}
                  />
                ))}
              </View>
            )}

            {downloadedModels.length === 0 && (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Text Models</Text>
                <Text style={styles.emptyText}>
                  Download a model to start chatting privately on your device.
                </Text>
                <Button
                  title="Download a Model"
                  onPress={() => navigation.navigate('ModelsTab')}
                />
              </Card>
            )}
          </>
        )}

        {/* Image Models Tab Content */}
        {activeTab === 'image' && (
          <>
            {/* Active Image Model */}
            {activeImageModel ? (
              <Card style={styles.activeModelCard}>
                <View style={styles.activeModelHeader}>
                  <View style={styles.activeIndicator} />
                  <Text style={styles.activeLabel}>Active</Text>
                </View>
                <View style={styles.activeModelInfo}>
                  <View style={styles.activeModelTextContainer}>
                    <Text style={styles.activeModelName} numberOfLines={1}>
                      {activeImageModel.name}
                    </Text>
                    <Text style={styles.activeModelDetails}>
                      {activeImageModel.style || 'Image Generation'} · {hardwareService.formatBytes(activeImageModel.size)}
                    </Text>
                  </View>
                </View>
              </Card>
            ) : (
              <Card style={styles.noModelCard}>
                <Icon name="image" size={24} color={COLORS.textMuted} />
                <Text style={styles.noModelText}>No image model selected</Text>
                <Button
                  title="Browse Models"
                  variant="outline"
                  size="small"
                  onPress={() => navigation.navigate('ModelsTab')}
                />
              </Card>
            )}

            {/* Downloaded Image Models */}
            {downloadedImageModels.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Downloaded</Text>
                  <Button
                    title="Browse"
                    variant="ghost"
                    size="small"
                    onPress={() => navigation.navigate('ModelsTab')}
                  />
                </View>
                {downloadedImageModels.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.imageModelItem,
                      activeImageModelId === model.id && styles.imageModelItemActive,
                    ]}
                    onPress={() => handleSelectImageModel(model)}
                  >
                    <View style={styles.imageModelIcon}>
                      <Icon name="image" size={20} color={COLORS.textSecondary} />
                    </View>
                    <View style={styles.imageModelInfo}>
                      <Text style={styles.imageModelName}>{model.name}</Text>
                      <Text style={styles.imageModelMeta}>
                        {model.style || 'Image'} · {hardwareService.formatBytes(model.size)}
                      </Text>
                    </View>
                    {activeImageModelId === model.id && (
                      <Icon name="check" size={18} color={COLORS.textSecondary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {downloadedImageModels.length === 0 && (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Image Models</Text>
                <Text style={styles.emptyText}>
                  Download an image model to generate images on your device.
                </Text>
                <Button
                  title="Download a Model"
                  onPress={() => navigation.navigate('ModelsTab')}
                />
              </Card>
            )}
          </>
        )}

        {/* Recent Conversations - only show on text tab */}
        {activeTab === 'text' && recentConversations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Chats</Text>
            {recentConversations.map((conv) => (
              <Swipeable
                key={conv.id}
                renderRightActions={() => renderRightActions(conv)}
                overshootRight={false}
              >
                <TouchableOpacity
                  style={styles.conversationItem}
                  onPress={() => continueChat(conv.id)}
                >
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationTitle} numberOfLines={1}>
                      {conv.title}
                    </Text>
                    <Text style={styles.conversationMeta}>
                      {conv.messages.length} messages · {formatDate(conv.updatedAt)}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </Swipeable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  tabBadge: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeModelCard: {
    marginBottom: 16,
  },
  activeModelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeModelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  activeModelTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  activeModelName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeModelDetails: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  noModelCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
    gap: 12,
  },
  noModelText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  imageModelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  imageModelItemActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  imageModelIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  imageModelInfo: {
    flex: 1,
  },
  imageModelName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  imageModelMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  conversationMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 10,
    marginBottom: 6,
    marginLeft: 8,
  },
});
