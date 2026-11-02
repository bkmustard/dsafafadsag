import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { GAME_ASSETS } from '../assets/gameAssets';
import { soundEngine } from '../utils/soundEngine';
import { ChipIcon, DecorLogo } from './ThirdImageAsset';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ entries, onClose }) => {
  // Cinematic animation state
  const [showCinematic, setShowCinematic] = useState(true);
  const [clashStep, setClashStep] = useState<'rushing' | 'impact' | 'outcome'>('rushing');

  // Compute top scores per faction
  const angelEntries = entries.filter((e) => e.faction === 'angel');
  const devilEntries = entries.filter((e) => e.faction === 'devil');

  const angelTopScore = angelEntries.length > 0 ? Math.max(...angelEntries.map((e) => e.score)) : 0;
  const devilTopScore = devilEntries.length > 0 ? Math.max(...devilEntries.map((e) => e.score)) : 0;

  const hasScores = angelTopScore > 0 || devilTopScore > 0;
  const totalRivalry = Math.max(1, angelTopScore + devilTopScore);
  const angelRatio = hasScores ? Math.round((angelTopScore / totalRivalry) * 100) : 50;
  const devilRatio = 100 - angelRatio;

  const isAngelWinner = angelTopScore >= devilTopScore;
  const leadDiff = Math.abs(angelTopScore - devilTopScore);

  // Cinematic timer orchestration
  useEffect(() => {
    if (!showCinematic) return;

    setClashStep('rushing');

    // Impact collision with cartoon urchin burst & "펑!" sound
    const tImpact = setTimeout(() => {
      setClashStep('impact');
      soundEngine.playPoof(); // 펑! sound
    }, 750);

    // Loser falls down, winner stays
    const tOutcome = setTimeout(() => {
      setClashStep('outcome');
      soundEngine.playFeverStart();
    }, 1350);

    // Automatically transition to leaderboard
    const tEnd = setTimeout(() => {
      setShowCinematic(false);
    }, 3200);

    return () => {
      clearTimeout(tImpact);
      clearTimeout(tOutcome);
      clearTimeout(tEnd);
    };
  }, [showCinematic]);

  const handleSkip = () => {
    setShowCinematic(false);
  };

  return (
    <div
      onClick={showCinematic ? handleSkip : undefined}
      onDoubleClick={handleSkip}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      {/* 1. Dramatic Slam & Fall Cinematic with Cartoon Urchin Effect */}
      {showCinematic ? (
        <div
          onClick={handleSkip}
          className="w-full max-w-xl h-[420px] md:h-[480px] bg-slate-950 rounded-3xl border-4 border-black p-5 shadow-[8px_8px_0px_#000] flex flex-col items-center justify-between relative overflow-hidden cursor-pointer"
        >
          {/* Comic background speed lines */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-950 to-black pointer-events-none" />

          {/* Top Header & Skip Button */}
          <div className="w-full flex items-center justify-between z-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black border-2 border-yellow-400 text-yellow-300 font-black text-xs">
              <DecorLogo size={16} />
              <span>진영 대항전 격돌!</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              스킵 ⏩
            </button>
          </div>

          {/* Clash Arena with Left/Right Rush & Center Crash */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-2">
            {/* 성게 모양의 카툰틱 임팩트 이펙트 (Cartoon Spiky Urchin Blast) */}
            {clashStep !== 'rushing' && (
              <div className="absolute z-25 flex items-center justify-center pointer-events-none animate-ping">
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-[0_0_20px_rgba(250,204,21,0.9)]"
                >
                  <defs>
                    <radialGradient id="urchinGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="35%" stopColor="#FEF08A" />
                      <stop offset="70%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EA580C" />
                    </radialGradient>
                  </defs>
                  {/* Spiky 16-point cartoon blast */}
                  <polygon
                    points="
                      100,10 118,65 170,30 145,82 195,100 145,118 170,170 118,135
                      100,190 82,135 30,170 55,118 5,100 55,82 30,30 82,65
                    "
                    fill="url(#urchinGrad)"
                    stroke="#000000"
                    strokeWidth="5"
                    strokeLinejoin="round"
                  />
                  {/* Inner secondary spiky core */}
                  <polygon
                    points="
                      100,35 112,75 150,55 132,90 165,100 132,110 150,145 112,125
                      100,165 88,125 50,145 68,110 35,100 68,90 50,55 88,75
                    "
                    fill="#FEF9C3"
                    stroke="#000000"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {/* Angel Icon (Starts Left, Moves to Center) */}
            <div
              className={`absolute flex flex-col items-center transition-all duration-700 ease-out z-20 ${
                clashStep === 'rushing'
                  ? 'left-2 translate-x-0'
                  : clashStep === 'impact'
                  ? 'left-1/2 -translate-x-[75px]'
                  : isAngelWinner
                  ? 'left-1/2 -translate-x-1/2 scale-125 transition-transform duration-500'
                  : 'left-1/2 -translate-x-24 translate-y-[500px] rotate-[720deg] opacity-0 transition-all duration-1000 ease-in'
              }`}
            >
              <div
                className={`w-20 h-20 md:w-26 md:h-26 rounded-full border-4 border-black flex items-center justify-center relative shadow-[0_0_20px_rgba(56,189,248,0.8)] ${
                  isAngelWinner && clashStep === 'outcome'
                    ? 'bg-gradient-to-br from-yellow-200 to-sky-300 ring-4 ring-yellow-400 animate-pulse'
                    : 'bg-sky-200'
                }`}
              >
                <img
                  src={GAME_ASSETS.angelSprite}
                  alt="천사"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
              </div>
              <span className="text-xs md:text-sm font-black text-sky-300 drop-shadow-[0_2px_0_#000] mt-1">
                천사: {angelTopScore}점
              </span>
              {isAngelWinner && clashStep === 'outcome' && (
                <span className="px-2 py-0.5 bg-yellow-400 text-black font-black text-[11px] rounded-full border border-black shadow mt-1">
                  승리!
                </span>
              )}
            </div>

            {/* Devil Icon (Starts Right, Moves to Center) */}
            <div
              className={`absolute flex flex-col items-center transition-all duration-700 ease-out z-20 ${
                clashStep === 'rushing'
                  ? 'right-2 translate-x-0'
                  : clashStep === 'impact'
                  ? 'right-1/2 translate-x-[75px]'
                  : !isAngelWinner
                  ? 'left-1/2 -translate-x-1/2 scale-125 transition-transform duration-500'
                  : 'left-1/2 translate-x-24 translate-y-[500px] rotate-[720deg] opacity-0 transition-all duration-1000 ease-in'
              }`}
            >
              <div
                className={`w-20 h-20 md:w-26 md:h-26 rounded-full border-4 border-black flex items-center justify-center relative shadow-[0_0_20px_rgba(239,68,68,0.8)] ${
                  !isAngelWinner && clashStep === 'outcome'
                    ? 'bg-gradient-to-br from-orange-400 to-red-600 ring-4 ring-rose-500 animate-pulse'
                    : 'bg-rose-200'
                }`}
              >
                <img
                  src={GAME_ASSETS.devilSprite}
                  alt="악마"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
              </div>
              <span className="text-xs md:text-sm font-black text-rose-300 drop-shadow-[0_2px_0_#000] mt-1">
                악마: {devilTopScore}점
              </span>
              {!isAngelWinner && clashStep === 'outcome' && (
                <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[11px] rounded-full border border-black shadow mt-1">
                  승리!
                </span>
              )}
            </div>
          </div>

          {/* Outcome Announcement */}
          <div className="w-full flex flex-col items-center gap-1.5 z-20 pb-1">
            <div
              className={`w-full py-2 px-3 rounded-xl border-2 border-black font-black text-center text-xs md:text-sm shadow-[2px_2px_0px_#000] transition-opacity duration-300 ${
                clashStep === 'outcome'
                  ? isAngelWinner
                    ? 'bg-sky-200 text-sky-900 opacity-100'
                    : 'bg-rose-200 text-rose-900 opacity-100'
                  : 'opacity-0'
              }`}
            >
              격돌 결과: <strong>{isAngelWinner ? '천사' : '악마'}</strong> 진영 승리! (+{leadDiff}점 우세)
            </div>
            <span className="text-[10px] text-gray-400 font-bold">
              화면을 두 번 누르면 즉시 스킵됩니다.
            </span>
          </div>
        </div>
      ) : (
        /* 2. Compact Viewport-Optimized Leaderboard View */
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-amber-50 rounded-2xl border-4 border-black p-4 shadow-[6px_6px_0px_#000] flex flex-col gap-3 max-h-[92vh] overflow-y-auto text-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <DecorLogo size={28} />
              <div>
                <h2 className="text-xl font-black text-black leading-tight">
                  글로벌 진영 대항전
                </h2>
                <p className="text-[11px] font-bold text-gray-600">
                  천사 vs 악마 진영 최고 점수 격돌 리더보드
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-red-400 hover:bg-red-500 border-2 border-black font-black text-white flex items-center justify-center shadow-[1px_1px_0px_#000] cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {/* Compact Rivalry Bar */}
          <div className="bg-gradient-to-r from-sky-100 via-yellow-100 to-rose-100 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {/* Angel Score */}
              <div className="flex items-center gap-1.5">
                <img
                  src={GAME_ASSETS.angelSprite}
                  alt="천사"
                  className="w-7 h-7 object-contain"
                />
                <div>
                  <span className="text-[10px] font-bold text-sky-900">천사</span>
                  <div className="text-sm font-black text-sky-700 leading-none">{angelTopScore}점</div>
                </div>
              </div>

              {/* Center Winner Indicator */}
              <div className="text-center">
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full border border-black ${
                    !hasScores
                      ? 'bg-amber-200 text-amber-950'
                      : isAngelWinner
                      ? 'bg-sky-200 text-sky-900'
                      : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {!hasScores
                    ? '기록 대기 중'
                    : leadDiff === 0
                    ? '동점 (격돌 중!)'
                    : `${isAngelWinner ? '천사' : '악마'} +${leadDiff}점 우세!`}
                </span>
              </div>

              {/* Devil Score */}
              <div className="flex items-center gap-1.5 text-right">
                <div>
                  <span className="text-[10px] font-bold text-rose-900">악마</span>
                  <div className="text-sm font-black text-rose-700 leading-none">{devilTopScore}점</div>
                </div>
                <img
                  src={GAME_ASSETS.devilSprite}
                  alt="악마"
                  className="w-7 h-7 object-contain"
                />
              </div>
            </div>

            {/* Tug-of-war Bar */}
            <div className="relative w-full h-5 bg-black rounded-full p-0.5 border border-black overflow-hidden flex">
              <div
                style={{ width: `${angelRatio}%` }}
                className="h-full bg-gradient-to-r from-sky-400 to-amber-300 rounded-l-full transition-all duration-700 flex items-center justify-start px-2 font-black text-[10px] text-black"
              >
                {angelRatio}%
              </div>
              <div
                style={{ width: `${devilRatio}%` }}
                className="h-full bg-gradient-to-r from-orange-400 to-rose-600 rounded-r-full transition-all duration-700 flex items-center justify-end px-2 font-black text-[10px] text-white"
              >
                {devilRatio}%
              </div>
            </div>
          </div>

          {/* Ranking List */}
          <div className="bg-white rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-black text-gray-500 px-2 pb-0.5 border-b border-gray-200">
              <span>순위 / 플레이어</span>
              <span>진영 / 점수 / 칩</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-52 md:max-h-60 overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-gray-500">
                  등록된 랭킹 기록이 없습니다. 게임을 플레이하여 첫 랭커가 되어보세요!
                </div>
              ) : (
                entries.map((item, idx) => {
                const isTop3 = idx < 3;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded-lg border border-black transition-colors ${
                      item.isPlayer
                        ? 'bg-yellow-100 ring-2 ring-yellow-400 font-black'
                        : isTop3
                        ? 'bg-amber-50/70'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded border border-black flex items-center justify-center font-black text-[11px] ${
                          idx === 0
                            ? 'bg-yellow-400 text-black'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1 font-bold text-xs">
                        <span className="truncate max-w-[120px] md:max-w-[160px]">{item.name}</span>
                        {item.isPlayer && (
                          <span className="text-[9px] bg-black text-yellow-300 px-1 rounded font-black">
                            나
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded border border-black flex items-center gap-1 ${
                          item.faction === 'angel'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.faction === 'angel' ? '천사' : '악마'}
                      </span>
                      <span className="font-black text-sm text-black min-w-[38px] text-right">
                        {item.score}점
                      </span>
                      <div className="flex items-center gap-0.5 min-w-[36px] justify-end">
                        <ChipIcon size={14} />
                        <span className="font-black text-[11px] text-amber-700">{item.chips}</span>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCinematic(true)}
              className="py-2 px-3 bg-yellow-200 hover:bg-yellow-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1"
            >
              <DecorLogo size={16} />
              <span>격돌 연출 다시보기</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 rounded-xl border-2 border-black font-black text-sm shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
