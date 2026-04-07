import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';
import { getPlayers, deletePlayer, Player } from '../../src/database/database';
import PlayerCard from '../../src/components/PlayerCard';
import EmptyState from '../../src/components/EmptyState';

export default function PlayersScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');

  const loadPlayers = useCallback(async () => {
    const data = await getPlayers(search);
    setPlayers(data);
  }, [search]);

  useFocusEffect(useCallback(() => { loadPlayers(); }, [loadPlayers]));

  const handleDelete = (player: Player) => {
    Alert.alert(
      'Excluir Jogador',
      `Deseja excluir ${player.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deletePlayer(player.id);
            loadPlayers();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, posição ou número..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/players/add')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>{players.length} jogador(es)</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PlayerCard
            name={item.name}
            position={item.position}
            shirtNumber={item.shirt_number}
            onPress={() => router.push(`/players/${item.id}`)}
            onEdit={() => router.push({ pathname: '/players/edit', params: { id: item.id.toString() } })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum jogador cadastrado"
            subtitle="Toque no + para adicionar um jogador"
          />
        }
        contentContainerStyle={players.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  addBtn: {
    backgroundColor: colors.accent,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: 20 },
  emptyList: { flex: 1 },
});
