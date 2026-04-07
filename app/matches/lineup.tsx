import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { getPlayers, getMatchPlayers, setMatchLineup, Player, MatchPlayerWithDetails } from '../../src/database/database';
import { getPositionLabel, getPositionColor } from '../../src/utils/helpers';

type TeamAssignment = 'blue' | 'orange' | 'absent' | null;

interface PlayerWithTeam extends Player {
  team: TeamAssignment;
}

export default function LineupScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [allPlayers, existingLineup] = await Promise.all([
        getPlayers(),
        getMatchPlayers(parseInt(matchId!)),
      ]);

      const lineupMap = new Map<number, string>();
      existingLineup.forEach(mp => lineupMap.set(mp.player_id, mp.team));

      setPlayers(allPlayers.map(p => ({
        ...p,
        team: (lineupMap.get(p.id) as TeamAssignment) || null,
      })));
    })();
  }, [matchId]));

  const cycleTeam = (playerId: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const next: TeamAssignment =
        p.team === null ? 'blue' :
        p.team === 'blue' ? 'orange' :
        p.team === 'orange' ? 'absent' :
        null;
      return { ...p, team: next };
    }));
  };

  const handleSave = async () => {
    const assigned = players.filter(p => p.team !== null);
    if (assigned.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um jogador');
      return;
    }

    await setMatchLineup(
      parseInt(matchId!),
      assigned.map(p => ({ playerId: p.id, team: p.team! }))
    );
    router.back();
  };

  const getTeamStyle = (team: TeamAssignment) => {
    switch (team) {
      case 'blue': return { bg: colors.blueDark, label: 'AZUL', icon: 'shirt' as const };
      case 'orange': return { bg: colors.orangeDark, label: 'LARANJA', icon: 'shirt' as const };
      case 'absent': return { bg: colors.danger, label: 'AUSENTE', icon: 'close-circle' as const };
      default: return { bg: colors.surfaceLight, label: 'NÃO SELECIONADO', icon: 'help-circle' as const };
    }
  };

  const blueCount = players.filter(p => p.team === 'blue').length;
  const orangeCount = players.filter(p => p.team === 'orange').length;
  const absentCount = players.filter(p => p.team === 'absent').length;

  return (
    <View style={styles.container}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryItem, { backgroundColor: colors.blueDark }]}>
          <Text style={styles.summaryText}>Azul: {blueCount}</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: colors.orangeDark }]}>
          <Text style={styles.summaryText}>Laranja: {orangeCount}</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: colors.danger }]}>
          <Text style={styles.summaryText}>Ausentes: {absentCount}</Text>
        </View>
      </View>

      <Text style={styles.hint}>Toque para alternar: Azul → Laranja → Ausente → Remover</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const teamStyle = getTeamStyle(item.team);
          return (
            <TouchableOpacity
              style={[styles.playerCard, { borderLeftColor: teamStyle.bg, borderLeftWidth: 4 }]}
              onPress={() => cycleTeam(item.id)}
            >
              <View style={[styles.numBadge, { backgroundColor: getPositionColor(item.position) }]}>
                <Text style={styles.numText}>{item.shirt_number}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={[styles.playerPos, { color: getPositionColor(item.position) }]}>
                  {getPositionLabel(item.position)}
                </Text>
              </View>
              <View style={[styles.teamBadge, { backgroundColor: teamStyle.bg }]}>
                <Ionicons name={teamStyle.icon} size={14} color="#fff" />
                <Text style={styles.teamBadgeText}>{teamStyle.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <Text style={styles.saveBtnText}>Salvar Escalação</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: 0,
  },
  summaryItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  summaryText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '600' },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    padding: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: 80 },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numText: { color: '#fff', fontWeight: 'bold', fontSize: fontSize.md },
  playerInfo: { flex: 1, marginLeft: spacing.md },
  playerName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  playerPos: { fontSize: fontSize.sm, marginTop: 2 },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  teamBadgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '600' },
  saveBtn: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  saveBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: 'bold' },
});
