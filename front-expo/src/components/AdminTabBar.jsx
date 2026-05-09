import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';

export default function AdminTabBar({ tabs, activeTab, onTabChange }) {
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.activeTab, { backgroundColor: colors.primary }],
              { borderBottomColor: colors.primary },
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id
                  ? styles.activeTabText
                  : { color: colors.textSecondary },
              ]}
            >
              {tab.icon && <Text style={styles.tabIcon}>{tab.icon} </Text>}
              {tab.label}
              {tab.badge > 0 && (
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: colors.danger },
                  ]}
                >
                  {' ' + tab.badge}
                </Text>
              )}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    content: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      backgroundColor: colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: '#fff',
    },
    tabIcon: {
      fontSize: 14,
      marginRight: 4,
    },
    badge: {
      marginLeft: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
      overflow: 'hidden',
    },
  });
