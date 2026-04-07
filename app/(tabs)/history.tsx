import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { getMatches, getMatchPlayers, Match, MatchPlayerWithDetails } from '../../src/database/database';
import { formatDateFull } from '../../src/utils/helpers';
import EmptyState from '../../src/components/EmptyState';

interface MatchWithPlayers extends Match {
  players: MatchPlayerWithDetails[];
}

export default function HistoryScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const allMatches = await getMatches();
      const finished = allMatches.filter(m => m.status === 'finished');
      const withPlayers = await Promise.all(
        finished.map(async (m) => ({
          ...m,
          players: await getMatchPlayers(m.id),
        }))
      );
      setMatches(withPlayers);
    })();
  }, []));

  const getWinner = (match: Match) => {
    if (match.blue_score === null || match.orange_score === null) return null;
    if (match.blue_score > match.orange_score) return 'blue';
    if (match.orange_score > match.blue_score) return 'orange';
    return 'draw';
  };

  const renderMatch = ({ item }: { item: MatchWithPlayers }) => {
    const winner = getWinner(item);
    const bluePlayers = item.players.filter(p => p.team === 'blue');
    const orangePlayers = item.players.filter(p => p.team === 'orange');
    const absentPlayers = item.players.filter(p => p.team === 'absent');

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => router.push(`/matches/${item.id}`)}
      >
        <Text style={styles.matchDate}>{formatDateFull(item.date)}</Text>

        <View style={styles.scoreSection}>
          <View style={[styles.teamBlock, winner === 'blue' && styles.winnerBlock]}>
            <View style={[styles.teamBar, { backgroundColor: colors.blue }]} />
            <Text style={styles.teamName}>Azul</Text>
            {winner === 'blue' && <Ionicons name="trophy" size={14} color={colors.gold} />}
          </View>
          <Text style={styles.score}>{item.blue_score} x {item.orange_score}</Text>
          <View style={[styles.teamBlock, { alignItems: 'flex-end' }, winner === 'orange' && styles.winnerBlock]}>
            <View style={[styles.teamBar, { backgroundColor: colors.orange, alignSelf: 'flex-end' }]} />
            <Text style={styles.teamName}>Laranja</Text>
            {winner === 'orange' && <Ionicons name="trophy" size={14} color={colors.gold} />}
          </View>
        </View>

        <View style={styles.playersSection}>
          <View style={styles.teamPlayers}>
            {bluePlayers.map(p => (
              <Text key={p.id} style={styles.playerName}>{p.player_name}</Text>
            ))}
          </View>
          <View style={styles.teamPlayers}>
            {orangePlayers.map(p => (
              <Text key={p.id} style={[styles.playerName, { textAlign: 'right' }]}>{p.player_name}</Text>
            ))}
          </View>
        </View>

        {absentPlayers.length > 0 && (
          <View style={styles.absentSection}>
            <Text style={styles.absentLabel}>Ausentes: </Text>
            <Text style={styles.absentNames}>
              {absentPlayers.map(p => p.player_name).join(', ')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMatch}
        contentContainerStyle={matches.length === 0 ? styles.emptyList : styles.list}
        ListHeaderComponent={
          <Text style={styles.header}>{matches.length} partida(s) finalizada(s)</Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="Nenhuma partida no histórico"
            subtitle="Finalize partidas para vê-las aqui"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.md, paddingBottom: 20 },
  emptyList: { flex: 1 },
  header: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchDate: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  teamBlock: { flex: 1 },
  winnerBlock: {},
  teamBar: { width: 40, height: 3, borderRadius: 2, marginBottom: 4 },
  teamName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  score: { color: colors.text, fontSize: fontSize.xxl, fontWeight: 'bold', paddingHorizontal: spacing.md },
  playersSection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  teamPlayers: { flex: 1 },
  playerName: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  absentSection: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  absentLabel: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
  absentNames: { color: colors.textMuted, fontSize: fontSize.sm, flex: 1 },
});
