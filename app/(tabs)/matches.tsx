import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { getMatches, deleteMatch, Match } from '../../src/database/database';
import { formatDateFull } from '../../src/utils/helpers';
import EmptyState from '../../src/components/EmptyState';

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);

  const loadMatches = useCallback(async () => {
    setMatches(await getMatches());
  }, []);

  useFocusEffect(useCallback(() => { loadMatches(); }, [loadMatches]));

  const handleDelete = (match: Match) => {
    Alert.alert('Excluir Partida', 'Deseja excluir esta partida?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteMatch(match.id);
          loadMatches();
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    return status === 'finished' ? colors.success : colors.warning;
  };

  const getStatusLabel = (status: string) => {
    return status === 'finished' ? 'Finalizada' : 'Agendada';
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/matches/${item.id}`)}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.matchDate}>{formatDateFull(item.date)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.teamSide}>
          <View style={[styles.teamColorBar, { backgroundColor: colors.blue }]} />
          <Text style={styles.teamLabel}>Azul</Text>
        </View>
        <View style={styles.scoreCenter}>
          {item.status === 'finished' ? (
            <Text style={styles.scoreText}>{item.blue_score} x {item.orange_score}</Text>
          ) : (
            <Text style={styles.pendingScore}>- x -</Text>
          )}
        </View>
        <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
          <View style={[styles.teamColorBar, { backgroundColor: colors.orange }]} />
          <Text style={styles.teamLabel}>Laranja</Text>
        </View>
      </View>

      <View style={styles.matchActions}>
        <TouchableOpacity
          style={styles.matchAction}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Partidas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/matches/add')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMatch}
        contentContainerStyle={matches.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="football-outline"
            title="Nenhuma partida registrada"
            subtitle="Toque no + para criar uma nova partida"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: colors.accent,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: 20 },
  emptyList: { flex: 1 },
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  matchDate: { color: colors.textSecondary, fontSize: fontSize.md },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: fontSize.sm, fontWeight: '600' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: { flex: 1 },
  teamColorBar: { width: 40, height: 4, borderRadius: 2, marginBottom: 4 },
  teamLabel: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  scoreCenter: { paddingHorizontal: spacing.md },
  scoreText: { color: colors.text, fontSize: fontSize.xxl, fontWeight: 'bold' },
  pendingScore: { color: colors.textMuted, fontSize: fontSize.xxl, fontWeight: 'bold' },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchAction: { padding: spacing.xs },
});
