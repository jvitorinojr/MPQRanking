import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { calculateRanking, getGeneralStats, getMatches, RankingEntry, GeneralStats, Match } from '../../src/database';
import StatCard from '../../src/components/StatCard';

export default function HomeScreen() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [r, s, m] = await Promise.all([
      calculateRanking(),
      getGeneralStats(),
      getMatches(),
    ]);
    setRanking(r.slice(0, 5));
    setStats(s);
    const scheduled = m.find(match => match.status === 'scheduled');
    setNextMatch(scheduled || null);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return colors.gold;
    if (index === 1) return colors.silver;
    if (index === 2) return colors.bronze;
    return colors.textMuted;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.teamName}>Mais Que Perfeito</Text>
        <Text style={styles.subtitle}>Ranking de Jogadores</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <StatCard icon="people" label="Jogadores" value={stats.total_players} color={colors.blue} />
          <StatCard icon="football" label="Partidas" value={stats.total_finished} color={colors.orange} />
          <StatCard icon="trophy" label="Jogos" value={stats.total_matches} color={colors.accent} />
        </View>
      )}

      {/* Match Stats */}
      {stats && stats.total_finished > 0 && (
        <View style={styles.matchStatsCard}>
          <Text style={styles.sectionTitle}>Estatísticas Gerais</Text>
          <View style={styles.matchStatsRow}>
            <View style={styles.matchStatItem}>
              <View style={[styles.teamDot, { backgroundColor: colors.blue }]} />
              <Text style={styles.matchStatLabel}>Azul</Text>
              <Text style={styles.matchStatValue}>{stats.blue_wins} vitórias</Text>
            </View>
            <View style={styles.matchStatItem}>
              <View style={[styles.teamDot, { backgroundColor: colors.textMuted }]} />
              <Text style={styles.matchStatLabel}>Empates</Text>
              <Text style={styles.matchStatValue}>{stats.draws}</Text>
            </View>
            <View style={styles.matchStatItem}>
              <View style={[styles.teamDot, { backgroundColor: colors.orange }]} />
              <Text style={styles.matchStatLabel}>Laranja</Text>
              <Text style={styles.matchStatValue}>{stats.orange_wins} vitórias</Text>
            </View>
          </View>
          <Text style={styles.avgGoals}>
            Média de gols: {Number(stats.avg_blue_goals).toFixed(1)} x {Number(stats.avg_orange_goals).toFixed(1)}
          </Text>
        </View>
      )}

      {/* Next Match */}
      {nextMatch && (
        <TouchableOpacity
          style={styles.nextMatchCard}
          onPress={() => router.push(`/matches/${nextMatch.id}`)}
        >
          <View style={styles.nextMatchHeader}>
            <Ionicons name="calendar" size={20} color={colors.accent} />
            <Text style={styles.nextMatchTitle}>Próxima Partida</Text>
          </View>
          <Text style={styles.nextMatchDate}>
            {new Date(nextMatch.date + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </Text>
          <View style={styles.teamsPreview}>
            <View style={[styles.teamBadge, { backgroundColor: colors.blueDark }]}>
              <Text style={styles.teamBadgeText}>AZUL</Text>
            </View>
            <Text style={styles.vsText}>vs</Text>
            <View style={[styles.teamBadge, { backgroundColor: colors.orangeDark }]}>
              <Text style={styles.teamBadgeText}>LARANJA</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Top 5 Ranking */}
      <View style={styles.rankingSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top 5 Ranking</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/ranking')}>
            <Text style={styles.seeAll}>Ver tudo</Text>
          </TouchableOpacity>
        </View>
        {ranking.length === 0 ? (
          <View style={styles.emptyRanking}>
            <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma partida finalizada ainda</Text>
          </View>
        ) : (
          ranking.map((entry, index) => (
            <TouchableOpacity
              key={entry.player_id}
              style={[styles.rankingItem, index === 0 && styles.rankingItemFirst]}
              onPress={() => router.push(`/players/${entry.player_id}`)}
            >
              <View style={[styles.rankBadge, { backgroundColor: getMedalColor(index) }]}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{entry.player_name}</Text>
                <Text style={styles.rankStats}>
                  {entry.total_games} jogos | {entry.wins}V {entry.losses}D
                </Text>
              </View>
              <View style={styles.rankPoints}>
                <Text style={[styles.rankPointsValue, index === 0 && { color: colors.gold }]}>
                  {entry.total_points}
                </Text>
                <Text style={styles.rankPointsLabel}>pts</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.blueDark }]} onPress={() => router.push('/matches/add')}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.quickBtnText}>Nova Partida</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.accent }]} onPress={() => router.push('/players/add')}>
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.quickBtnText}>Novo Jogador</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  teamName: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.accent,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  matchStatsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  matchStatItem: { alignItems: 'center', flex: 1 },
  teamDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  matchStatLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  matchStatValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginTop: 2 },
  avgGoals: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  nextMatchCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  nextMatchHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nextMatchTitle: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '600' },
  nextMatchDate: { color: colors.text, fontSize: fontSize.md, marginTop: spacing.sm },
  teamsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  teamBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  teamBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: fontSize.md },
  vsText: { color: colors.textMuted, fontSize: fontSize.lg, fontWeight: 'bold' },
  rankingSection: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: 'bold' },
  seeAll: { color: colors.accent, fontSize: fontSize.md },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankingItemFirst: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: { color: '#000', fontWeight: 'bold', fontSize: fontSize.md },
  rankInfo: { flex: 1, marginLeft: spacing.md },
  rankName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  rankStats: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  rankPoints: { alignItems: 'center' },
  rankPointsValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: 'bold' },
  rankPointsLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  emptyRanking: { alignItems: 'center', padding: spacing.xl },
  emptyText: { color: colors.textMuted, marginTop: spacing.sm },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  quickBtnText: { color: '#fff', fontWeight: '600', fontSize: fontSize.md },
});
