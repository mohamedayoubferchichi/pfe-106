import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';

export default function ScreenScaffold({ title, subtitle, children }) {
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const dynamicStyles = makeStyles(colors);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['bottom', 'left', 'right']}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.bgPrimary }]} contentContainerStyle={styles.content}>
        <View style={[dynamicStyles.hero, isDark && { backgroundColor: colors.secondary }]}>
          <Text style={[styles.kicker, { color: colors.primary }]}>AssurGo</Text>
          <Text style={[styles.title, { color: colors.white }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>

        <View style={[dynamicStyles.panel, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>{children}</View>
        
        {/* Footer info (Mirroring Web) */}
        <View style={styles.footerInfo}>
           <Text style={[styles.footerCopyright, { color: colors.textSecondary }]}>© 2026 AssurGo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f3f6',
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  footerInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 12,
    opacity: 0.6,
  }
});

const makeStyles = (colors) =>
  StyleSheet.create({
    hero: {
      borderRadius: 24,
      backgroundColor: colors.secondary,
      paddingVertical: 32,
      paddingHorizontal: 24,
      ...SHADOWS.md,
    },
    panel: {
      backgroundColor: colors.bgSecondary,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 16,
      ...SHADOWS.md,
    },
  });
