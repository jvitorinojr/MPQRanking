import { Platform } from 'react-native';

// Re-export all interfaces from both modules (they are identical)
export type {
  Player, Match, MatchPlayer, MatchPlayerWithDetails,
  RankingEntry, PlayerMatchHistory, GeneralStats,
} from './webStorage';

// Dynamically choose the right storage backend
const db = Platform.OS === 'web'
  ? require('./webStorage')
  : require('./database');

export const initializeDatabase: typeof import('./webStorage').initializeDatabase = db.initializeDatabase;
export const createPlayer: typeof import('./webStorage').createPlayer = db.createPlayer;
export const updatePlayer: typeof import('./webStorage').updatePlayer = db.updatePlayer;
export const deletePlayer: typeof import('./webStorage').deletePlayer = db.deletePlayer;
export const getPlayers: typeof import('./webStorage').getPlayers = db.getPlayers;
export const getAllPlayersIncludingInactive: typeof import('./webStorage').getAllPlayersIncludingInactive = db.getAllPlayersIncludingInactive;
export const getPlayerById: typeof import('./webStorage').getPlayerById = db.getPlayerById;
export const createMatch: typeof import('./webStorage').createMatch = db.createMatch;
export const updateMatchScore: typeof import('./webStorage').updateMatchScore = db.updateMatchScore;
export const updateMatchDate: typeof import('./webStorage').updateMatchDate = db.updateMatchDate;
export const deleteMatch: typeof import('./webStorage').deleteMatch = db.deleteMatch;
export const getMatches: typeof import('./webStorage').getMatches = db.getMatches;
export const getMatchById: typeof import('./webStorage').getMatchById = db.getMatchById;
export const getMatchesByPeriod: typeof import('./webStorage').getMatchesByPeriod = db.getMatchesByPeriod;
export const setMatchLineup: typeof import('./webStorage').setMatchLineup = db.setMatchLineup;
export const getMatchPlayers: typeof import('./webStorage').getMatchPlayers = db.getMatchPlayers;
export const calculateRanking: typeof import('./webStorage').calculateRanking = db.calculateRanking;
export const getPlayerHistory: typeof import('./webStorage').getPlayerHistory = db.getPlayerHistory;
export const getGeneralStats: typeof import('./webStorage').getGeneralStats = db.getGeneralStats;
