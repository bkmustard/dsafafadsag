import { GameSettings, LeaderboardEntry, PlayerProfile } from '../types';
import { generateRandomName } from './nameGenerator';

const PROFILE_KEY = 'gibanstars_s8_profile_v4';
const SETTINGS_KEY = 'gibanstars_s8_settings_v4';
const LEADERBOARD_KEY = 'gibanstars_s8_leaderboard_v4';
const ACCOUNTS_STORE_KEY = 'gibanstars_s8_accounts_v4';

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_FREE_LIVES = 10;

export const INITIAL_SETTINGS: GameSettings = {
  bgmVolume: 0.6,
  sfxVolume: 0.8,
  isMuted: false,
};

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function generateSerialNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const suffix = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  return `GS8-${suffix}`;
}

export function getInitialProfile(): PlayerProfile {
  return {
    serialNumber: null,
    isLinked: false,
    name: generateRandomName(),
    faction: null,
    highScore: 0,
    totalChips: 0,
    gamesPlayed: 0,
    chipHistory: [],
    // Discord Integration
    discordUserId: null,
    discordUsername: null,
    discordLinked: false,
    discordLinkedAt: null,
    discordSyncedChips: 0,
    discordEventChips: 0,
    pendingGamePurchaseId: null,

    lives: MAX_FREE_LIVES,
    maxFreeLives: MAX_FREE_LIVES,
    lastRechargeTimestamp: Date.now(),
    lastDailyResetDate: getTodayDateString(),
    usedTicketCodes: [],
  };
}

// Synchronize daily reset (10 free plays) and hourly recharge (1 life per hour)
export function syncRechargeLives(profile: PlayerProfile): { profile: PlayerProfile; msUntilNextRecharge: number } {
  let updated = { ...profile };
  const today = getTodayDateString();
  const now = Date.now();

  // 1. Daily Reset Check (10 free plays per day)
  if (updated.lastDailyResetDate !== today) {
    updated.lastDailyResetDate = today;
    if (updated.lives < MAX_FREE_LIVES) {
      updated.lives = MAX_FREE_LIVES;
    }
    updated.lastRechargeTimestamp = now;
  }

  // 2. Hourly Recharge Check (1 life per hour when under max)
  let msUntilNext = ONE_HOUR_MS;

  if (updated.lives < MAX_FREE_LIVES) {
    const elapsed = now - (updated.lastRechargeTimestamp || now);
    const livesToAdd = Math.floor(elapsed / ONE_HOUR_MS);

    if (livesToAdd > 0) {
      updated.lives = Math.min(MAX_FREE_LIVES, updated.lives + livesToAdd);
      updated.lastRechargeTimestamp = now - (elapsed % ONE_HOUR_MS);
      msUntilNext = ONE_HOUR_MS - (elapsed % ONE_HOUR_MS);
    } else {
      msUntilNext = Math.max(0, ONE_HOUR_MS - elapsed);
    }
  } else {
    // Already full or overfilled with tickets
    updated.lastRechargeTimestamp = now;
    msUntilNext = ONE_HOUR_MS;
  }

  // Save if changed
  if (updated.lives !== profile.lives || updated.lastDailyResetDate !== profile.lastDailyResetDate) {
    saveProfile(updated);
  }

  return { profile: updated, msUntilNextRecharge: msUntilNext };
}

export function consumeLife(profile: PlayerProfile): { success: boolean; updatedProfile: PlayerProfile } {
  const { profile: synced } = syncRechargeLives(profile);
  if (synced.lives <= 0) {
    return { success: false, updatedProfile: synced };
  }

  const updated: PlayerProfile = {
    ...synced,
    lives: synced.lives - 1,
    lastRechargeTimestamp: synced.lives === MAX_FREE_LIVES ? Date.now() : synced.lastRechargeTimestamp,
  };

  saveProfile(updated);
  return { success: true, updatedProfile: updated };
}

// Redeem Discord ticket code
export function redeemTicketCode(
  profile: PlayerProfile,
  rawCode: string
): { success: boolean; message: string; updatedProfile: PlayerProfile } {
  const code = rawCode.trim().toUpperCase();

  if (!code || code.length < 5) {
    return { success: false, message: '올바른 티켓 일련번호를 입력해주세요.', updatedProfile: profile };
  }

  if (profile.usedTicketCodes.includes(code)) {
    return { success: false, message: '이미 사용된 티켓 일련번호입니다.', updatedProfile: profile };
  }

  // Grant lives based on ticket (standard Discord ticket grants +5 lives!)
  const livesBonus = 5;
  const updated: PlayerProfile = {
    ...profile,
    lives: profile.lives + livesBonus,
    usedTicketCodes: [...profile.usedTicketCodes, code],
  };

  saveProfile(updated);
  return {
    success: true,
    message: `디스코드 티켓 [${code}] 등록 완료! 목숨 +${livesBonus}개가 추가되었습니다.`,
    updatedProfile: updated,
  };
}

