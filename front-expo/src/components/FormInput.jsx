import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';

export default function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  multiline = false,
  keyboardType = 'default',
  editable = true,
  required = false,
  icon = null,
  onIconPress = null,
  isSelect = false,
  selectValue = null,
  selectOptions = []
}) {
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      {!isSelect ? (
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              error && styles.inputError,
              !editable && styles.inputDisabled
            ]}
            placeholder={placeholder}
            placeholderTextColor={isDark ? colors.textSecondary : '#999'}
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            keyboardType={keyboardType}
            editable={editable}
            numberOfLines={multiline ? 4 : 1}
          />
          {icon && (
            <Pressable
              style={styles.iconButton}
              onPress={onIconPress}
              disabled={!onIconPress}
            >
              <Text style={styles.icon}>{icon}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={[styles.input, styles.selectBox]}>
          <Text style={[styles.selectText, !selectValue && styles.selectPlaceholder]}>
            {selectValue || placeholder}
          </Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    required: {
      color: colors.danger || '#e05f5f',
      fontWeight: '700',
    },
    inputWrapper: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
    },
    inputMultiline: {
      paddingVertical: 12,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.danger || '#e05f5f',
      backgroundColor: colors.dangerBg || '#ffe6e6',
    },
    inputDisabled: {
      opacity: 0.6,
      backgroundColor: colors.bgPrimary,
    },
    iconButton: {
      position: 'absolute',
      right: 12,
      padding: 8,
    },
    icon: {
      fontSize: 20,
    },
    selectBox: {
      justifyContent: 'center',
      paddingHorizontal: 12,
      minHeight: 44,
    },
    selectText: {
      fontSize: 14,
      color: colors.textPrimary,
    },
    selectPlaceholder: {
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.danger || '#e05f5f',
      fontSize: 12,
      marginTop: 6,
      fontWeight: '500',
    },
  });
