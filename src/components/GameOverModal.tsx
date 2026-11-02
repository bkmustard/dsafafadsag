import React, { useRef } from 'react';
import confetti from 'canvas-confetti';
import { Faction, PlayerProfile } from '../types';
import { calculateEventChips } from '../utils/chipCalculator';
import { GAME_ASSETS } from '../assets/gameAssets';
import { ChipIcon, DecorLogo } from './ThirdImageAsset';

interface GameOverModalProps {
  score: number;
  isNewHigh: boolean;
  profile: PlayerProfile;
  onRetry: () => void;
  onBackToLobby: () => void;
  onOpenTicketShop?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  isNewHigh,
  profile,
  onRetry,
  onBackToLobby,
  onOpenTicketShop,
}) => {
  const resultCardRef = useRef<HTMLDivElement>(null);
  const faction: Faction = profile.faction || 'angel';
  const { chips: chipsEarned, explanation } = calculateEventChips(score);

  // Trigger celebration confetti
  React.useEffect(() => {
    if (score > 5) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: faction === 'angel' ? ['#FDE047', '#38BDF8', '#FFFFFF'] : ['#EF4444', '#F97316', '#7C3AED'],
      });
    }
  }, [score, faction]);

  const handleSaveResultImage = () => {
    // Render high resolution cartoon share card on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 620);
    if (faction === 'angel') {
      bgGrad.addColorStop(0, '#E0F2FE');
      bgGrad.addColorStop(0.5, '#FEF3C7');
      bgGrad.addColorStop(1, '#BAE6FD');
    } else {
      bgGrad.addColorStop(0, '#450A0A');
      bgGrad.addColorStop(0.5, '#7F1D1D');
      bgGrad.addColorStop(1, '#1E1B4B');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 620);

    // Outer card border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(16, 16, 768, 588);

    // Inner Card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(40, 40, 720, 540);
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 720, 540);

    // Header badge
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(80, 65, 640, 55);
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 65, 640, 55);

    ctx.fillStyle = '#000000';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('기반스타즈 Season 8: 도약 공식 결과', 400, 104);

    // Player & Faction info
    ctx.fillStyle = faction === 'angel' ? '#0284C7' : '#DC2626';
    ctx.font = '900 32px sans-serif';
    ctx.fillText(`[${faction === 'angel' ? '천사 진영' : '악마 진영'}] ${profile.name}`, 400, 175);

    // Final Score Big Display
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('최종 점수 (Final Score)', 400, 225);

    ctx.fillStyle = '#000000';
    ctx.font = '900 76px sans-serif';
    ctx.fillText(`${score} 점`, 400, 310);

    // Event Chip Box
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(150, 350, 500, 105);
    ctx.lineWidth = 4;
    ctx.strokeRect(150, 350, 500, 105);

    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('획득한 이벤트 칩', 400, 385);

    ctx.fillStyle = '#B45309';
    ctx.font = '900 42px sans-serif';
    ctx.fillText(`+${chipsEarned} 개 (누적: ${profile.totalChips}개)`, 400, 436);

    // Date & Footer
    ctx.fillStyle = '#4B5563';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`기록 일시: ${new Date().toLocaleString('ko-KR')}`, 400, 500);
    ctx.fillText('기반스타즈 8시즌: 도약', 400, 535);

    // Export image
    const link = document.createElement('a');
    link.download = `gibanstars_s8_result_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyText = () => {
    const text = `[기반스타즈 Season 8: 도약]\n플레이어: ${profile.name} (${faction === 'angel' ? '천사' : '악마'} 진영)\n최종 점수: ${score}점\n획득한 이벤트 칩: +${chipsEarned}개\n공식 도약 기록 저장 완료!`;
    navigator.clipboard.writeText(text);
    alert('결과가 클립보드에 복사되었습니다!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div
        ref={resultCardRef}
        className="w-full max-w-sm sm:max-w-md bg-amber-50 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_#000] flex flex-col gap-3 text-gray-900 max-h-[96vh] overflow-y-auto"
      >
        {/* Title */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-400 border border-black font-black text-[11px] text-white shadow-[1px_1px_0px_#000]">
            <DecorLogo size={14} />
            <span>GAME OVER</span>
            <DecorLogo size={14} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black mt-0.5">도약 종료!</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <img
              src={faction === 'angel' ? GAME_ASSETS.angelSprite : GAME_ASSETS.devilSprite}
              alt={faction}
              className="w-5 h-5 object-contain animate-[spin_8s_linear_infinite]"
            />
            <span
              className={`font-black px-1.5 py-0.2 rounded text-xs border border-black ${
                faction === 'angel' ? 'bg-sky-200 text-sky-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              {faction === 'angel' ? '천사' : '악마'}
            </span>
            <span className="font-bold text-xs text-gray-800 truncate max-w-[150px]">{profile.name}</span>
          </div>
        </div>

        {/* Score & High Score Box */}
        <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col items-center gap-0.5 relative overflow-hidden">
          {isNewHigh && (
            <div className="absolute top-1.5 right-1.5 bg-yellow-300 text-black px-2 py-0.2 rounded-full border border-black font-black text-[10px] shadow-[1px_1px_0px_#000] animate-bounce">
              NEW RECORD!
            </div>
          )}
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
            최종 점수 (FINAL SCORE)
          </span>
          <div className="text-4xl sm:text-5xl font-black text-black tracking-tight my-0.5">
            {score}
            <span className="text-lg ml-1 font-bold">점</span>
          </div>
          <div className="text-[11px] font-bold text-gray-600">
            내 최고 기록: <strong className="text-black font-black">{profile.highScore}점</strong>
          </div>
        </div>

        {/* Event Chips Reward Display */}
        <div className="bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-300 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-950 flex items-center gap-1">
              <ChipIcon size={16} />
              <span>획득한 이벤트 칩</span>
            </span>
            <span className="text-[11px] font-bold text-amber-900">
              보유 총합: {profile.totalChips}개
            </span>
          </div>

          <div className="flex items-center justify-between bg-white/90 rounded-lg border border-black p-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-yellow-400 border border-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
                <ChipIcon size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-amber-900">+{chipsEarned} 개</span>
                <span className="text-[10px] font-bold text-gray-700">{explanation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Result Option Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleSaveResultImage}
            className="py-2 px-2 bg-sky-200 hover:bg-sky-300 active:translate-y-0.5 rounded-lg border-2 border-black font-black text-xs flex items-center justify-center gap-1 shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <DecorLogo size={14} />
            <span>이미지 저장</span>
          </button>
          <button
            onClick={handleCopyText}
            className="py-2 px-2 bg-purple-200 hover:bg-purple-300 active:translate-y-0.5 rounded-lg border-2 border-black font-black text-xs flex items-center justify-center gap-1 shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <DecorLogo size={14} />
            <span>텍스트 복사</span>
          </button>
        </div>

        {/* Lives Status Bar */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-black px-2.5 py-1.5 shadow-[1px_1px_0px_#000]">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">❤️</span>
            <span className="text-xs font-bold text-gray-700">남은 목숨:</span>
            <strong className={`text-xs font-black ${profile.lives > 0 ? 'text-black' : 'text-red-600'}`}>
              {profile.lives} / 10회
            </strong>
          </div>
          {profile.lives <= 0 ? (
            <button
              onClick={onOpenTicketShop}
              className="text-[11px] font-black text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded border border-black cursor-pointer animate-pulse"
            >
              충전하기 ▶
            </button>
          ) : (
            <span className="text-[10px] text-gray-500 font-bold">1시간당 +1 충전</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-0.5">
          <button
            onClick={() => {
              if (profile.lives <= 0 && onOpenTicketShop) {
                onOpenTicketShop();
              } else {
                onRetry();
              }
            }}
            className={`flex-1 py-3 active:translate-y-0.5 rounded-xl border-3 border-black text-base sm:text-lg font-black shadow-[3px_3px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-transform ${
              profile.lives > 0
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
                : 'bg-rose-400 hover:bg-rose-300 text-white animate-pulse'
            }`}
          >
            <DecorLogo size={20} />
            <span>{profile.lives > 0 ? '다시 도약하기' : '목숨 충전하기'}</span>
          </button>
          <button
            onClick={onBackToLobby}
            className="py-3 px-4 bg-gray-200 hover:bg-gray-300 active:translate-y-0.5 rounded-xl border-3 border-black text-sm sm:text-base font-black text-black shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            로비로
          </button>
        </div>
      </div>
    </div>
  );
};
