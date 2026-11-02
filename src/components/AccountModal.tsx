import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { linkNewAccount, loadProfileBySerial } from '../utils/storage';
import {
  applyRemoteAccount,
  getGameAccount,
  getApiBaseUrl,
  setApiBaseUrl,
  exportEventChips,
  DEFAULT_BOT_API_URL,
} from '../utils/gameApi';
import { soundEngine } from '../utils/soundEngine';
import { DecorLogo, ChipIcon } from './ThirdImageAsset';

interface AccountModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const [inputSerial, setInputSerial] = useState('');
  const [customNameInput, setCustomNameInput] = useState(profile.name);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [checking, setChecking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportAmount, setExportAmount] = useState<number>(profile.totalChips || 0);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());

  const discordLinked = Boolean(profile.discordLinked);
  const discordUsername = profile.discordUsername || '';
  const eventChips = profile.discordEventChips ?? 0;

  // Refresh linkage and authoritative event-chip balance from Discord bot
  const refreshLink = async () => {
    if (!profile.serialNumber) {
      setStatusMsg({ text: '먼저 새 게임 계정 일련번호를 발급해 주세요.', type: 'error' });
      return;
    }

    setChecking(true);
    setStatusMsg(null);
    try {
      const remote = await getGameAccount(profile.serialNumber);
      const updated = applyRemoteAccount(profile, remote);
      onUpdateProfile(updated);
      soundEngine.playScore();

      if (remote.linked) {
        setStatusMsg({
          text: `디스코드 연동 확인 완료! [${remote.discordUsername || '디스코드 계정'}] 님 · 이벤트 칩 ${remote.eventChips.toLocaleString()}개`,
          type: 'success',
        });
      } else {
        setStatusMsg({
          text: '아직 디스코드에서 연동되지 않았어요. 디스코드 채팅창에 !게임연동 ' + profile.serialNumber + ' 명령어를 입력해 주세요.',
          type: 'error',
        });
      }
    } catch (error) {
      setStatusMsg({
        text: error instanceof Error ? error.message : '디스코드 봇 서버와의 통신에 실패했어요. 봇 주소를 확인해 주세요.',
        type: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  // Export collected in-game event chips to Discord bot
  const handleExportChips = async () => {
    if (!profile.serialNumber) {
      setStatusMsg({
        text: '먼저 게임 계정 일련번호를 발급해 주세요.',
        type: 'error',
      });
      return;
    }

    const amount = Number(exportAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatusMsg({ text: '내보낼 칩 수량을 1개 이상 입력해 주세요.', type: 'error' });
      return;
    }

    if (amount > profile.totalChips) {
      setStatusMsg({
        text: `보유한 이벤트 칩(${profile.totalChips.toLocaleString()}개)보다 많은 수량을 내보낼 수 없습니다.`,
        type: 'error',
      });
      return;
    }

    setExporting(true);
    setStatusMsg(null);

    try {
      const res = await exportEventChips(profile.serialNumber, amount, profile.discordEventChips ?? 0);
      const updatedTotalChips = Math.max(0, profile.totalChips - amount);
      const newDiscordChips = res.newDiscordBalance;
      const targetUser = discordUsername || '디스코드 계정';

      const updatedProfile: PlayerProfile = {
        ...profile,
        discordLinked: true,
        discordUsername: targetUser,
        totalChips: updatedTotalChips,
        discordEventChips: newDiscordChips,
        chipHistory: [
          {
            id: `export_${Date.now()}`,
            date: new Date().toLocaleString('ko-KR'),
            faction: profile.faction || 'angel',
            score: 0,
            chipsEarned: -amount,
          },
          ...profile.chipHistory,
        ],
      };

      onUpdateProfile(updatedProfile);
      setExportAmount(Math.min(1, updatedTotalChips));
      soundEngine.playScore();
      setStatusMsg({
        text: `🎉 이벤트 칩 ${amount.toLocaleString()}개를 디스코드(@${targetUser})로 성공적으로 내보냈습니다! 디스코드 이벤트 칩 잔액: ${newDiscordChips.toLocaleString()}개`,
        type: 'success',
      });
    } catch (error) {
      setStatusMsg({
        text: error instanceof Error ? error.message : '이벤트 칩 내보내기에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setExporting(false);
    }
  };


  // Generate new serial
  const handleGenerateSerial = () => {
    const updated = linkNewAccount(profile, customNameInput);
    const resetDiscord = {
      ...updated,
      discordLinked: false,
      discordUsername: null,
      discordEventChips: 0,
    };
    onUpdateProfile(resetDiscord);
    soundEngine.playScore();
    setStatusMsg({
      text: `게임 계정 일련번호 [${updated.serialNumber}]를 발급했어요. 디스코드에서 !게임연동 ${updated.serialNumber} 를 입력하세요.`,
      type: 'success',
    });
  };

  // Load account
  const handleLoadAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSerial.trim()) return;

    const loaded = loadProfileBySerial(inputSerial.trim());
    if (!loaded) {
      setStatusMsg({ text: '이 브라우저에 저장된 해당 일련번호의 계정을 찾지 못했어요.', type: 'error' });
      return;
    }
    onUpdateProfile(loaded);
    setCustomNameInput(loaded.name);
    soundEngine.playScore();
    setStatusMsg({ text: `계정 [${loaded.serialNumber}]을 성공적으로 불러왔어요!`, type: 'success' });
  };

  // Save nickname
  const handleSaveNickname = () => {
    const trimmed = customNameInput.trim();
    if (!profile.isLinked || !trimmed) return;
    onUpdateProfile({ ...profile, name: trimmed });
    setStatusMsg({ text: '게임 닉네임을 변경했어요.', type: 'success' });
  };

  // Copy serial
  const handleCopySerial = async () => {
    if (!profile.serialNumber) return;
    try {
      await navigator.clipboard.writeText(profile.serialNumber);
      setStatusMsg({ text: '일련번호를 복사했어요! 디스코드에서 !게임연동 명령어로 등록해 주세요.', type: 'success' });
    } catch {
      setStatusMsg({ text: `일련번호: ${profile.serialNumber}`, type: 'success' });
    }
  };

  // Save custom bot API URL
  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrlInput.trim());
    setStatusMsg({ text: '디스코드 봇 API 서버 주소가 저장되었습니다.', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-amber-50 rounded-2xl border-4 border-black p-4 md:p-5 shadow-[6px_6px_0px_#000] flex flex-col gap-3 max-h-[92vh] overflow-y-auto text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <DecorLogo size={26} />
            <h2 className="text-xl font-black text-black">게임 계정 & 디스코드 연동</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-400 hover:bg-red-500 border-2 border-black font-black text-white flex items-center justify-center shadow-[1px_1px_0px_#000] cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* 1. DISCORD EVENT CHIP SECTION (Authoritative Bot Balance) */}
        <div className="bg-gradient-to-r from-indigo-100 via-indigo-50 to-purple-100 rounded-xl border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black flex items-center gap-1.5 text-indigo-950">
              <span className={`w-2.5 h-2.5 rounded-full ${discordLinked ? 'bg-emerald-500' : 'bg-indigo-600'} animate-pulse`} />
              <span>디스코드 봇 이벤트 칩 연동</span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-black ${
                discordLinked ? 'bg-emerald-300 text-emerald-950' : 'bg-amber-200 text-amber-950'
              }`}
            >
              {discordLinked ? '연동 완료' : '미연동'}
            </span>
          </div>

          {discordLinked ? (
            <div className="bg-white/90 rounded-lg border-2 border-black p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 block">연동된 디스코드 사용자</span>
                  <div className="text-sm font-black text-indigo-950">
                    @{discordUsername || '디스코드 계정'}
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 border border-emerald-400 text-emerald-900">
                  봇 DB 확인됨
                </span>
              </div>

              <div className="bg-amber-100 rounded-lg border border-black p-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ChipIcon size={18} />
                  <span className="text-xs font-black text-amber-950">디스코드 이벤트 칩 잔액</span>
                </div>
                <span className="text-base font-black text-amber-900">
                  {eventChips.toLocaleString()}개
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-gray-700 font-bold leading-relaxed">
              게임에서 일련번호를 발급한 뒤 디스코드 서버에서 명령어를 입력하면 봇과 바로 연동됩니다. <strong>디스코드 봇 DB의 이벤트 칩 잔액이 정확히 연동</strong>되며 임의로 늘어나지 않습니다.
            </p>
          )}

          <button
            type="button"
            onClick={() => void refreshLink()}
            disabled={checking || !profile.serialNumber}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg border-2 border-black font-black text-xs shadow-[1px_1px_0px_#000] cursor-pointer"
          >
            {checking ? '봇 서버 확인 중…' : '디스코드 연동 상태 / 잔액 새로고침'}
          </button>
        </div>

        {/* 2. EXPORT EVENT CHIPS TO DISCORD */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 rounded-xl border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black flex items-center gap-1.5 text-emerald-950">
              <ChipIcon size={18} />
              <span>모은 이벤트 칩 디스코드로 내보내기</span>
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-200 border border-black text-amber-950">
              게임 보유: {profile.totalChips.toLocaleString()}개
            </span>
          </div>

          <p className="text-[11px] text-gray-700 font-bold leading-relaxed">
            게임 플레이로 모은 이벤트 칩을 연동된 디스코드 봇 계정으로 내보냅니다. 전송 시 디스코드 봇 DB의 이벤트 칩 잔액에 합산됩니다.
          </p>

          <div className="flex flex-col gap-2 bg-white/90 rounded-lg border border-black p-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>내보낼 칩 수량 (최대 {profile.totalChips.toLocaleString()}개)</span>
              <button
                type="button"
                onClick={() => setExportAmount(profile.totalChips)}
                className="text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded border border-emerald-400 cursor-pointer"
              >
                전액 선택
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                max={profile.totalChips}
                value={exportAmount}
                onChange={(e) => setExportAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg border-2 border-black font-black text-xs"
              />
              <button
                type="button"
                onClick={() => void handleExportChips()}
                disabled={exporting || profile.totalChips <= 0 || exportAmount <= 0 || exportAmount > profile.totalChips}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg border-2 border-black font-black text-xs shadow-[1px_1px_0px_#000] cursor-pointer whitespace-nowrap"
              >
                {exporting ? '내보내는 중…' : '디스코드로 내보내기'}
              </button>
            </div>

            {profile.totalChips <= 0 && (
              <span className="text-[10px] text-rose-600 font-bold">
                * 현재 게임에서 모은 이벤트 칩이 없습니다. 게임을 플레이하여 칩을 모아보세요!
              </span>
            )}

            {!discordLinked && (
              <span className="text-[10px] text-indigo-700 font-bold">
                💡 디스코드 서버에서 <code>!게임연동 {profile.serialNumber}</code> 를 입력하시면 봇 명령어(!잔액)에서도 즉시 확인됩니다.
              </span>
            )}
          </div>
        </div>

        {/* 3. SERIAL NUMBER & DISCORD INSTRUCTION */}
        <div className="bg-white rounded-xl border-2 border-black p-3.5 flex flex-col gap-2.5 shadow-[2px_2px_0px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black">게임 계정 고유 일련번호</span>
            {profile.isLinked && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-black">
                저장됨
              </span>
            )}
          </div>

          {profile.isLinked && profile.serialNumber ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-amber-50 rounded-lg border border-black p-2">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">일련번호</span>
                  <div className="font-mono font-black text-sm text-emerald-900 tracking-wider">
                    {profile.serialNumber}
                  </div>
                </div>
                <button
                  onClick={() => void handleCopySerial()}
                  className="px-2.5 py-1 bg-emerald-300 hover:bg-emerald-400 rounded border border-black font-black text-xs shadow-[1px_1px_0px_#000] cursor-pointer"
                >
                  복사
                </button>
              </div>

              <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-2 text-[11px] font-bold text-indigo-950 leading-relaxed">
                디스코드 서버에서 다음 명령어를 입력하세요:
                <br />
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-900 block mt-1 font-bold">
                  !게임연동 {profile.serialNumber}
                </code>
              </div>

              <div className="flex flex-col gap-1 mt-0.5">
                <label className="text-[11px] font-bold text-gray-700">게임 닉네임 변경</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    maxLength={16}
                    className="flex-1 px-3 py-1 bg-gray-50 rounded-lg border-2 border-black font-bold text-xs"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 rounded-lg border-2 border-black font-black text-xs shadow-[1px_1px_0px_#000] cursor-pointer"
                  >
                    변경
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                일련번호를 발급하면 이 게임 계정을 디스코드 봇 계정에 연결할 수 있어요.
              </p>
              <button
                onClick={handleGenerateSerial}
                className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 rounded-lg border-2 border-black font-black text-xs shadow-[1px_1px_0px_#000] cursor-pointer"
              >
                새 게임 계정 일련번호 발급
              </button>
            </div>
          )}
        </div>

        {/* 4. LOAD EXISTING ACCOUNT */}
        <div className="bg-amber-100/60 rounded-xl border-2 border-black p-3 flex flex-col gap-1.5 shadow-[2px_2px_0px_#000]">
          <span className="text-xs font-black text-black">이 브라우저의 기존 계정 불러오기</span>
          <form onSubmit={handleLoadAccount} className="flex gap-2">
            <input
              type="text"
              placeholder="예: GS8-일련번호"
              value={inputSerial}
              onChange={(e) => setInputSerial(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white rounded-lg border-2 border-black font-mono font-bold text-xs"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 rounded-lg border-2 border-black font-black text-xs shadow-[1px_1px_0px_#000] cursor-pointer whitespace-nowrap"
            >
              불러오기
            </button>
          </form>
        </div>

        {/* 5. DISCORD BOT API SERVER URL CONFIGURATION */}
        <div className="bg-slate-100 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowApiSettings((prev) => !prev)}
            className="flex items-center justify-between text-xs font-black text-gray-700 cursor-pointer"
          >
            <span>⚙️ 디스코드 봇 서버 주소 설정 ({apiUrlInput === DEFAULT_BOT_API_URL ? '기본값 연결됨' : '사용자 설정'})</span>
            <span>{showApiSettings ? '▲ 접기' : '▼ 설정'}</span>
          </button>

          {showApiSettings && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-300">
              <span className="text-[10px] text-gray-600 font-bold">
                기본 주소(<code>{DEFAULT_BOT_API_URL}</code>)로 자동 설정되어 있어 따로 입력하지 않아도 바로 연동됩니다.
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder={DEFAULT_BOT_API_URL}
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-white rounded border border-black font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="px-2.5 py-1 bg-sky-300 hover:bg-sky-400 rounded border border-black font-black text-[11px] cursor-pointer"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApiUrlInput(DEFAULT_BOT_API_URL);
                    setApiBaseUrl(DEFAULT_BOT_API_URL);
                    setStatusMsg({ text: `기본 주소(${DEFAULT_BOT_API_URL})로 설정되었습니다.`, type: 'success' });
                  }}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded border border-black font-black text-[11px] cursor-pointer"
                >
                  기본값
                </button>
              </div>
            </div>
          )}
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
