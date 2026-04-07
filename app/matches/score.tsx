import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { getMatchById, updateMatchScore, getMatchPlayers } from '../../src/database/database';

export default function ScoreScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [blueScore, setBlueScore] = useState(0);
  const [orangeScore, setOrangeScore] = useState(0);
  const [hasLineup, setHasLineup] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    (async () => {
      const [match, players] = await Promise.all([
        getMatchById(parseInt(matchId)),
        getMatchPlayers(parseInt(matchId)),
      ]);
      if (match?.blue_score !== null) setBlueScore(match!.blue_score!);
      if (match?.orange_score !== null) setOrangeScore(match!.orange_score!);
      setHasLineup(players.length > 0);
    })();
  }, [matchId]);

  const handleSave = async () => {
    if (!hasLineup) {
      Alert.alert('Atenção', 'Defina a escalação antes de registrar o placar');
      return;
    }
    await updateMatchScore(parseInt(matchId!), blueScore, orangeScore);
    Alert.alert('Sucesso', 'Placar registrado! O ranking foi atualizado automaticamente.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const getResultText = () => {
    if (blueScore > orangeScore) {
      const diff = blueScore - orangeScore;
      return {
        text: `Vitória do Time Azul${diff > 4 ? ' (goleada!)' : ''}`,
        color: colors.blue,
        points: diff > 4 ? 4 : 3,
      };
    }
    if (orangeScore > blueScore) {
      const diff = orangeScore - blueScore;
      return {
        text: `Vitória do Time Laranja${diff > 4 ? ' (goleada!)' : ''}`,
        color: colors.orange,
        points: diff > 4 ? 4 : 3,
      };
    }
    return { text: 'Empate - Ninguém pontua', color: colors.textMuted, points: 0 };
  };

  const result = getResultText();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Blue Team */}
        <View style={styles.teamSection}>
          <View style={[styles.teamHeader, { borderBottomColor: colors.blue }]}>
            <View style={[styles.teamDot, { backgroundColor: colors.blue }]} />
            <Text style={styles.teamName}>Time Azul</Text>
          </View>
          <View style={styles.scoreControl}>
            <TouchableOpacity
              style={styles.scoreBtn}
              onPress={() => setBlueScore(Math.max(0, blueScore - 1))}
            >
              <Ionicons name="remove" size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.scoreValue, { color: colors.blue }]}>{blueScore}</Text>
            <TouchableOpacity
              style={styles.scoreBtn}
              onPress={() => setBlueScore(blueScore + 1)}
            >
              <Ionicons name="add" size={32} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.vsText}>VS</Text>

        {/* Orange Team */}
        <View style={styles.teamSection}>
          <View style={[styles.teamHeader, { borderBottomColor: colors.orange }]}>
            <View style={[styles.teamDot, { backgroundColor: colors.orange }]} />
            <Text style={styles.teamName}>Time Laranja</Text>
          </View>
          <View style={styles.scoreControl}>
            <TouchableOpacity
              style={styles.scoreBtn}
              onPress={() => setOrangeScore(Math.max(0, orangeScore - 1))}
            >
              <Ionicons name="remove" size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.scoreValue, { color: colors.orange }]}>{orangeScore}</Text>
            <TouchableOpacity
              style={styles.scoreBtn}
              onPress={() => setOrangeScore(orangeScore + 1)}
            >
              <Ionicons name="add" size={32} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Result Preview */}
        <View style={styles.resultCard}>
          <Text style={[styles.resultText, { color: result.color }]}>{result.text}</Text>
          <Text style={styles.pointsInfo}>
            Vencedores: +{result.points} pts | Perdedores: 0 pts | Ausentes: -1 pt
          </Text>
        </View>

        {!hasLineup && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={colors.warning} />
            <Text style={styles.warningText}>
              Defina a escalação antes de registrar o placar
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, !hasLineup && { opacity: 0.5 }]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveBtnText}>Confirmar Placar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  teamSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    marginBottom: spacing.md,
  },
  teamDot: { width: 12, height: 12, borderRadius: 6 },
  teamName: { color: colors.text, fontSize: fontSize.xl, fontWeight: 'bold' },
  scoreControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  scoreBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center',
  },
  vsText: {
    color: colors.textMuted,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },
  pointsInfo: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  warningText: { color: colors.warning, fontSize: fontSize.md, flex: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  saveBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: 'bold' },
});
