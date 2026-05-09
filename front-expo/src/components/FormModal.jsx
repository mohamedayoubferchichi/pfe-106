import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';

export default function FormModal({
  visible,
  title,
  onClose,
  onSubmit,
  isLoading = false,
  submitText = 'Enregistrer',
  children,
}) {
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <View style={[styles.header, { backgroundColor: colors.bgSecondary }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Pressable onPress={onClose} disabled={isLoading}>
            <Text style={[styles.closeBtn, { color: colors.primary }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.bgSecondary, borderTopColor: colors.border }]}>
          <Pressable
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>
              Annuler
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              isLoading && styles.submitBtnDisabled,
            ]}
            onPress={onSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitBtnText}>
              {isLoading ? 'Traitement...' : submitText}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgSecondary,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeBtn: {
      fontSize: 28,
      fontWeight: '300',
      color: colors.primary,
    },
    body: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    bodyContent: {
      padding: 20,
      gap: 0,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgSecondary,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    submitBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
  });
