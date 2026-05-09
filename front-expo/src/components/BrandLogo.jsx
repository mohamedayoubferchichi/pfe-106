import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../styles/theme';

export default function BrandLogo({ compact = false }) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.shield}>
        <View style={styles.checkLine1} />
        <View style={styles.checkLine2} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.text, compact && styles.textCompact]}>
          Assur<Text style={{ color: COLORS.primary }}>Go</Text>
        </Text>
        {!compact && (
          <Text style={styles.tagline}>Simple • Rapide • Fiable</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  wrapCompact: {
    gap: 8
  },
  shield: {
    width: 40,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  checkLine1: {
    position: 'absolute',
    width: 10,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }, { translateX: -4 }, { translateY: 6 }],
  },
  checkLine2: {
    position: 'absolute',
    width: 20,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }, { translateX: 6 }, { translateY: -2 }],
  },
  textWrap: {
    flexDirection: 'column',
  },
  text: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  textCompact: {
    fontSize: 20,
  },
  tagline: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  }
});