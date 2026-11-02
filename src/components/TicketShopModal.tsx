import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { syncRechargeLives } from '../utils/storage';
import { redeemGameCoupon } from '../utils/gameApi';
import { soundEngine } from '../utils/soundEngine';
import { ChipIcon, DecorLogo } from './ThirdImageAsset';

interface TicketShopModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
  onClose: () => void;
  onOpenAccount?: () => void;
}

export const TicketShopModal: React.FC<TicketShopModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  onOpenAccount,
}) => {
  const [ticketInput, setTicketInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [secondsUntilNext, setSecondsUntilNext] = useState(3600);
  const [busy, setBusy] = useState(false);

  const discordLinked = Boolean(profile.discordLinked);
  const discordUsername = profile.discordUsername || '디스코드 계정';
  const eventChips = profile.discordEventChips ?? 0;

  // Sync lives and update countdown
  useEffect(() => {
    const updateCountdown = () => {
      const { profile: synced, msUntilNextRecharge } = syncRechargeLives(profile);
      if (synced.lives !== profile.lives) {
        onUpdateProfile(synced);
      }
      setSecondsUntilNext(Math.floor(msUntilNextRecharge / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profile, onUpdateProfile]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}분 ${String(s).padStart(2, '0')}초`;
  };

  // Redeem Discord Coupon (from bot command !게임쿠폰발급)
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    if (!profile.serialNumber || !discordLinked) {
      setStatusMsg({ text: '먼저 계정 창에서 일련번호를 발급하고 디스코드 봇과 연동해 주세요.', type: 'error' });
      return;
    }

    setBusy(true);
    setStatusMsg(null);
    try {
      const code = ticketInput.trim().toUpperCase();
      const result = await redeemGameCoupon(profile.serialNumber, code);
      const marker = `COUPON:${code}`;
      const alreadyApplied = profile.usedTicketCodes.includes(marker);

      const updated: PlayerProfile = alreadyApplied
        ? profile
        : {
            ...profile,
            lives: profile.lives + result.lives,
            usedTicketCodes: [...profile.usedTicketCodes, marker],
          };

      onUpdateProfile(updated);
      soundEngine.playFeverStart();
      setTicketInput('');
      setStatusMsg({
        text: alreadyApplied
          ? '이미 이 게임 계정에 반영된 쿠폰이에요.'
          : `디스코드 쿠폰 등록 완료! 목숨 +${result.lives}개가 지급되었습니다. (1회 전용)`,
        type: 'success',
      });
    } catch (error) {
      setStatusMsg({
        text: error instanceof Error ? error.message : '쿠폰 등록에 실패했어요.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-amber-50 rounded-2xl border-4 border-black p-4 md:p-5 shadow-[6px_6px_0px_#000] flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <DecorLogo size={26} />
            <h2 className="text-xl font-black text-black">목숨 및 디스코드 티켓</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-400 hover:bg-red-500 border-2 border-black font-black text-white flex items-center justify-center shadow-[1px_1px_0px_#000] cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Current Lives & 1-Hour Recharge Timer */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-lg bg-white border-2 border-black flex items-center justify-center text-2xl shadow-[1px_1px_0px_#000]">
              ❤️
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-950 uppercase">현재 남은 목숨</span>
              <div className="text-2xl font-black text-black leading-tight">
                {profile.lives} <span className="text-sm font-bold">/ 10회</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-black/70">
              {profile.lives >= 10 ? '충전 완료' : '다음 충전까지'}
            </span>
            <div className="text-xs font-black text-amber-950">
              {profile.lives >= 10 ? '최대치 보유' : formatTime(secondsUntilNext)}
            </div>
            <span className="text-[9px] text-black/60 block">1시간당 1개 자동 충전</span>
          </div>
        </div>

        {/* Discord Event Chips & Life Ticket Purchase (Bot Authoritative) */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black flex items-center gap-1.5 text-indigo-950">
              <ChipIcon size={16} />
              <span>디스코드 봇 이벤트 칩</span>
            </span>
            <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-black">
              보유: {eventChips.toLocaleString()}개
            </span>
          </div>

          <p className="text-[11px] text-gray-700 font-bold leading-relaxed">
            이 잔액은 디스코드 봇의 이벤트 칩과 실시간으로 연결됩니다. 기존 게임 칩이나 일반 디스코드 칩은 사용되지 않습니다.
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-indigo-200">
            <span className="text-[10px] text-indigo-800 font-bold">
              {discordLinked ? `연동된 디스코드: @${discordUsername}` : '디스코드 미연동 상태'}
            </span>
            {onOpenAccount && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccount();
                }}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-900 underline cursor-pointer"
              >
                계정 연동 ▶
              </button>
            )}
          </div>

          {/* In-game purchase removed: purchases happen exclusively inside Discord */}
          <div className="bg-amber-100/90 rounded-lg border-2 border-amber-300 p-2.5 text-[11px] text-amber-950 font-bold leading-snug">
            💡 이벤트 칩을 사용한 목숨 티켓 구매는 <strong>디스코드 봇 채널 내에서만 가능</strong>합니다. 디스코드에서 발급받은 쿠폰 번호를 아래에 등록해 주세요.
          </div>
        </div>

        {/* Discord Admin Issued Coupon Redemption (1-time only!) */}
        <div className="bg-indigo-50/80 rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <DecorLogo size={16} />
              <span>디스코드 발급 쿠폰 등록</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-700">쿠폰당 목숨 +5 (1회 전용)</span>
          </div>

          <p className="text-[11px] text-gray-600 font-bold leading-tight">
            총괄이 디스코드 봇으로 발급한 본인 전용 쿠폰 번호를 입력하세요. 쿠폰은 한 번만 사용할 수 있습니다.
          </p>

          <form onSubmit={handleRedeem} className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="예: GS8-XXXXXXXXXX"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white rounded-lg border-2 border-black font-mono font-bold text-xs uppercase placeholder:normal-case"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg border-2 border-black font-black text-xs shadow-[1px_1px_0px_#000] cursor-pointer"
            >
              등록
            </button>
          </form>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`text-xs font-black p-2.5 rounded-lg border-2 border-black ${
              statusMsg.type === 'success'
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-rose-100 text-rose-900'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Free play limit info */}
        <div className="text-[10px] text-gray-500 font-bold text-center">
          * 매일 10판이 무료로 제공되며, 소모 시 1시간마다 1개씩 자동 충전됩니다.
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 rounded-xl border-2 border-black font-black text-sm shadow-[2px_2px_0px_#000] cursor-pointer"
        >
          확인
        </button>
      </div>
    </div>
  );
};