// Discord Account Linking & Real-time Chip Synchronization
export function linkDiscordAccount(
  profile: PlayerProfile,
  rawDiscordUsername: string,
  rawDiscordUserId?: string,
  discordChips: number = 0
): PlayerProfile {
  const cleanUsername = rawDiscordUsername.trim().replace(/^@/, '');
  const cleanUserId = rawDiscordUserId?.trim() || `dc_${Date.now()}`;

  // If user has chips in Discord, combine or adopt
  const totalCombined = Math.max(profile.totalChips, discordChips);

  const updated: PlayerProfile = {
    ...profile,
    isLinked: true,
    discordLinked: true,
    discordUsername: cleanUsername,
    discordUserId: cleanUserId,
    discordLinkedAt: new Date().toLocaleString('ko-KR'),
    discordSyncedChips: totalCombined,
    totalChips: totalCombined,
    serialNumber: profile.serialNumber || generateSerialNumber(),
  };

  saveProfile(updated);
  return updated;
}

export function unlinkDiscordAccount(profile: PlayerProfile): PlayerProfile {
  const updated: PlayerProfile = {
    ...profile,
    discordLinked: false,
    discordUsername: null,
    discordUserId: null,
    discordLinkedAt: null,
  };

  saveProfile(updated);
  return updated;
}

export function syncDiscordChips(
  profile: PlayerProfile,
  discordEarnedDelta?: number
): { success: boolean; message: string; updatedProfile: PlayerProfile } {
  if (!profile.discordLinked || !profile.discordUsername) {
    return {
      success: false,
      message: '디스코드 계정이 먼저 연동되어 있어야 칩을 동기화할 수 있습니다.',
      updatedProfile: profile,
    };
  }

  // Sync game chips with Discord balance
  const addDelta = typeof discordEarnedDelta === 'number' ? discordEarnedDelta : 0;
  const newTotal = profile.totalChips + addDelta;

  const updated: PlayerProfile = {
    ...profile,
    totalChips: newTotal,
    discordSyncedChips: newTotal,
  };

  saveProfile(updated);
  return {
    success: true,
    message: `디스코드 계정(@${profile.discordUsername})과 이벤트 칩(${newTotal}개)이 성공적으로 동기화되었습니다!`,
    updatedProfile: updated,
  };
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      const fresh = getInitialProfile();
      saveProfile(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    // Ensure all new fields exist
    const merged: PlayerProfile = {
      ...getInitialProfile(),
      ...parsed,
    };
    return merged;
  } catch {
    const fresh = getInitialProfile();
    return fresh;
  }
}

export function saveProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    if (profile.serialNumber) {
      const allAccounts = loadAllAccounts();
      allAccounts[profile.serialNumber.toUpperCase().trim()] = profile;
      localStorage.setItem(ACCOUNTS_STORE_KEY, JSON.stringify(allAccounts));
    }
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function loadAllAccounts(): Record<string, PlayerProfile> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadProfileBySerial(serial: string): PlayerProfile | null {
  const cleanSerial = serial.toUpperCase().trim();
  const accounts = loadAllAccounts();
  if (accounts[cleanSerial]) {
    const found = accounts[cleanSerial];
    saveProfile(found);
    return found;
  }
  return null;
}

export function linkNewAccount(currentProfile: PlayerProfile, customName?: string): PlayerProfile {
  const serial = generateSerialNumber();
  const linked: PlayerProfile = {
    ...currentProfile,
    serialNumber: serial,
    isLinked: true,
    name: customName?.trim() || currentProfile.name,
  };
  saveProfile(linked);
  return linked;
}

export function resetAllRecords(): PlayerProfile {
  const fresh = getInitialProfile();
  saveProfile(fresh);
  return fresh;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return INITIAL_SETTINGS;
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

// Default leaderboard starts empty so only real players who connected and played appear
export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed: LeaderboardEntry[] = JSON.parse(raw);
    // Sanitize: remove any dummy mock records that were not played by real players
    const cleaned = parsed.filter(e => Boolean(e.isPlayer || (e.id && e.id.startsWith('GS8-'))));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

// Batch delete/reset all leaderboard entries
export function clearAllLeaderboard(): LeaderboardEntry[] {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to clear leaderboard', err);
  }
  return [];
}

export function updateLeaderboard(player: PlayerProfile): LeaderboardEntry[] {
  if (!player.faction || player.highScore <= 0) return loadLeaderboard();

  const current = loadLeaderboard();
  const withoutPlayer = current.filter(e => !e.isPlayer);

  const playerEntry: LeaderboardEntry = {
    id: player.serialNumber || 'player_guest',
    name: player.name,
    faction: player.faction,
    score: player.highScore,
    chips: player.totalChips,
    isPlayer: true,
  };

  const updated = [...withoutPlayer, playerEntry].sort((a, b) => b.score - a.score);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated.slice(0, 15)));
  } catch (err) {
    console.error(err);
  }
  return updated.slice(0, 15);
}
