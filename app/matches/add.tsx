import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { createMatch } from '../../src/database/database';
import { getNextThursday, formatDateFull } from '../../src/utils/helpers';

export default function AddMatchScreen() {
  const router = useRouter();
  const nextThursday = getNextThursday();
  const [date, setDate] = useState(nextThursday);
  const [customDate, setCustomDate] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleSave = async () => {
    const matchDate = useCustom ? customDate : date;
    if (!matchDate || !/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) {
      Alert.alert('Erro', 'Informe uma data válida no formato AAAA-MM-DD');
      return;
    }
    const id = await createMatch(matchDate);
    router.back();
    setTimeout(() => router.push(`/matches/${id}`), 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconRow}>
          <Ionicons name="football" size={64} color={colors.accent} />
        </View>

        <Text style={styles.title}>Nova Partida</Text>
        <Text style={styles.subtitle}>Mais Que Perfeito - Futebol de Quinta</Text>

        <View style={styles.teamsPreview}>
          <View style={[styles.teamBadge, { backgroundColor: colors.blueDark }]}>
            <Text style={styles.teamText}>AZUL</Text>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={[styles.teamBadge, { backgroundColor: colors.orangeDark }]}>
            <Text style={styles.teamText}>LARANJA</Text>
          </View>
        </View>

        {/* Thursday suggestion */}
        <TouchableOpacity
          style={[styles.dateOption, !useCustom && styles.dateOptionActive]}
          onPress={() => setUseCustom(false)}
        >
          <Ionicons name="calendar" size={20} color={!useCustom ? colors.accent : colors.textMuted} />
          <View style={styles.dateInfo}>
            <Text style={[styles.dateLabel, !useCustom && { color: colors.text }]}>
              Próxima Quinta-feira
            </Text>
            <Text style={styles.dateValue}>{formatDateFull(date)}</Text>
          </View>
          {!useCustom && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateOption, useCustom && styles.dateOptionActive]}
          onPress={() => setUseCustom(true)}
        >
          <Ionicons name="create" size={20} color={useCustom ? colors.accent : colors.textMuted} />
          <View style={styles.dateInfo}>
            <Text style={[styles.dateLabel, useCustom && { color: colors.text }]}>
              Outra data
            </Text>
          </View>
          {useCustom && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
        </TouchableOpacity>

        {useCustom && (
          <TextInput
            style={styles.input}
            value={customDate}
            onChangeText={setCustomDate}
            placeholder="AAAA-MM-DD (ex: 2026-04-09)"
            placeholderTextColor={colors.textMuted}
            keyboardType="default"
          />
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Criar Partida</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  iconRow: { alignItems: 'center', marginTop: spacing.lg },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  teamsPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  teamBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  teamText: { color: '#fff', fontWeight: 'bold', fontSize: fontSize.lg },
  vsText: { color: colors.textMuted, fontSize: fontSize.xl, fontWeight: 'bold' },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  dateOptionActive: { borderColor: colors.accent },
  dateInfo: { flex: 1 },
  dateLabel: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  dateValue: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: 'bold' },
});
