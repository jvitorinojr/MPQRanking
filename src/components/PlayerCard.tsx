import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../utils/theme';
import { getPositionLabel, getPositionColor } from '../utils/helpers';

interface Props {
  name: string;
  position: string;
  shirtNumber: number;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  rightContent?: React.ReactNode;
}

export default function PlayerCard({ name, position, shirtNumber, onPress, onEdit, onDelete, rightContent }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.numberBadge, { backgroundColor: getPositionColor(position) }]}>
        <Text style={styles.number}>{shirtNumber}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={[styles.position, { color: getPositionColor(position) }]}>{getPositionLabel(position)}</Text>
      </View>
      {rightContent}
      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="pencil" size={18} color={colors.blue} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fontSize.lg,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  position: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
});
