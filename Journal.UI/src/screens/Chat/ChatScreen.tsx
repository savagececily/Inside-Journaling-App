import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import chatService from '../../services/chat/chatService';
import { ChatMessage, ChatSession, CrisisResource } from '../../types/api';

export default function ChatScreen() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSessionDrawer, setShowSessionDrawer] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<{
    reason?: string;
    resources: CrisisResource[];
  } | null>(null);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsFetchingSessions(true);
    try {
      const data = await chatService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setIsFetchingSessions(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setShowSessionDrawer(false);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const session = await chatService.getSession(sessionId);
      setCurrentSession(session);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewSession = () => {
    setCurrentSession(null);
    setInputText('');
    setErrorMessage(null);
    setCrisisAlert(null);
    setShowSessionDrawer(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        handleStartNewSession();
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to delete session');
    }
  };

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: now,
    };

    const previousSession = currentSession;
    const optimisticSession: ChatSession = currentSession
      ? {
          ...currentSession,
          messages: [...currentSession.messages, userMessage],
          lastMessageAt: now,
        }
      : {
          id: 'temp-' + Date.now(),
          userId: '',
          messages: [userMessage],
          createdAt: now,
          lastMessageAt: now,
          title: textToSend.length > 40 ? textToSend.substring(0, 37) + '...' : textToSend,
          isActive: true,
        };

    setCurrentSession(optimisticSession);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({
        message: textToSend,
        sessionId:
          previousSession && !previousSession.id.startsWith('temp-')
            ? previousSession.id
            : undefined,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp || new Date().toISOString(),
      };

      setCurrentSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          id: response.sessionId || prev.id,
          messages: [...prev.messages, assistantMessage],
          lastMessageAt: assistantMessage.timestamp,
        };
      });

      if (response.isCrisisDetected && response.crisisResources) {
        setCrisisAlert({
          reason: response.crisisReason,
          resources: response.crisisResources,
        });
      }

      loadSessions();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to send message. Please try again.');
      setCurrentSession(previousSession);
      setInputText(textToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAssistant,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const messages = currentSession?.messages || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSessionDrawer(!showSessionDrawer)}
          accessibilityLabel="Toggle conversations list"
        >
          <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
          <Text style={styles.headerButtonText}>Conversations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleStartNewSession}
          accessibilityLabel="Start new conversation"
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.newChatButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {showSessionDrawer && (
        <View style={styles.drawerContainer}>
          <Text style={styles.drawerTitle}>Saved Conversations</Text>
          {isFetchingSessions ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.drawerLoading} />
          ) : sessions.length === 0 ? (
            <Text style={styles.emptySessionsText}>No past conversations yet.</Text>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              style={styles.sessionsList}
              renderItem={({ item }) => (
                <View style={styles.sessionItemRow}>
                  <TouchableOpacity
                    style={styles.sessionItemContent}
                    onPress={() => handleSelectSession(item.id)}
                  >
                    <Text
                      style={[
                        styles.sessionItemTitle,
                        currentSession?.id === item.id && styles.activeSessionTitle,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title || 'Conversation'}
                    </Text>
                    <Text style={styles.sessionItemDate}>
                      {new Date(item.lastMessageAt || item.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteSessionButton}
                    onPress={() => handleDeleteSession(item.id)}
                    accessibilityLabel="Delete conversation"
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      {crisisAlert && (
        <View style={styles.crisisBanner}>
          <Text style={styles.crisisBannerTitle}>Support Resources Available</Text>
          <Text style={styles.crisisBannerBody}>
            {crisisAlert.reason || 'Immediate support is available 24/7 if you need assistance.'}
          </Text>
          <View style={styles.crisisButtonsRow}>
            {crisisAlert.resources.slice(0, 2).map((res, index) => (
              <TouchableOpacity
                key={index}
                style={styles.crisisActionButton}
                onPress={() => {
                  if (res.phoneNumber) {
                    Linking.openURL(`tel:${res.phoneNumber}`);
                  } else if (res.url) {
                    Linking.openURL(res.url);
                  }
                }}
              >
                <Text style={styles.crisisActionButtonText}>
                  {res.name} ({res.phoneNumber || 'Visit'})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-circle-outline" size={56} color={colors.primary} />
            <Text style={styles.emptyTitle}>Virtual Support Companion</Text>
            <Text style={styles.emptyDescription}>
              Ask questions about your journaling, explore patterns, or discuss strategies for mental wellness.
            </Text>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.loadingIndicatorContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Companion is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Share your thoughts or ask a question..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={4000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
          accessibilityLabel="Send message"
        >
          <Ionicons
            name="send"
            size={18}
            color={inputText.trim() ? colors.textInverse : colors.textDisabled}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  headerButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  newChatButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textInverse,
    marginLeft: 2,
  },
  drawerContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
    maxHeight: 220,
  },
  drawerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  drawerLoading: {
    marginVertical: spacing.md,
  },
  emptySessionsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  sessionsList: {
    maxHeight: 160,
  },
  sessionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sessionItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionItemTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  activeSessionTitle: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  sessionItemDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  deleteSessionButton: {
    padding: spacing.xs,
  },
  crisisBanner: {
    backgroundColor: '#fff1f2',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    margin: spacing.sm,
    padding: spacing.sm,
  },
  crisisBannerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: 2,
  },
  crisisBannerBody: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  crisisButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  crisisActionButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  crisisActionButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textInverse,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageBubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  messageBubbleAssistant: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  messageTextUser: {
    color: colors.textInverse,
  },
  messageTextAssistant: {
    color: colors.text,
  },
  loadingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    marginBottom: 1,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
