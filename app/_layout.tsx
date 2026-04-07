import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeDatabase } from '../src/database/database';
import { colors } from '../src/utils/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="players/add" options={{ title: 'Novo Jogador', presentation: 'modal' }} />
        <Stack.Screen name="players/edit" options={{ title: 'Editar Jogador', presentation: 'modal' }} />
        <Stack.Screen name="players/[id]" options={{ title: 'Perfil do Jogador' }} />
        <Stack.Screen name="matches/add" options={{ title: 'Nova Partida', presentation: 'modal' }} />
        <Stack.Screen name="matches/[id]" options={{ title: 'Detalhes da Partida' }} />
        <Stack.Screen name="matches/lineup" options={{ title: 'Escalação' }} />
        <Stack.Screen name="matches/score" options={{ title: 'Registrar Placar' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
