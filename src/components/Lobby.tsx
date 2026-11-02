import React, { useState } from 'react';
import { Faction, LeaderboardEntry, PlayerProfile } from '../types';
import { GAME_ASSETS } from '../assets/gameAssets';
import { soundEngine } from '../utils/soundEngine';
import { ChipIcon, DecorLogo } from './ThirdImageAsset';

interface LobbyProps {
  profile: PlayerProfile;
  leaderboard: LeaderboardEntry[];
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenChipHistory: () => void;
  onOpenAccount: () => void;
  onOpenTicketShop: () => void;
  onOpenSettings: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  profile,
  leaderboard,
  onStartGame,
  onOpenLeaderboard,
  onOpenChipHistory,
  onOpenAccount,
  onOpenTicketShop,
  onOpenSettings,
}) => {
  const faction: Faction = profile.faction || 'angel';
  const [isHeroSelected, setIsHeroSelected] = useState(false);

  // Calculate rivalry status
  const angelEntries = leaderboard.filter((e) => e.faction === 'angel');
  const devilEntries = leaderboard.filter((e) => e.faction === 'devil');
  const angelTopScore = angelEntries.length > 0 ? Math.max(...angelEntries.map((e) => e.score)) : 0;
  const devilTopScore = devilEntries.length > 0 ? Math.max(...devilEntries.map((e) => e.score)) : 0;
  const hasScores = angelTopScore > 0 || devilTopScore > 0;
  const isAngelLeading = angelTopScore >= devilTopScore;
  const leadDiff = Math.abs(angelTopScore - devilTopScore);

  const handleHeroClick = () => {
    setIsHeroSelected((prev) => !prev);
    soundEngine.playJump(faction);
  };

  const handleStartOrShop = () => {
    if (profile.lives > 0) {
      onStartGame();
    } else {
      onOpenTicketShop();
    }
  };

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center p-2.5 sm:p-4 relative overflow-hidden bg-slate-900 select-none">
      {/* Dynamic Faction Background Theme */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${
          faction === 'angel'
            ? 'bg-gradient-to-b from-sky-300 via-amber-100 to-sky-200'
            : 'bg-gradient-to-b from-purple-950 via-rose-950 to-stone-900'
        }`}
      />

      {/* Decorative subtle texture */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Lobby Main Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md landscape:max-w-lg bg-amber-50 rounded-2xl md:rounded-3xl border-3 md:border-4 border-black p-3.5 sm:p-5 shadow-[6px_6px_0px_#000] flex flex-col justify-between gap-3 text-gray-900 max-h-[96vh] overflow-y-auto">
        {/* Top Bar: Title & Status Badges */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="flex items-center justify-between w-full">
            {/* Lives / Ticket Counter Button */}
            <button
              onClick={onOpenTicketShop}
              className={`px-2.5 py-0.5 rounded-full border border-black font-black text-[11px] flex items-center gap-1 shadow-[1px_1px_0px_#000] cursor-pointer transition-transform active:scale-95 ${
                profile.lives > 0
                  ? 'bg-rose-200 hover:bg-rose-300 text-rose-950'
                  : 'bg-red-500 text-white animate-pulse'
              }`}
            >
              <span>❤️</span>
              <span>{profile.lives > 0 ? `목숨: ${profile.lives}/10` : '목숨 0개 충전!'}</span>
            </button>

            {/* Account / Discord Serial Badge */}
            <button
              onClick={onOpenAccount}
              className={`px-2.5 py-0.5 rounded-full border border-black font-black text-[11px] flex items-center gap-1 shadow-[1px_1px_0px_#000] cursor-pointer ${
                profile.discordLinked && profile.discordUsername
                  ? 'bg-indigo-300 text-indigo-950 hover:bg-indigo-400'
                  : profile.isLinked
                  ? 'bg-emerald-300 text-emerald-950 hover:bg-emerald-400'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span>
                {profile.discordLinked && profile.discordUsername
                  ? `@${profile.discordUsername}`
                  : profile.isLinked
                  ? profile.serialNumber
                  : '디스코드 연동'}
              </span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight drop-shadow-[0_1px_0_#FFF]">
            기반스타즈 Season 8: 도약
          </h1>
        </div>

        {/* Selected Faction Hero Showcase */}
        <div
          onClick={handleHeroClick}
          className={`hero-showcase-container group cursor-pointer rounded-xl sm:rounded-2xl border-2 sm:border-3 border-black p-3 sm:p-4 flex flex-col landscape:flex-row items-center relative overflow-hidden shadow-[3px_3px_0px_#000] transition-all duration-300 ${
            faction === 'angel'
              ? 'bg-gradient-to-b from-sky-100 via-amber-50 to-white hover:ring-3 hover:ring-sky-400'
              : 'bg-gradient-to-b from-rose-100 via-amber-50 to-stone-100 hover:ring-3 hover:ring-rose-500'
          } ${isHeroSelected ? 'ring-4 ring-yellow-400 scale-[1.03]' : ''}`}
        >
          {/* Static Hero Character Icon: Expands on hover/select. Positioned on the LEFT in landscape orientation */}
          <div className="hero-circle-icon relative my-1 landscape:my-0 flex-shrink-0 landscape:mr-4 landscape:order-first">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-black flex items-center justify-center shadow-[3px_3px_0px_#000] relative overflow-hidden transition-all duration-300 group-hover:scale-115 group-hover:shadow-[0_0_16px_rgba(250,204,21,0.7)] ${
                faction === 'angel'
                  ? 'bg-gradient-to-br from-yellow-200 to-sky-200 group-hover:border-yellow-400'
                  : 'bg-gradient-to-br from-orange-400 to-red-600 group-hover:border-rose-400'
              }`}
            >
              <div
                className={`absolute inset-0 rounded-full transition-opacity duration-300 pointer-events-none ${
                  faction === 'angel' ? 'bg-yellow-300/30' : 'bg-rose-500/30'
                } group-hover:opacity-100 opacity-40`}
              />
              <img
                src={faction === 'angel' ? GAME_ASSETS.angelSprite : GAME_ASSETS.devilSprite}
                alt="캐릭터 아이콘"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          </div>

          {/* Details Column: Faction badge, Player Name, Stats Bar */}
          <div className="hero-details-content flex flex-col items-center landscape:items-start w-full flex-1">
            {/* Faction Badge */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full border border-black font-black text-[11px] shadow-[1px_1px_0px_#000] flex items-center gap-1 transition-transform group-hover:scale-105 ${
                  faction === 'angel' ? 'bg-sky-200 text-sky-900' : 'bg-rose-200 text-rose-900'
                }`}
              >
                <img
                  src={faction === 'angel' ? GAME_ASSETS.angelSprite : GAME_ASSETS.devilSprite}
                  alt={faction}
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>{faction === 'angel' ? '천사 진영' : '악마 진영'}</span>
              </span>
            </div>

            {/* Player Name */}
            <div className="text-center landscape:text-left mt-0.5">
              <h2 className="text-base sm:text-lg font-black text-black group-hover:text-amber-700 transition-colors">
                {profile.name}
              </h2>
            </div>

            {/* Stats Bar */}
            <div className="w-full grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white rounded-lg border border-black p-2 flex items-center justify-between shadow-[1px_1px_0px_#000]">
                <div className="flex items-center gap-1.5">
                  <DecorLogo size={16} />
                  <span className="text-[11px] font-bold text-gray-600">내 최고 기록</span>
                </div>
                <span className="text-sm font-black text-black">{profile.highScore}점</span>
              </div>

              <div className="bg-white rounded-lg border border-black p-2 flex items-center justify-between shadow-[1px_1px_0px_#000]">
                <div className="flex items-center gap-1.5">
                  <ChipIcon size={16} />
                  <span className="text-[11px] font-bold text-gray-600">이벤트 칩</span>
                </div>
                <span className="text-sm font-black text-amber-900">{profile.totalChips}개</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rivalry Live Status Ticker */}
        <div
          onClick={onOpenLeaderboard}
          className="bg-white hover:bg-yellow-50 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <DecorLogo size={22} />
            <div>
              <span className="text-[10px] font-bold text-gray-500">대항전 격돌 현황</span>
              <div className="text-xs font-black text-black flex items-center gap-1">
                {!hasScores ? (
                  <span className="text-gray-600 font-bold">기록 대기 중 (0 vs 0)</span>
                ) : (
                  <>
                    <span
                      className={`px-1 py-0.2 rounded border border-black text-[10px] ${
                        isAngelLeading ? 'bg-sky-200 text-sky-800' : 'bg-rose-200 text-rose-800'
                      }`}
                    >
                      {isAngelLeading ? '천사' : '악마'}
                    </span>
                    <span>{leadDiff === 0 ? '동점' : `+${leadDiff}점 우세!`}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg border border-black shadow-[1px_1px_0px_#000]">
            대항전 보기 ▶
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Main Jump Start Button (checks lives!) */}
          <button
            onClick={handleStartOrShop}
            className={`w-full py-3 sm:py-3.5 active:translate-y-0.5 rounded-xl border-3 border-black text-lg sm:text-xl font-black shadow-[4px_4px_0px_#000] cursor-pointer flex items-center justify-center gap-2 transition-transform ${
              profile.lives > 0
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
                : 'bg-rose-400 hover:bg-rose-300 text-white animate-pulse'
            }`}
          >
            <DecorLogo size={22} />
            <span>
              {profile.lives > 0
                ? `도약 시작! (목숨: ${profile.lives}개)`
                : '목숨 부족! 충전하기 ▶'}
            </span>
            <DecorLogo size={22} />
          </button>

          {/* Sub Navigation Buttons (4 buttons: 칩 기록, 목숨 충전, 계정 연동, 설정) */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={onOpenChipHistory}
              className="py-2 px-1 bg-amber-200 hover:bg-amber-300 active:translate-y-0.5 rounded-lg border-2 border-black font-black text-[10px] sm:text-[11px] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1"
            >
              <ChipIcon size={13} />
              <span>칩 기록</span>
            </button>
            <button
              onClick={onOpenTicketShop}
              className="py-2 px-1 bg-rose-200 hover:bg-rose-300 active:translate-y-0.5 rounded-lg border-2 border-black font-black text-[10px] sm:text-[11px] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-0.5 text-rose-950"
            >
              <span>❤️ 충전</span>
            </button>
            <button
              onClick={onOpenAccount}
              className="py-2 px-1 bg-emerald-200 hover:bg-emerald-300 active:translate-y-0.5 rounded-lg border-2 border-black font-black text-[10px] sm:text-[11px] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1"
            >
              <span>계정</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="py-2 px-1 bg-gray-200 hover:bg-gray-300 active:translate-y-0.5 rounded-lg border-2 border-black font-black text-[10px] sm:text-[11px] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1"
            >
              <DecorLogo size={13} />
              <span>설정</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
