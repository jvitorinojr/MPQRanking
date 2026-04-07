import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../utils/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ icon, label, value, color = colors.accent }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
});
