export type Faction = 'angel' | 'devil';

export interface GameSettings {
  bgmVolume: number; // 0 - 1
  sfxVolume: number; // 0 - 1
  isMuted: boolean;
  customThirdImageUrl?: string;
}

export interface ChipRecord {
  id: string;
  date: string;
  faction: Faction;
  score: number;
  chipsEarned: number;
}

export interface PlayerProfile {
  serialNumber: string | null;
  isLinked: boolean;
  name: string;
  faction: Faction | null;
  highScore: number;
  totalChips: number;
  gamesPlayed: number;
  chipHistory: ChipRecord[];

  // Discord Integration
  discordUserId?: string | null;
  discordUsername?: string | null;
  discordLinked: boolean;
  discordLinkedAt?: string | null;
  discordSyncedChips?: number;
  discordEventChips?: number;
  pendingGamePurchaseId?: string | null;

  // Life & Ticket System
  lives: number; // Current available lives/plays
  maxFreeLives: number; // Daily free capacity (10)
  lastRechargeTimestamp: number; // Timestamp of last recharge calculation
  lastDailyResetDate: string; // YYYY-MM-DD
  usedTicketCodes: string[]; // Set of redeemed Discord ticket codes
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  faction: Faction;
  score: number;
  chips: number;
  isPlayer?: boolean;
}

export interface ObstaclePair {
  x: number;
  width: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  passed: boolean;
  topType: number;
  bottomType: number;
  topDestroyed?: boolean;
  bottomDestroyed?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'flame' | 'sparkle' | 'feather' | 'smoke' | 'fever' | 'debris';
  rotation?: number;
  vRot?: number;
}
