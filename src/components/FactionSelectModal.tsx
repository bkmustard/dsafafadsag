import React, { useState } from 'react';
import { Faction, PlayerProfile } from '../types';
import { generateRandomName } from '../utils/nameGenerator';
import { GAME_ASSETS } from '../assets/gameAssets';
import { soundEngine } from '../utils/soundEngine';
import { DecorLogo } from './ThirdImageAsset';

interface FactionSelectModalProps {
  profile: PlayerProfile;
  onSelectFaction: (faction: Faction, name: string) => void;
}

export const FactionSelectModal: React.FC<FactionSelectModalProps> = ({
  profile,
  onSelectFaction,
}) => {
  const [selectedFaction, setSelectedFaction] = useState<Faction>('angel');
  const [playerName, setPlayerName] = useState<string>(profile.name || generateRandomName());
  const [confirmed, setConfirmed] = useState(false);

  const handleRerollName = () => {
    setPlayerName(generateRandomName());
  };

  const handleSelectFactionChoice = (faction: Faction) => {
    setSelectedFaction(faction);
    soundEngine.playJump(faction);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onSelectFaction(selectedFaction, playerName.trim() || '도약하는 스타릿');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-lg bg-amber-50 rounded-2xl border-4 border-black p-4 md:p-6 shadow-[6px_6px_0px_#000] flex flex-col gap-3.5 max-h-[95vh] overflow-y-auto text-gray-900">
        {/* Title Header */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-300 border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000]">
            <DecorLogo size={18} />
            <span>기반스타즈 Season 8: 도약</span>
            <DecorLogo size={18} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-black mt-1">
            진영을 선택하세요!
          </h2>
        </div>

        {/* Character Name Section */}
        <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black flex items-center gap-1.5">
              <DecorLogo size={16} />
              <span>플레이어 닉네임</span>
            </label>
            {!profile.isLinked ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-black">
                게스트 (랜덤 닉네임 전용)
              </span>
            ) : (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-black">
                연동 계정
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                if (profile.isLinked) setPlayerName(e.target.value);
              }}
              readOnly={!profile.isLinked}
              maxLength={16}
              className={`flex-1 px-3 py-1.5 rounded-lg border-2 border-black font-bold text-sm ${
                !profile.isLinked ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-gray-50'
              }`}
              placeholder="닉네임"
            />
            <button
              onClick={handleRerollName}
              className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 active:translate-y-0.5 rounded-lg border-2 border-black font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <DecorLogo size={14} />
              <span>랜덤 생성</span>
            </button>
          </div>
          {!profile.isLinked && (
            <span className="text-[10px] text-gray-500 font-semibold">
              * 일련번호를 연동하지 않은 게스트는 무작위 닉네임으로만 기여할 수 있습니다.
            </span>
          )}
        </div>

        {/* Faction Cards Selection (Icons DO NOT spin; zoom in on hover/selection) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Angel Faction Card */}
          <div
            onClick={() => handleSelectFactionChoice('angel')}
            className={`group cursor-pointer rounded-xl border-3 border-black p-3 flex flex-col items-center gap-2 transition-all duration-300 ${
              selectedFaction === 'angel'
                ? 'bg-gradient-to-b from-sky-100 to-amber-100 ring-4 ring-sky-400 shadow-[4px_4px_0px_#000] scale-[1.04]'
                : 'bg-white hover:bg-sky-50 hover:scale-[1.02] shadow-[2px_2px_0px_#000] opacity-80'
            }`}
          >
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_#000] overflow-hidden transition-transform duration-300 group-hover:scale-110 ${
                selectedFaction === 'angel'
                  ? 'bg-gradient-to-br from-yellow-200 to-sky-200 ring-2 ring-yellow-400'
                  : 'bg-gradient-to-br from-amber-100 to-sky-100'
              }`}
            >
              <img
                src={GAME_ASSETS.angelSprite}
                alt="천사"
                className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-200 border border-black text-sky-900">
                빛의 도약
              </span>
              <h3 className="text-lg md:text-xl font-black text-sky-700 mt-0.5">천사 진영</h3>
            </div>
          </div>

          {/* Devil Faction Card */}
          <div
            onClick={() => handleSelectFactionChoice('devil')}
            className={`group cursor-pointer rounded-xl border-3 border-black p-3 flex flex-col items-center gap-2 transition-all duration-300 ${
              selectedFaction === 'devil'
                ? 'bg-gradient-to-b from-rose-100 to-purple-100 ring-4 ring-rose-500 shadow-[4px_4px_0px_#000] scale-[1.04]'
                : 'bg-white hover:bg-rose-50 hover:scale-[1.02] shadow-[2px_2px_0px_#000] opacity-80'
            }`}
          >
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_#000] overflow-hidden transition-transform duration-300 group-hover:scale-110 ${
                selectedFaction === 'devil'
                  ? 'bg-gradient-to-br from-orange-400 to-red-600 ring-2 ring-rose-400'
                  : 'bg-gradient-to-br from-rose-200 to-orange-200'
              }`}
            >
              <img
                src={GAME_ASSETS.devilSprite}
                alt="악마"
                className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-200 border border-black text-rose-800">
                화염의 도약
              </span>
              <h3 className="text-lg md:text-xl font-black text-rose-700 mt-0.5">악마 진영</h3>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleConfirm}
          disabled={confirmed}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 rounded-xl border-3 border-black text-lg font-black text-black shadow-[4px_4px_0px_#000] cursor-pointer flex items-center justify-center gap-2 transition-transform"
        >
          <DecorLogo size={24} />
          <span>{selectedFaction === 'angel' ? '천사' : '악마'} 진영으로 시작</span>
          <DecorLogo size={24} />
        </button>
      </div>
    </div>
  );
};
