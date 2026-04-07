import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import {
  getMatchById, getMatchPlayers, deleteMatch,
  Match, MatchPlayerWithDetails,
} from '../../src/database/database';
import { formatDateFull, getPositionLabel, getPositionColor } from '../../src/utils/helpers';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<MatchPlayerWithDetails[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    const matchId = parseInt(id);
    const [m, p] = await Promise.all([
      getMatchById(matchId),
      getMatchPlayers(matchId),
    ]);
    setMatch(m);
    setPlayers(p);
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (!match) return null;

  const bluePlayers = players.filter(p => p.team === 'blue');
  const orangePlayers = players.filter(p => p.team === 'orange');
  const absentPlayers = players.filter(p => p.team === 'absent');
  const isFinished = match.status === 'finished';

  const getWinner = () => {
    if (!isFinished) return null;
    if (match.blue_score! > match.orange_score!) return 'blue';
    if (match.orange_score! > match.blue_score!) return 'orange';
    return 'draw';
  };

  const winner = getWinner();

  const handleDelete = () => {
    Alert.alert('Excluir Partida', 'Deseja excluir esta partida? O ranking será recalculado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteMatch(parseInt(id!));
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Match Header */}
      <View style={styles.dateRow}>
        <Ionicons name="calendar" size={20} color={colors.accent} />
        <Text style={styles.dateText}>{formatDateFull(match.date)}</Text>
        <View style={[styles.statusBadge, {
          backgroundColor: isFinished ? colors.success + '20' : colors.warning + '20'
        }]}>
          <Text style={[styles.statusText, {
            color: isFinished ? colors.success : colors.warning
          }]}>
            {isFinished ? 'Finalizada' : 'Agendada'}
          </Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreSide}>
          <View style={[styles.teamIndicator, { backgroundColor: colors.blue }]} />
          <Text style={styles.teamName}>Azul</Text>
          {winner === 'blue' && <Ionicons name="trophy" size={16} color={colors.gold} />}
        </View>
        <View style={styles.scoreCenter}>
          {isFinished ? (
            <Text style={styles.scoreText}>{match.blue_score} x {match.orange_score}</Text>
          ) : (
            <Text style={styles.pendingScore}>- x -</Text>
          )}
        </View>
        <View style={[styles.scoreSide, { alignItems: 'flex-end' }]}>
          <View style={[styles.teamIndicator, { backgroundColor: colors.orange, alignSelf: 'flex-end' }]} />
          <Text style={styles.teamName}>Laranja</Text>
          {winner === 'orange' && <Ionicons name="trophy" size={16} color={colors.gold} />}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.blueDark }]}
          onPress={() => router.push({ pathname: '/matches/lineup', params: { matchId: id } })}
        >
          <Ionicons name="people" size={20} color="#fff" />
          <Text style={styles.actionText}>Escalação</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push({ pathname: '/matches/score', params: { matchId: id } })}
        >
          <Ionicons name="football" size={20} color="#fff" />
          <Text style={styles.actionText}>{isFinished ? 'Editar Placar' : 'Registrar Placar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Team Lists */}
      {bluePlayers.length > 0 && (
        <View style={styles.teamSection}>
          <View style={styles.teamHeader}>
            <View style={[styles.teamDot, { backgroundColor: colors.blue }]} />
            <Text style={styles.teamTitle}>Time Azul ({bluePlayers.length})</Text>
          </View>
          {bluePlayers.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <View style={[styles.playerNum, { backgroundColor: getPositionColor(p.player_position) }]}>
                <Text style={styles.playerNumText}>{p.player_shirt_number}</Text>
              </View>
              <Text style={styles.playerName}>{p.player_name}</Text>
              <Text style={[styles.playerPos, { color: getPositionColor(p.player_position) }]}>
                {getPositionLabel(p.player_position)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {orangePlayers.length > 0 && (
        <View style={styles.teamSection}>
          <View style={styles.teamHeader}>
            <View style={[styles.teamDot, { backgroundColor: colors.orange }]} />
            <Text style={styles.teamTitle}>Time Laranja ({orangePlayers.length})</Text>
          </View>
          {orangePlayers.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <View style={[styles.playerNum, { backgroundColor: getPositionColor(p.player_position) }]}>
                <Text style={styles.playerNumText}>{p.player_shirt_number}</Text>
              </View>
              <Text style={styles.playerName}>{p.player_name}</Text>
              <Text style={[styles.playerPos, { color: getPositionColor(p.player_position) }]}>
                {getPositionLabel(p.player_position)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {absentPlayers.length > 0 && (
        <View style={styles.teamSection}>
          <View style={styles.teamHeader}>
            <View style={[styles.teamDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.teamTitle}>Ausentes ({absentPlayers.length})</Text>
          </View>
          {absentPlayers.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <View style={[styles.playerNum, { backgroundColor: colors.textMuted }]}>
                <Text style={styles.playerNumText}>{p.player_shirt_number}</Text>
              </View>
              <Text style={[styles.playerName, { color: colors.textMuted }]}>{p.player_name}</Text>
            </View>
          ))}
        </View>
      )}

      {players.length === 0 && (
        <View style={styles.emptyLineup}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Escalação não definida</Text>
          <Text style={styles.emptySubtext}>Toque em "Escalação" para montar os times</Text>
        </View>
      )}

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash" size={18} color={colors.danger} />
        <Text style={styles.deleteBtnText}>Excluir Partida</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateText: { color: colors.text, fontSize: fontSize.lg, flex: 1 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: { fontSize: fontSize.sm, fontWeight: '600' },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreSide: { flex: 1 },
  teamIndicator: { width: 40, height: 4, borderRadius: 2, marginBottom: spacing.sm },
  teamName: { color: colors.text, fontSize: fontSize.xl, fontWeight: 'bold' },
  scoreCenter: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  scoreText: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: 'bold' },
  pendingScore: { color: colors.textMuted, fontSize: fontSize.xxxl, fontWeight: 'bold' },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  teamSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamDot: { width: 12, height: 12, borderRadius: 6 },
  teamTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  playerNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumText: { color: '#fff', fontSize: fontSize.sm, fontWeight: 'bold' },
  playerName: { color: colors.text, fontSize: fontSize.md, flex: 1 },
  playerPos: { fontSize: fontSize.sm },
  emptyLineup: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: { color: colors.textMuted, fontSize: fontSize.lg, marginTop: spacing.sm },
  emptySubtext: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '600' },
});
