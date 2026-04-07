import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { createPlayer } from '../../src/database/database';
import { POSITIONS } from '../../src/utils/helpers';

export default function AddPlayerScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [shirtNumber, setShirtNumber] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Informe o nome do jogador');
      return;
    }
    if (!position) {
      Alert.alert('Erro', 'Selecione a posição');
      return;
    }
    if (!shirtNumber.trim()) {
      Alert.alert('Erro', 'Informe o número da camiseta');
      return;
    }

    await createPlayer(name.trim(), position, parseInt(shirtNumber));
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nome / Apelido</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Neymar"
        placeholderTextColor={colors.textMuted}
        autoFocus
      />

      <Text style={styles.label}>Posição</Text>
      <View style={styles.positionGrid}>
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos.value}
            style={[styles.positionBtn, position === pos.value && styles.positionBtnActive]}
            onPress={() => setPosition(pos.value)}
          >
            <Text style={[styles.positionText, position === pos.value && styles.positionTextActive]}>
              {pos.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Número da Camiseta</Text>
      <TextInput
        style={styles.input}
        value={shirtNumber}
        onChangeText={setShirtNumber}
        placeholder="Ex: 10"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Salvar Jogador</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  positionBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  positionBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  positionText: { color: colors.textSecondary, fontSize: fontSize.md },
  positionTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: 'bold' },
});
