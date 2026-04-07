import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { calculateRanking, RankingEntry } from '../../src/database';
import { getPositionLabel, getPositionColor, getMonthRange, getYearRange } from '../../src/utils/helpers';
import EmptyState from '../../src/components/EmptyState';

type FilterType = 'all' | 'month' | 'year';

export default function RankingScreen() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadRanking = useCallback(async () => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (filter === 'month') {
      const range = getMonthRange(now.getFullYear(), now.getMonth() + 1);
      startDate = range.start;
      endDate = range.end;
    } else if (filter === 'year') {
      const range = getYearRange(now.getFullYear());
      startDate = range.start;
      endDate = range.end;
    }

    setRanking(await calculateRanking(startDate, endDate));
  }, [filter]);

  useFocusEffect(useCallback(() => { loadRanking(); }, [loadRanking]));

  const getMedalIcon = (index: number) => {
    if (index === 0) return { color: colors.gold, icon: 'trophy' as const };
    if (index === 1) return { color: colors.silver, icon: 'medal' as const };
    if (index === 2) return { color: colors.bronze, icon: 'medal' as const };
    return null;
  };

  const renderItem = ({ item, index }: { item: RankingEntry; index: number }) => {
    const medal = getMedalIcon(index);

    return (
      <TouchableOpacity
        style={[styles.rankItem, index < 3 && styles.topThree, index === 0 && styles.firstPlace]}
        onPress={() => router.push(`/players/${item.player_id}`)}
      >
        <View style={styles.rankLeft}>
          {medal ? (
            <View style={[styles.medalBadge, { backgroundColor: medal.color }]}>
              <Ionicons name={medal.icon} size={16} color="#000" />
            </View>
          ) : (
            <View style={styles.positionBadge}>
              <Text style={styles.positionNumber}>{index + 1}</Text>
            </View>
          )}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{item.player_name}</Text>
            <View style={styles.playerMeta}>
              <View style={[styles.positionDot, { backgroundColor: getPositionColor(item.player_position) }]} />
              <Text style={styles.playerPosition}>{getPositionLabel(item.player_position)}</Text>
              <Text style={styles.playerShirt}>#{item.player_shirt_number}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rankRight}>
          <Text style={[styles.points, index === 0 && { color: colors.gold }]}>{item.total_points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.total_games}</Text>
            <Text style={styles.statLabel}>Jogos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{item.wins}</Text>
            <Text style={styles.statLabel}>Vit.</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{item.losses}</Text>
            <Text style={styles.statLabel}>Der.</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{item.absences}</Text>
            <Text style={styles.statLabel}>Aus.</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['all', 'month', 'year'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Geral' : f === 'month' ? 'Mês' : 'Ano'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={ranking}
        keyExtractor={(item) => item.player_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={ranking.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="Nenhum dado no ranking"
            subtitle="Finalize partidas para ver o ranking"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: spacing.md, paddingBottom: 20 },
  emptyList: { flex: 1 },
  rankItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topThree: { borderWidth: 1.5 },
  firstPlace: { borderColor: colors.gold },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medalBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionNumber: { color: colors.textSecondary, fontWeight: 'bold', fontSize: fontSize.md },
  playerInfo: { flex: 1, marginLeft: spacing.md },
  playerName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  playerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  positionDot: { width: 8, height: 8, borderRadius: 4 },
  playerPosition: { color: colors.textSecondary, fontSize: fontSize.sm },
  playerShirt: { color: colors.textMuted, fontSize: fontSize.sm },
  rankRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  points: { color: colors.text, fontSize: fontSize.xxl, fontWeight: 'bold' },
  pointsLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: fontSize.md, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
});
