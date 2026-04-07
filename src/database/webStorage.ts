/**
 * Web-compatible storage layer using localStorage + JSON.
 * Mirrors the same interface as the SQLite database module
 * so all screens work on both native and web.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage helpers ───────────────────────────────────────────────
const KEYS = {
  players: 'mpq_players',
  matches: 'mpq_matches',
  matchPlayers: 'mpq_match_players',
  counters: 'mpq_counters',
};

interface Counters { playerId: number; matchId: number; matchPlayerId: number; }

async function getCounters(): Promise<Counters> {
  const raw = await AsyncStorage.getItem(KEYS.counters);
  return raw ? JSON.parse(raw) : { playerId: 0, matchId: 0, matchPlayerId: 0 };
}
async function saveCounters(c: Counters) { await AsyncStorage.setItem(KEYS.counters, JSON.stringify(c)); }

async function loadTable<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}
async function saveTable<T>(key: string, data: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ─── Interfaces (re-exported, same as database.ts) ────────────────

export interface Player {
  id: number; name: string; position: string; shirt_number: number;
  active: number; created_at: string;
}
export interface Match {
  id: number; date: string; blue_score: number | null; orange_score: number | null;
  status: string; created_at: string;
}
export interface MatchPlayer {
  id: number; match_id: number; player_id: number;
  team: 'blue' | 'orange' | 'absent';
}
export interface MatchPlayerWithDetails extends MatchPlayer {
  player_name: string; player_position: string; player_shirt_number: number;
}
export interface RankingEntry {
  player_id: number; player_name: string; player_position: string;
  player_shirt_number: number; total_points: number; total_games: number;
  wins: number; losses: number; draws: number; absences: number;
}
export interface PlayerMatchHistory {
  match_id: number; date: string; team: string;
  blue_score: number; orange_score: number; points: number;
}
export interface GeneralStats {
  total_players: number; total_matches: number; total_finished: number;
  avg_blue_goals: number; avg_orange_goals: number;
  blue_wins: number; orange_wins: number; draws: number;
}

// ─── Init ──────────────────────────────────────────────────────────
export async function initializeDatabase(): Promise<void> {
  // Ensure keys exist
  for (const key of Object.values(KEYS)) {
    const val = await AsyncStorage.getItem(key);
    if (val === null) {
      await AsyncStorage.setItem(key, key === KEYS.counters
        ? JSON.stringify({ playerId: 0, matchId: 0, matchPlayerId: 0 })
        : '[]');
    }
  }
}

// ─── Player CRUD ───────────────────────────────────────────────────
export async function createPlayer(name: string, position: string, shirtNumber: number): Promise<number> {
  const players = await loadTable<Player>(KEYS.players);
  const c = await getCounters();
  c.playerId++;
  const player: Player = {
    id: c.playerId, name, position, shirt_number: shirtNumber,
    active: 1, created_at: new Date().toISOString(),
  };
  players.push(player);
  await saveTable(KEYS.players, players);
  await saveCounters(c);
  return c.playerId;
}

export async function updatePlayer(id: number, name: string, position: string, shirtNumber: number): Promise<void> {
  const players = await loadTable<Player>(KEYS.players);
  const idx = players.findIndex(p => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], name, position, shirt_number: shirtNumber };
    await saveTable(KEYS.players, players);
  }
}

export async function deletePlayer(id: number): Promise<void> {
  const players = await loadTable<Player>(KEYS.players);
  const idx = players.findIndex(p => p.id === id);
  if (idx >= 0) {
    players[idx].active = 0;
    await saveTable(KEYS.players, players);
  }
}

export async function getPlayers(search?: string): Promise<Player[]> {
  let players = (await loadTable<Player>(KEYS.players)).filter(p => p.active === 1);
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    players = players.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.position.toLowerCase().includes(term) ||
      p.shirt_number.toString().includes(term)
    );
  }
  return players.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllPlayersIncludingInactive(): Promise<Player[]> {
  return (await loadTable<Player>(KEYS.players)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlayerById(id: number): Promise<Player | null> {
  return (await loadTable<Player>(KEYS.players)).find(p => p.id === id) || null;
}

// ─── Match CRUD ────────────────────────────────────────────────────
export async function createMatch(date: string): Promise<number> {
  const matches = await loadTable<Match>(KEYS.matches);
  const c = await getCounters();
  c.matchId++;
  const match: Match = {
    id: c.matchId, date, blue_score: null, orange_score: null,
    status: 'scheduled', created_at: new Date().toISOString(),
  };
  matches.push(match);
  await saveTable(KEYS.matches, matches);
  await saveCounters(c);
  return c.matchId;
}

export async function updateMatchScore(id: number, blueScore: number, orangeScore: number): Promise<void> {
  const matches = await loadTable<Match>(KEYS.matches);
  const idx = matches.findIndex(m => m.id === id);
  if (idx >= 0) {
    matches[idx] = { ...matches[idx], blue_score: blueScore, orange_score: orangeScore, status: 'finished' };
    await saveTable(KEYS.matches, matches);
  }
}

export async function updateMatchDate(id: number, date: string): Promise<void> {
  const matches = await loadTable<Match>(KEYS.matches);
  const idx = matches.findIndex(m => m.id === id);
  if (idx >= 0) {
    matches[idx].date = date;
    await saveTable(KEYS.matches, matches);
  }
}

export async function deleteMatch(id: number): Promise<void> {
  let matches = await loadTable<Match>(KEYS.matches);
  matches = matches.filter(m => m.id !== id);
  await saveTable(KEYS.matches, matches);
  let mps = await loadTable<MatchPlayer>(KEYS.matchPlayers);
  mps = mps.filter(mp => mp.match_id !== id);
  await saveTable(KEYS.matchPlayers, mps);
}

export async function getMatches(): Promise<Match[]> {
  return (await loadTable<Match>(KEYS.matches)).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getMatchById(id: number): Promise<Match | null> {
  return (await loadTable<Match>(KEYS.matches)).find(m => m.id === id) || null;
}

export async function getMatchesByPeriod(startDate: string, endDate: string): Promise<Match[]> {
  return (await loadTable<Match>(KEYS.matches))
    .filter(m => m.date >= startDate && m.date <= endDate)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Match Players ─────────────────────────────────────────────────
export async function setMatchLineup(matchId: number, players: { playerId: number; team: 'blue' | 'orange' | 'absent' }[]): Promise<void> {
  let mps = await loadTable<MatchPlayer>(KEYS.matchPlayers);
  mps = mps.filter(mp => mp.match_id !== matchId);
  const c = await getCounters();
  for (const p of players) {
    c.matchPlayerId++;
    mps.push({ id: c.matchPlayerId, match_id: matchId, player_id: p.playerId, team: p.team });
  }
  await saveTable(KEYS.matchPlayers, mps);
  await saveCounters(c);
}

export async function getMatchPlayers(matchId: number): Promise<MatchPlayerWithDetails[]> {
  const mps = (await loadTable<MatchPlayer>(KEYS.matchPlayers)).filter(mp => mp.match_id === matchId);
  const allPlayers = await loadTable<Player>(KEYS.players);
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));

  return mps.map(mp => {
    const player = playerMap.get(mp.player_id)!;
    return {
      ...mp,
      player_name: player?.name || 'Desconhecido',
      player_position: player?.position || '',
      player_shirt_number: player?.shirt_number || 0,
    };
  }).sort((a, b) => {
    if (a.team !== b.team) return a.team.localeCompare(b.team);
    return a.player_name.localeCompare(b.player_name);
  });
}

// ─── Scoring helper ────────────────────────────────────────────────
function calcPoints(team: string, blueScore: number, orangeScore: number): number {
  if (team === 'absent') return -1;
  if (blueScore === orangeScore) return 0;
  const isBlueWin = blueScore > orangeScore;
  const isOrangeWin = orangeScore > blueScore;
  const diff = Math.abs(blueScore - orangeScore);
  if (team === 'blue' && isBlueWin) return diff > 4 ? 4 : 3;
  if (team === 'orange' && isOrangeWin) return diff > 4 ? 4 : 3;
  return 0; // loss
}

// ─── Ranking ───────────────────────────────────────────────────────
export async function calculateRanking(startDate?: string, endDate?: string): Promise<RankingEntry[]> {
  const allPlayers = (await loadTable<Player>(KEYS.players)).filter(p => p.active === 1);
  let matches = (await loadTable<Match>(KEYS.matches)).filter(m => m.status === 'finished');
  if (startDate) matches = matches.filter(m => m.date >= startDate);
  if (endDate) matches = matches.filter(m => m.date <= endDate);

  const allMPs = await loadTable<MatchPlayer>(KEYS.matchPlayers);
  const matchMap = new Map(matches.map(m => [m.id, m]));

  const stats = new Map<number, RankingEntry>();

  for (const mp of allMPs) {
    const match = matchMap.get(mp.match_id);
    if (!match) continue;
    const player = allPlayers.find(p => p.id === mp.player_id);
    if (!player) continue;

    if (!stats.has(mp.player_id)) {
      stats.set(mp.player_id, {
        player_id: player.id, player_name: player.name,
        player_position: player.position, player_shirt_number: player.shirt_number,
        total_points: 0, total_games: 0, wins: 0, losses: 0, draws: 0, absences: 0,
      });
    }
    const s = stats.get(mp.player_id)!;
    const pts = calcPoints(mp.team, match.blue_score!, match.orange_score!);
    s.total_points += pts;

    if (mp.team === 'absent') {
      s.absences++;
    } else {
      s.total_games++;
      if (pts >= 3) s.wins++;
      else if (match.blue_score === match.orange_score) s.draws++;
      else s.losses++;
    }
  }

  return Array.from(stats.values()).sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.total_games - a.total_games;
  });
}

// ─── Player History ────────────────────────────────────────────────
export async function getPlayerHistory(playerId: number, startDate?: string, endDate?: string): Promise<PlayerMatchHistory[]> {
  let matches = (await loadTable<Match>(KEYS.matches)).filter(m => m.status === 'finished');
  if (startDate) matches = matches.filter(m => m.date >= startDate);
  if (endDate) matches = matches.filter(m => m.date <= endDate);

  const allMPs = (await loadTable<MatchPlayer>(KEYS.matchPlayers)).filter(mp => mp.player_id === playerId);
  const matchMap = new Map(matches.map(m => [m.id, m]));

  return allMPs
    .filter(mp => matchMap.has(mp.match_id))
    .map(mp => {
      const match = matchMap.get(mp.match_id)!;
      return {
        match_id: match.id, date: match.date, team: mp.team,
        blue_score: match.blue_score!, orange_score: match.orange_score!,
        points: calcPoints(mp.team, match.blue_score!, match.orange_score!),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── General Stats ─────────────────────────────────────────────────
export async function getGeneralStats(): Promise<GeneralStats> {
  const allPlayers = (await loadTable<Player>(KEYS.players)).filter(p => p.active === 1);
  const allMatches = await loadTable<Match>(KEYS.matches);
  const finished = allMatches.filter(m => m.status === 'finished');

  let blueGoals = 0, orangeGoals = 0, blueWins = 0, orangeWins = 0, draws = 0;
  for (const m of finished) {
    blueGoals += m.blue_score || 0;
    orangeGoals += m.orange_score || 0;
    if (m.blue_score! > m.orange_score!) blueWins++;
    else if (m.orange_score! > m.blue_score!) orangeWins++;
    else draws++;
  }
  const n = finished.length || 1;
  return {
    total_players: allPlayers.length, total_matches: allMatches.length,
    total_finished: finished.length,
    avg_blue_goals: blueGoals / n, avg_orange_goals: orangeGoals / n,
    blue_wins: blueWins, orange_wins: orangeWins, draws,
  };
}
