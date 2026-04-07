import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import {
  getPlayerById, getPlayerHistory, calculateRanking,
  Player, PlayerMatchHistory, RankingEntry
} from '../../src/database';
import { getPositionLabel, getPositionColor, formatDate } from '../../src/utils/helpers';
import StatCard from '../../src/components/StatCard';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [history, setHistory] = useState<PlayerMatchHistory[]>([]);
  const [ranking, setRanking] = useState<RankingEntry | null>(null);
  const [rankPosition, setRankPosition] = useState<number>(0);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    const playerId = parseInt(id);

    (async () => {
      const [p, h, allRanking] = await Promise.all([
        getPlayerById(playerId),
        getPlayerHistory(playerId),
        calculateRanking(),
      ]);
      setPlayer(p);
      setHistory(h);
      const idx = allRanking.findIndex(r => r.player_id === playerId);
      if (idx >= 0) {
        setRanking(allRanking[idx]);
        setRankPosition(idx + 1);
      }
    })();
  }, [id]));

  if (!player) return null;

  const getResultColor = (points: number) => {
    if (points >= 3) return colors.success;
    if (points === 0) return colors.textMuted;
    return colors.danger;
  };

  const getResultLabel = (points: number, team: string) => {
    if (team === 'absent') return 'Ausente';
    if (points >= 3) return 'Vitória';
    if (points === 0) return 'Derrota/Empate';
    return '';
  };

  // Build cumulative points for the chart display
  const cumulativePoints: number[] = [];
  let cumSum = 0;
  const sortedHistory = [...history].reverse();
  for (const h of sortedHistory) {
    cumSum += h.points;
    cumulativePoints.push(cumSum);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Player Header */}
      <View style={styles.header}>
        <View style={[styles.shirtBadge, { backgroundColor: getPositionColor(player.position) }]}>
          <Text style={styles.shirtNumber}>{player.shirt_number}</Text>
        </View>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={[styles.playerPosition, { color: getPositionColor(player.position) }]}>
          {getPositionLabel(player.position)}
        </Text>
      </View>

      {/* Ranking Position */}
      {ranking && (
        <View style={styles.rankingCard}>
          <View style={styles.rankingRow}>
            <View style={styles.rankItem}>
              <Ionicons name="trophy" size={24} color={colors.gold} />
              <Text style={styles.rankValue}>#{rankPosition}</Text>
              <Text style={styles.rankLabel}>Posição</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankItem}>
              <Text style={styles.pointsValue}>{ranking.total_points}</Text>
              <Text style={styles.rankLabel}>Pontos</Text>
            </View>
          </View>
        </View>
      )}

      {/* Stats */}
      {ranking && (
        <View style={styles.statsRow}>
          <StatCard icon="football" label="Jogos" value={ranking.total_games} color={colors.blue} />
          <StatCard icon="checkmark-circle" label="Vitórias" value={ranking.wins} color={colors.success} />
          <StatCard icon="close-circle" label="Derrotas" value={ranking.losses} color={colors.danger} />
          <StatCard icon="remove-circle" label="Ausências" value={ranking.absences} color={colors.warning} />
        </View>
      )}

      {/* Points Evolution (simple text-based chart) */}
      {cumulativePoints.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Evolução da Pontuação</Text>
          <View style={styles.chartContainer}>
            {cumulativePoints.map((pts, i) => {
              const maxPts = Math.max(...cumulativePoints, 1);
              const minPts = Math.min(...cumulativePoints, 0);
              const range = maxPts - minPts || 1;
              const height = Math.max(((pts - minPts) / range) * 100, 4);
              return (
                <View key={i} style={styles.chartBarContainer}>
                  <Text style={styles.chartBarLabel}>{pts}</Text>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height,
                        backgroundColor: pts >= 0 ? colors.accent : colors.danger,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Match History */}
      <Text style={styles.sectionTitle}>Histórico de Partidas</Text>
      {history.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma partida registrada</Text>
      ) : (
        history.map((h, i) => (
          <View key={i} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyDate}>{formatDate(h.date)}</Text>
              <Text style={styles.historyScore}>
                {h.team === 'absent' ? 'Ausente' : (
                  <>
                    <Text style={{ color: colors.blue }}>Azul {h.blue_score}</Text>
                    {' x '}
                    <Text style={{ color: colors.orange }}>{h.orange_score} Laranja</Text>
                  </>
                )}
              </Text>
              {h.team !== 'absent' && (
                <Text style={[styles.historyTeam, { color: h.team === 'blue' ? colors.blue : colors.orange }]}>
                  Time {h.team === 'blue' ? 'Azul' : 'Laranja'}
                </Text>
              )}
            </View>
            <View style={styles.historyRight}>
              <View style={[styles.pointsBadge, { backgroundColor: getResultColor(h.points) + '20' }]}>
                <Text style={[styles.pointsText, { color: getResultColor(h.points) }]}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </Text>
              </View>
              <Text style={[styles.resultText, { color: getResultColor(h.points) }]}>
                {getResultLabel(h.points, h.team)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: spacing.lg },
  shirtBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shirtNumber: { color: '#fff', fontSize: fontSize.xxl, fontWeight: 'bold' },
  playerName: { color: colors.text, fontSize: fontSize.xxl, fontWeight: 'bold', marginTop: spacing.sm },
  playerPosition: { fontSize: fontSize.lg, marginTop: 4 },
  rankingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  rankingRow: { flexDirection: 'row', alignItems: 'center' },
  rankItem: { flex: 1, alignItems: 'center' },
  rankValue: { color: colors.gold, fontSize: fontSize.xxl, fontWeight: 'bold', marginTop: 4 },
  rankLabel: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  pointsValue: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: 'bold' },
  rankDivider: { width: 1, height: 50, backgroundColor: colors.border },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 2,
    marginTop: spacing.sm,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: '80%',
    borderRadius: 3,
    minHeight: 4,
  },
  chartBarLabel: {
    color: colors.textMuted,
    fontSize: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyLeft: { flex: 1 },
  historyDate: { color: colors.textMuted, fontSize: fontSize.sm },
  historyScore: { color: colors.text, fontSize: fontSize.md, marginTop: 4 },
  historyTeam: { fontSize: fontSize.sm, marginTop: 2 },
  historyRight: { alignItems: 'center', justifyContent: 'center' },
  pointsBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  pointsText: { fontSize: fontSize.xl, fontWeight: 'bold' },
  resultText: { fontSize: fontSize.xs, marginTop: 2 },
});
