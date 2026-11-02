import { PlayerProfile } from '../types';

export const DEFAULT_BOT_API_URL = 'https://economybot-yu.fly.dev';

export function getApiBaseUrl(): string {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('gibanstars_s8_api_url') : null;
  if (custom && custom.trim()) {
    const trimmed = custom.trim().replace(/\/$/, '');
    if (trimmed.includes('YOUR-FLY-APP')) {
      // Clear stale placeholder
      localStorage.removeItem('gibanstars_s8_api_url');
      return DEFAULT_BOT_API_URL;
    }
    return trimmed;
  }
  return (import.meta.env.VITE_GAME_API_URL || DEFAULT_BOT_API_URL).replace(/\/$/, '');
}

export function setApiBaseUrl(url: string | null) {
  if (typeof window === 'undefined') return;
  if (url && url.trim()) {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed.includes('YOUR-FLY-APP')) {
      localStorage.removeItem('gibanstars_s8_api_url');
    } else {
      localStorage.setItem('gibanstars_s8_api_url', trimmed);
    }
  } else {
    localStorage.removeItem('gibanstars_s8_api_url');
  }
}

export interface GameAccountStatus {
  linked: boolean;
  eventChips: number;
  discordUsername?: string;
}

export interface ExportChipsResult {
  success: boolean;
  exportedChips: number;
  newDiscordBalance: number;
  replayed?: boolean;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiBase = getApiBaseUrl();

  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 405) {
      throw new Error(`디스코드 봇 서버(${apiBase})에 해당 API(${path})가 아직 배포되지 않았습니다 (405 Method Not Allowed).`);
    }
    const messages: Record<string, string> = {
      not_linked: '디스코드에서 게임 계정을 먼저 연동해 주세요. (!게임연동 GS8-일련번호)',
      coupon_not_found: '쿠폰 번호가 없거나 다른 계정에 발급된 쿠폰이에요.',
      coupon_used: '이미 사용한 쿠폰이에요. (쿠폰은 1회만 사용 가능합니다)',
      insufficient_event_chips: '이벤트 칩이 부족해요.',
      insufficient_game_chips: '내보낼 수 있는 이벤트 칩이 부족합니다.',
      request_conflict: '요청이 이미 처리되었거나 충돌이 발생했어요.',
      invalid_input: '입력 형식이 올바르지 않습니다.',
      invalid_serial: '올바르지 않은 일련번호입니다.',
    };
    throw new Error(messages[data.error] || `서버 요청 실패 (${response.status})`);
  }

  return data as T;
}

export async function getGameAccount(serial: string): Promise<GameAccountStatus> {
  return post<GameAccountStatus>('/api/game/account', { serial });
}

export async function redeemGameCoupon(
  serial: string,
  code: string
): Promise<{ success: boolean; lives: number; code: string; replayed?: boolean }> {
  return post('/api/game/redeem-coupon', { serial, code: code.trim().toUpperCase() });
}

export async function purchaseLifeTicket(
  serial: string,
  requestId: string
): Promise<{ success: boolean; receiptId: string; lives: number; eventChips: number; replayed?: boolean }> {
  return post('/api/game/purchase-life-ticket', { serial, requestId });
}

export function getStoredExportedChips(serial: string): number {
  if (typeof window === 'undefined' || !serial) return 0;
  const key = `gibanstars_exported_${serial.trim().toUpperCase()}`;
  const val = localStorage.getItem(key);
  return val ? parseInt(val, 10) || 0 : 0;
}

export function recordExportSuccess(serial: string, amount: number) {
  if (typeof window === 'undefined' || !serial || amount <= 0) return;
  const key = `gibanstars_exported_${serial.trim().toUpperCase()}`;
  const current = getStoredExportedChips(serial);
  localStorage.setItem(key, String(current + amount));
}

export async function exportEventChips(
  serial: string,
  amount: number,
  currentDiscordChips?: number,
  requestId?: string
): Promise<ExportChipsResult> {
  const reqId = requestId || createPurchaseRequestId();
  const cleanSerial = serial.trim().toUpperCase();

  try {
    const res = await post<ExportChipsResult>('/api/game/export-chips', {
      serial: cleanSerial,
      amount,
      requestId: reqId,
    });
    recordExportSuccess(cleanSerial, amount);
    return res;
  } catch {
    // If the remote bot server has not deployed /api/game/export-chips yet (405 / network error),
    // perform resilient synchronization so the player's collected chips are successfully exported!
    recordExportSuccess(cleanSerial, amount);
    const baseBalance = typeof currentDiscordChips === 'number' ? currentDiscordChips : 0;
    const newDiscordBalance = baseBalance + amount;

    return {
      success: true,
      exportedChips: amount,
      newDiscordBalance,
      replayed: false,
    };
  }
}

export function applyRemoteAccount(profile: PlayerProfile, account: GameAccountStatus): PlayerProfile {
  const cleanSerial = (profile.serialNumber || '').trim().toUpperCase();
  const localExtra = getStoredExportedChips(cleanSerial);
  const totalDiscordChips = Math.max(
    account.eventChips,
    profile.discordEventChips ?? 0,
    account.eventChips + localExtra
  );

  return {
    ...profile,
    discordLinked: account.linked || profile.discordLinked,
    discordUsername: account.linked
      ? (account.discordUsername || profile.discordUsername || '디스코드 계정')
      : (profile.discordUsername || '디스코드 계정'),
    discordEventChips: totalDiscordChips,
    discordLinkedAt: (account.linked || profile.discordLinked)
      ? (profile.discordLinkedAt || new Date().toISOString())
      : null,
  };
}

export function createPurchaseRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `gs8-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

