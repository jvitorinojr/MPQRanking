import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('mpqranking.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      shirt_number INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      blue_score INTEGER DEFAULT NULL,
      orange_score INTEGER DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS match_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      team TEXT CHECK(team IN ('blue', 'orange', 'absent')) NOT NULL,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(match_id, player_id)
    );
  `);
}

// Player operations
export interface Player {
  id: number;
  name: string;
  position: string;
  shirt_number: number;
  active: number;
  created_at: string;
}

export async function createPlayer(name: string, position: string, shirtNumber: number): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO players (name, position, shirt_number) VALUES (?, ?, ?)',
    [name, position, shirtNumber]
  );
  return result.lastInsertRowId;
}

export async function updatePlayer(id: number, name: string, position: string, shirtNumber: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE players SET name = ?, position = ?, shirt_number = ? WHERE id = ?',
    [name, position, shirtNumber, id]
  );
}

export async function deletePlayer(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE players SET active = 0 WHERE id = ?', [id]);
}

export async function getPlayers(search?: string): Promise<Player[]> {
  const database = await getDatabase();
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return database.getAllAsync<Player>(
      `SELECT * FROM players WHERE active = 1 AND (
        name LIKE ? OR position LIKE ? OR CAST(shirt_number AS TEXT) LIKE ?
      ) ORDER BY name`,
      [term, term, term]
    );
  }
  return database.getAllAsync<Player>('SELECT * FROM players WHERE active = 1 ORDER BY name');
}

export async function getAllPlayersIncludingInactive(): Promise<Player[]> {
  const database = await getDatabase();
  return database.getAllAsync<Player>('SELECT * FROM players ORDER BY name');
}

export async function getPlayerById(id: number): Promise<Player | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Player>('SELECT * FROM players WHERE id = ?', [id]);
}

// Match operations
export interface Match {
  id: number;
  date: string;
  blue_score: number | null;
  orange_score: number | null;
  status: string;
  created_at: string;
}

export async function createMatch(date: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO matches (date) VALUES (?)',
    [date]
  );
  return result.lastInsertRowId;
}

export async function updateMatchScore(id: number, blueScore: number, orangeScore: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE matches SET blue_score = ?, orange_score = ?, status = ? WHERE id = ?',
    [blueScore, orangeScore, 'finished', id]
  );
}

export async function updateMatchDate(id: number, date: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE matches SET date = ? WHERE id = ?', [date, id]);
}

export async function deleteMatch(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM match_players WHERE match_id = ?', [id]);
  await database.runAsync('DELETE FROM matches WHERE id = ?', [id]);
}

export async function getMatches(): Promise<Match[]> {
  const database = await getDatabase();
  return database.getAllAsync<Match>('SELECT * FROM matches ORDER BY date DESC');
}

export async function getMatchById(id: number): Promise<Match | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Match>('SELECT * FROM matches WHERE id = ?', [id]);
}

export async function getMatchesByPeriod(startDate: string, endDate: string): Promise<Match[]> {
  const database = await getDatabase();
  return database.getAllAsync<Match>(
    'SELECT * FROM matches WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );
}

// Match Players operations
export interface MatchPlayer {
  id: number;
  match_id: number;
  player_id: number;
  team: 'blue' | 'orange' | 'absent';
}

export interface MatchPlayerWithDetails extends MatchPlayer {
  player_name: string;
  player_position: string;
  player_shirt_number: number;
}

export async function setMatchLineup(matchId: number, players: { playerId: number; team: 'blue' | 'orange' | 'absent' }[]): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM match_players WHERE match_id = ?', [matchId]);
  for (const p of players) {
    await database.runAsync(
      'INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)',
      [matchId, p.playerId, p.team]
    );
  }
}

export async function getMatchPlayers(matchId: number): Promise<MatchPlayerWithDetails[]> {
  const database = await getDatabase();
  return database.getAllAsync<MatchPlayerWithDetails>(
    `SELECT mp.*, p.name as player_name, p.position as player_position, p.shirt_number as player_shirt_number
     FROM match_players mp
     JOIN players p ON mp.player_id = p.id
     WHERE mp.match_id = ?
     ORDER BY mp.team, p.name`,
    [matchId]
  );
}

// Ranking calculations
export interface RankingEntry {
  player_id: number;
  player_name: string;
  player_position: string;
  player_shirt_number: number;
  total_points: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  absences: number;
}

export async function calculateRanking(startDate?: string, endDate?: string): Promise<RankingEntry[]> {
  const database = await getDatabase();

  let matchFilter = "WHERE m.status = 'finished'";
  const params: string[] = [];
  if (startDate) {
    matchFilter += ' AND m.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    matchFilter += ' AND m.date <= ?';
    params.push(endDate);
  }

  const query = `
    SELECT
      p.id as player_id,
      p.name as player_name,
      p.position as player_position,
      p.shirt_number as player_shirt_number,
      COALESCE(SUM(
        CASE
          WHEN mp.team = 'absent' THEN -1
          WHEN mp.team = 'blue' AND m.blue_score > m.orange_score AND (m.blue_score - m.orange_score) > 4 THEN 4
          WHEN mp.team = 'blue' AND m.blue_score > m.orange_score THEN 3
          WHEN mp.team = 'orange' AND m.orange_score > m.blue_score AND (m.orange_score - m.blue_score) > 4 THEN 4
          WHEN mp.team = 'orange' AND m.orange_score > m.blue_score THEN 3
          WHEN mp.team = 'blue' AND m.blue_score < m.orange_score THEN 0
          WHEN mp.team = 'orange' AND m.orange_score < m.blue_score THEN 0
          WHEN m.blue_score = m.orange_score AND mp.team != 'absent' THEN 0
          ELSE 0
        END
      ), 0) as total_points,
      COUNT(CASE WHEN mp.team != 'absent' THEN 1 END) as total_games,
      COUNT(CASE
        WHEN (mp.team = 'blue' AND m.blue_score > m.orange_score) OR
             (mp.team = 'orange' AND m.orange_score > m.blue_score) THEN 1
      END) as wins,
      COUNT(CASE
        WHEN (mp.team = 'blue' AND m.blue_score < m.orange_score) OR
             (mp.team = 'orange' AND m.orange_score < m.blue_score) THEN 1
      END) as losses,
      COUNT(CASE
        WHEN mp.team != 'absent' AND m.blue_score = m.orange_score THEN 1
      END) as draws,
      COUNT(CASE WHEN mp.team = 'absent' THEN 1 END) as absences
    FROM players p
    JOIN match_players mp ON p.id = mp.player_id
    JOIN matches m ON mp.match_id = m.id
    ${matchFilter}
    AND p.active = 1
    GROUP BY p.id
    ORDER BY total_points DESC, wins DESC, total_games DESC
  `;

  return database.getAllAsync<RankingEntry>(query, params);
}

// Player history
export interface PlayerMatchHistory {
  match_id: number;
  date: string;
  team: string;
  blue_score: number;
  orange_score: number;
  points: number;
}

export async function getPlayerHistory(playerId: number, startDate?: string, endDate?: string): Promise<PlayerMatchHistory[]> {
  const database = await getDatabase();

  let filter = "WHERE mp.player_id = ? AND m.status = 'finished'";
  const params: (string | number)[] = [playerId];
  if (startDate) {
    filter += ' AND m.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    filter += ' AND m.date <= ?';
    params.push(endDate);
  }

  return database.getAllAsync<PlayerMatchHistory>(
    `SELECT
      m.id as match_id,
      m.date,
      mp.team,
      m.blue_score,
      m.orange_score,
      CASE
        WHEN mp.team = 'absent' THEN -1
        WHEN mp.team = 'blue' AND m.blue_score > m.orange_score AND (m.blue_score - m.orange_score) > 4 THEN 4
        WHEN mp.team = 'blue' AND m.blue_score > m.orange_score THEN 3
        WHEN mp.team = 'orange' AND m.orange_score > m.blue_score AND (m.orange_score - m.blue_score) > 4 THEN 4
        WHEN mp.team = 'orange' AND m.orange_score > m.blue_score THEN 3
        ELSE 0
      END as points
    FROM match_players mp
    JOIN matches m ON mp.match_id = m.id
    ${filter}
    ORDER BY m.date DESC`,
    params
  );
}

// Statistics
export interface GeneralStats {
  total_players: number;
  total_matches: number;
  total_finished: number;
  avg_blue_goals: number;
  avg_orange_goals: number;
  blue_wins: number;
  orange_wins: number;
  draws: number;
}

export async function getGeneralStats(): Promise<GeneralStats> {
  const database = await getDatabase();
  const stats = await database.getFirstAsync<GeneralStats>(`
    SELECT
      (SELECT COUNT(*) FROM players WHERE active = 1) as total_players,
      (SELECT COUNT(*) FROM matches) as total_matches,
      COUNT(*) as total_finished,
      COALESCE(AVG(blue_score), 0) as avg_blue_goals,
      COALESCE(AVG(orange_score), 0) as avg_orange_goals,
      COUNT(CASE WHEN blue_score > orange_score THEN 1 END) as blue_wins,
      COUNT(CASE WHEN orange_score > blue_score THEN 1 END) as orange_wins,
      COUNT(CASE WHEN blue_score = orange_score THEN 1 END) as draws
    FROM matches
    WHERE status = 'finished'
  `);
  return stats!;
}
