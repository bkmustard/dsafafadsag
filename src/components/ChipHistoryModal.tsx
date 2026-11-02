import React from 'react';
import { ChipRecord } from '../types';
import { GAME_ASSETS } from '../assets/gameAssets';
import { ChipIcon, DecorLogo } from './ThirdImageAsset';

interface ChipHistoryModalProps {
  totalChips: number;
  history: ChipRecord[];
  onClose: () => void;
  onOpenAccount?: () => void;
}

export const ChipHistoryModal: React.FC<ChipHistoryModalProps> = ({
  totalChips,
  history,
  onClose,
  onOpenAccount,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm sm:max-w-md bg-amber-50 rounded-2xl border-4 border-black p-4 shadow-[6px_6px_0px_#000] flex flex-col gap-3 max-h-[92vh] overflow-y-auto text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <DecorLogo size={26} />
            <div>
              <h2 className="text-xl font-black text-black">이벤트 칩 획득 기록</h2>
              <p className="text-[10px] font-bold text-gray-600">Season 8 도약 누적 보상 내역</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-400 hover:bg-red-500 border-2 border-black font-black text-white flex items-center justify-center shadow-[1px_1px_0px_#000] cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Total Chips Showcase Card */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <ChipIcon size={26} />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
                보유 이벤트 칩
              </span>
              <div className="text-2xl font-black text-black leading-tight">{totalChips} 개</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-black/70">도전 횟수</span>
            <div className="text-base font-black text-black">{history.length}회</div>
          </div>
        </div>

        {/* Quick Export Button */}
        {onOpenAccount && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAccount();
            }}
            className="w-full py-2 px-3 bg-emerald-200 hover:bg-emerald-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5 text-emerald-950 active:translate-y-0.5"
          >
            <ChipIcon size={16} />
            <span>모은 이벤트 칩 디스코드로 내보내기 ▶</span>
          </button>
        )}

        {/* History List */}
        <div className="flex flex-col gap-1.5 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="text-center py-6 text-gray-500 font-bold bg-white rounded-lg border border-dashed border-gray-400 text-xs">
              아직 획득한 이벤트 칩 기록이 없습니다.
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-lg border border-black p-2 flex items-center justify-between shadow-[1px_1px_0px_#000]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded border border-black flex items-center gap-1 ${
                      record.chipsEarned < 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : record.faction === 'angel'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <img
                      src={
                        record.faction === 'angel'
                          ? GAME_ASSETS.angelSprite
                          : GAME_ASSETS.devilSprite
                      }
                      alt={record.faction}
                      className="w-3.5 h-3.5 object-contain"
                    />
                    <span>{record.chipsEarned < 0 ? '전송' : record.faction === 'angel' ? '천사' : '악마'}</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="font-black text-xs text-black">
                      {record.chipsEarned < 0 ? '디스코드 내보내기' : `최종 ${record.score}점`}
                    </span>
                    <span className="text-[9px] text-gray-500">{record.date}</span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border border-black ${
                    record.chipsEarned < 0 ? 'bg-emerald-100' : 'bg-yellow-100'
                  }`}
                >
                  <ChipIcon size={14} />
                  <span
                    className={`font-black text-xs ${
                      record.chipsEarned < 0 ? 'text-emerald-900' : 'text-amber-900'
                    }`}
                  >
                    {record.chipsEarned > 0 ? `+${record.chipsEarned}` : record.chipsEarned} 칩
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 rounded-xl border-2 border-black font-black text-sm shadow-[2px_2px_0px_#000] cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
