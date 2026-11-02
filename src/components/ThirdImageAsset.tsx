import React from 'react';
import { GAME_ASSETS } from '../assets/gameAssets';

interface AssetProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

/**
 * 3번 이미지: 이벤트 칩 (Chip)
 */
export const ChipIcon: React.FC<AssetProps> = ({
  className = '',
  size = 24,
  alt = '기반스타즈 이벤트 칩',
}) => {
  return (
    <img
      src={GAME_ASSETS.chip}
      alt={alt}
      style={{ width: size, height: size }}
      className={`inline-block object-contain drop-shadow-[0_2px_0_#000] shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
};

/**
 * 4번 이미지: 메인 로고 및 꾸밈 엠블럼 (Decor Logo)
 */
export const DecorLogo: React.FC<AssetProps> = ({
  className = '',
  size = 32,
  alt = '기반스타즈 Season 8 공식 로고',
}) => {
  return (
    <img
      src={GAME_ASSETS.logo}
      alt={alt}
      style={{ width: size, height: size }}
      className={`inline-block object-contain drop-shadow-[0_3px_0_#000] shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
};

/**
 * ThirdImageAsset: Alias for convenience, defaults to ChipIcon or DecorLogo
 */
export const ThirdImageAsset: React.FC<AssetProps & { type?: 'chip' | 'logo' }> = ({
  type = 'logo',
  ...props
}) => {
  if (type === 'chip') {
    return <ChipIcon {...props} />;
  }
  return <DecorLogo {...props} />;
};
