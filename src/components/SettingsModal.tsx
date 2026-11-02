import React, { useState } from 'react';
import { Faction, GameSettings, PlayerProfile } from '../types';
import { GAME_ASSETS } from '../assets/gameAssets';
import { clearAllLeaderboard } from '../utils/storage';
import { ChipIcon, DecorLogo } from './ThirdImageAsset';

interface SettingsModalProps {
  settings: GameSettings;
  profile: PlayerProfile;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
  onClose: () => void;
  onClearLeaderboard?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  profile,
  onUpdateSettings,
  onUpdateProfile,
  onClose,
  onClearLeaderboard,
}) => {
  const [devCodeInput, setDevCodeInput] = useState('');
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devMessage, setDevMessage] = useState('');

  const handleDevCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (devCodeInput.trim() === 'gae03') {
      setDevUnlocked(true);
      setDevMessage('인증 완료! 진영 관리 메뉴가 활성화되었습니다.');
    } else {
      setDevMessage('일치하는 코드가 없습니다.');
    }
  };

  const handleSwitchFaction = (newFaction: Faction) => {
    onUpdateProfile({
      ...profile,
      faction: newFaction,
    });
    setDevMessage(`진영이 [${newFaction === 'angel' ? '천사' : '악마'}] (으)로 변경되었습니다.`);
  };

  const handleResetFactionSelection = () => {
    onUpdateProfile({
      ...profile,
      faction: null,
    });
    onClose();
  };

  const handleResetRecords = () => {
    if (window.confirm('정말 모든 개인 점수 및 칩 기록을 초기화하시겠습니까?')) {
      onUpdateProfile({
        ...profile,
        highScore: 0,
        totalChips: 0,
        gamesPlayed: 0,
        chipHistory: [],
      });
      setDevMessage('기록이 초기화되었습니다.');
    }
  };

  const handleAddTestChips = () => {
    onUpdateProfile({
      ...profile,
      totalChips: profile.totalChips + 50,
      chipHistory: [
        {
          id: Date.now().toString(),
          date: new Date().toLocaleString('ko-KR'),
          faction: profile.faction || 'angel',
          score: 100,
          chipsEarned: 50,
        },
        ...profile.chipHistory,
      ],
    });
    setDevMessage('보너스 +50 칩이 지급되었습니다!');
  };

  const handleClearAllLeaderboard = () => {
    if (window.confirm('정말 대항전 전체 랭킹 기록을 일괄 삭제하시겠습니까?')) {
      clearAllLeaderboard();
      if (onClearLeaderboard) {
        onClearLeaderboard();
      }
      setDevMessage('모든 랭킹 기록이 일괄 삭제되었습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-amber-50 rounded-3xl border-4 border-black p-6 shadow-[8px_8px_0px_#000] flex flex-col gap-5 max-h-[90vh] overflow-y-auto text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <DecorLogo size={32} />
            <h2 className="text-2xl font-black text-black">설정</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-red-400 hover:bg-red-500 border-2 border-black font-black text-white flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Audio Volume Controls */}
        <div className="bg-white rounded-2xl border-3 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col gap-4">
          <h3 className="text-base font-black flex items-center gap-2 text-black">
            <DecorLogo size={20} />
            <span>볼륨 조절</span>
          </h3>

          {/* Mute Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">전체 음소거</span>
            <button
              onClick={() => onUpdateSettings({ ...settings, isMuted: !settings.isMuted })}
              className={`px-4 py-1.5 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer transition-colors ${
                settings.isMuted ? 'bg-red-400 text-white' : 'bg-green-400 text-black'
              }`}
            >
              {settings.isMuted ? '음소거 ON' : '소리 켜짐'}
            </button>
          </div>

          {/* BGM Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <span>배경음악</span>
              <span>{Math.round(settings.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.bgmVolume}
              onChange={(e) =>
                onUpdateSettings({ ...settings, bgmVolume: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer h-2 bg-gray-200 rounded-lg border border-black"
            />
          </div>

          {/* SFX Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <span>효과음</span>
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) =>
                onUpdateSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer h-2 bg-gray-200 rounded-lg border border-black"
            />
          </div>
        </div>

        {/* Secret / Management Code Section (Clean, no spoilery developer code text) */}
        <div className="bg-amber-100/70 rounded-2xl border-3 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black flex items-center gap-2 text-black">
              <DecorLogo size={20} />
              <span>진영 관리</span>
            </h3>
            {profile.faction && (
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full border-2 border-black flex items-center gap-1.5 ${
                  profile.faction === 'angel'
                    ? 'bg-sky-200 text-sky-800'
                    : 'bg-rose-200 text-rose-800'
                }`}
              >
                <img
                  src={
                    profile.faction === 'angel'
                      ? GAME_ASSETS.angelSprite
                      : GAME_ASSETS.devilSprite
                  }
                  alt={profile.faction}
                  className="w-4 h-4 object-contain"
                />
                <span>현재: {profile.faction === 'angel' ? '천사 진영' : '악마 진영'}</span>
              </span>
            )}
          </div>

          {!devUnlocked ? (
            <form onSubmit={handleDevCodeSubmit} className="flex gap-2">
              <input
                type="password"
                placeholder="코드 입력"
                value={devCodeInput}
                onChange={(e) => setDevCodeInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-white rounded-xl border-2 border-black font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 active:translate-y-0.5 rounded-xl border-2 border-black font-black text-sm shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                확인
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 p-3 bg-white rounded-xl border-2 border-black">
              <div className="text-xs font-black text-green-700 flex items-center gap-1.5">
                <DecorLogo size={18} />
                <span>진영 관리 기능 활성화됨</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSwitchFaction('angel')}
                  className="py-2.5 px-3 bg-sky-200 hover:bg-sky-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <img src={GAME_ASSETS.angelSprite} alt="천사" className="w-5 h-5 object-contain" />
                  <span>천사 진영으로 전환</span>
                </button>
                <button
                  onClick={() => handleSwitchFaction('devil')}
                  className="py-2.5 px-3 bg-rose-200 hover:bg-rose-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <img src={GAME_ASSETS.devilSprite} alt="악마" className="w-5 h-5 object-contain" />
                  <span>악마 진영으로 전환</span>
                </button>
                <button
                  onClick={handleResetFactionSelection}
                  className="py-2.5 px-3 bg-amber-200 hover:bg-amber-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  진영 선택 재설정
                </button>
                <button
                  onClick={handleAddTestChips}
                  className="py-2.5 px-3 bg-purple-200 hover:bg-purple-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ChipIcon size={18} />
                  <span>보너스 칩 +50</span>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResetRecords}
                  className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  개인 기록 리셋
                </button>
                <button
                  onClick={handleClearAllLeaderboard}
                  className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🗑️</span>
                  <span>랭킹 일괄삭제</span>
                </button>
              </div>
            </div>
          )}

          {devMessage && (
            <div className="text-xs font-black text-blue-700 bg-blue-50 p-2 rounded-lg border border-black">
              {devMessage}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 rounded-2xl border-3 border-black font-black text-base shadow-[4px_4px_0px_#000] cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
