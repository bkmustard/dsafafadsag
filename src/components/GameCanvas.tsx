import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Faction, ObstaclePair, Particle } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { GAME_ASSETS } from '../assets/gameAssets';
import { DecorLogo } from './ThirdImageAsset';

interface GameCanvasProps {
  faction: Faction;
  highScore: number;
  onGameOver: (finalScore: number) => void;
  onBackToLobby: () => void;
}

// Faction Trail Color Palettes: Gold/Yellow for Angels, Crimson/Purple for Demons
const ANGEL_TRAIL_COLORS = ['#FEF08A', '#FDE047', '#FACC15', '#F59E0B', '#FFFBEB'];
const DEVIL_TRAIL_COLORS = ['#EF4444', '#DC2626', '#991B1B', '#C084FC', '#A855F7', '#7C3AED'];

export const GameCanvas: React.FC<GameCanvasProps> = ({
  faction,
  highScore,
  onGameOver,
  onBackToLobby,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Logical Game Dimensions
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;

  // React state for HUD
  const [hudScore, setHudScore] = useState(0);
  const [feverGauge, setFeverGauge] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [feverSecondsLeft, setFeverSecondsLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [difficultyTier, setDifficultyTier] = useState(1);
  const [speedUpAlert, setSpeedUpAlert] = useState<string | null>(null);

  // Refs for callbacks & paused flag to prevent loop resetting on state change
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Preloaded Images
  const angelImgRef = useRef<HTMLImageElement | null>(null);
  const devilImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const aImg = new Image();
    aImg.src = GAME_ASSETS.angelSprite;
    angelImgRef.current = aImg;

    const dImg = new Image();
    dImg.src = GAME_ASSETS.devilSprite;
    devilImgRef.current = dImg;
  }, []);

  // References for the loop
  const gameStateRef = useRef({
    isRunning: true,
    isOver: false,
    score: 0,
    feverEnergy: 0,
    isFeverActive: false,
    feverTimeLeft: 0,
    feverTotalDuration: 360,
    tier: 1,
    screenShake: 0,
    player: {
      x: 150,
      y: 280,
      vy: 0,
      radius: 23,
      rotation: 0,
    },
    obstacles: [] as ObstaclePair[],
    particles: [] as Particle[],
    trailingParticles: [] as Particle[],
    feverParticles: [] as Particle[],
    bgScroll: 0,
    frameCount: 0,
  });

  // Jump
  const jump = useCallback(() => {
    const s = gameStateRef.current;
    if (s.isOver || !s.isRunning) return;

    s.player.vy = -4.6;
    soundEngine.playJump(faction);

    // Jump burst trailing particles
    const trailColors = faction === 'angel' ? ANGEL_TRAIL_COLORS : DEVIL_TRAIL_COLORS;
    for (let i = 0; i < 7; i++) {
      const color = trailColors[Math.floor(Math.random() * trailColors.length)];
      s.trailingParticles.push({
        x: s.player.x - 12,
        y: s.player.y + 8,
        vx: -Math.random() * 3 - 2,
        vy: (Math.random() - 0.5) * 3 + 1,
        size: Math.random() * 7 + 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 24,
        type: faction === 'angel' ? 'sparkle' : 'flame',
      });
    }
  }, [faction]);

  // Handle keyboard & touch inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Start BGM on mount and cleanup
  useEffect(() => {
    soundEngine.startBgm(faction, isFever);
    return () => {
      soundEngine.stopBgm();
    };
  }, [faction, isFever]);

  // Main Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset initial game state
    const s = gameStateRef.current;
    s.isRunning = true;
    s.isOver = false;
    s.score = 0;
    s.feverEnergy = 0;
    s.isFeverActive = false;
    s.feverTimeLeft = 0;
    s.feverTotalDuration = 360;
    s.tier = 1;
    s.screenShake = 0;
    s.player.y = 280;
    s.player.vy = 0;
    s.player.rotation = 0;
    s.obstacles = [];
    s.particles = [];
    s.trailingParticles = [];
    s.feverParticles = [];
    s.frameCount = 0;

    function getDynamicGap(currentScore: number, isFeverActive: boolean): number {
      if (isFeverActive) return 260;
      const narrowAmount = Math.min(55, Math.floor(currentScore / 5) * 5);
      return Math.max(175, 230 - narrowAmount);
    }

    function createObstaclePair(x: number): ObstaclePair {
      const minHeight = 65;
      const gap = getDynamicGap(s.score, s.isFeverActive);
      const available = GAME_HEIGHT - gap - minHeight * 2;
      const topHeight = minHeight + Math.floor(Math.random() * available);
      const bottomHeight = GAME_HEIGHT - gap - topHeight;

      return {
        x,
        width: 72,
        topHeight,
        bottomHeight,
        gap,
        passed: false,
        topType: Math.floor(Math.random() * 3),
        bottomType: Math.floor(Math.random() * 3),
        topDestroyed: false,
        bottomDestroyed: false,
      };
    }

    s.obstacles.push(createObstaclePair(850));
    s.obstacles.push(createObstaclePair(1220));

    function smashObstacle(ox: number, oy: number, oWidth: number, oHeight: number) {
      soundEngine.playPoof();
      s.screenShake = 12;

      const chunkCount = 10;
      for (let i = 0; i < chunkCount; i++) {
        s.particles.push({
          x: ox + Math.random() * oWidth,
          y: oy + Math.random() * oHeight,
          vx: (Math.random() - 0.5) * 10 - 2,
          vy: (Math.random() - 0.5) * 10,
          size: Math.random() * 14 + 8,
          color: faction === 'angel' ? '#BAE6FD' : '#DC2626',
          alpha: 1,
          life: 0,
          maxLife: 35,
          type: 'debris',
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.4,
        });
      }

      for (let i = 0; i < 6; i++) {
        s.particles.push({
          x: ox + oWidth / 2,
          y: oy + oHeight / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 12 + 6,
          color: '#FEF08A',
          alpha: 1,
          life: 0,
          maxLife: 25,
          type: 'sparkle',
        });
      }
    }

    const loop = () => {
      if (!isPausedRef.current && s.isRunning) {
        s.frameCount++;
        updateGame();
      }
      renderGame(ctx);
      animId = requestAnimationFrame(loop);
    };

    const updateGame = () => {
      // Screen shake decay
      if (s.screenShake > 0) {
        s.screenShake *= 0.85;
        if (s.screenShake < 0.5) s.screenShake = 0;
      }

      // 1. Fever countdown & termination
      if (s.isFeverActive) {
        s.feverTimeLeft--;
        const sec = Math.max(0, s.feverTimeLeft / 60);
        setFeverSecondsLeft(Math.ceil(sec));

        // Spawn full-screen fever particles each frame
        for (let i = 0; i < 3; i++) {
          s.feverParticles.push({
            x: GAME_WIDTH + Math.random() * 60,
            y: Math.random() * GAME_HEIGHT,
            vx: -Math.random() * 14 - 8,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 16 + 6,
            color:
              faction === 'angel'
                ? Math.random() > 0.5
                  ? '#FEF08A'
                  : '#38BDF8'
                : Math.random() > 0.5
                ? '#EF4444'
                : '#A855F7',
            alpha: 1,
            life: 0,
            maxLife: 45,
            type: faction === 'angel' ? 'sparkle' : 'flame',
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.2,
          });
        }

        if (s.feverTimeLeft <= 0) {
          s.isFeverActive = false;
          setIsFever(false);
          setFeverSecondsLeft(0);
          soundEngine.startBgm(faction, false);
        }
      }

      // 2. Speed calculation
      const speedBonus = Math.min(2.0, Math.floor(s.score / 5) * 0.18);
      const normalSpeed = 1.85 + speedBonus;
      const currentSpeed = s.isFeverActive ? 6.4 : normalSpeed;

      // Tier check (Tier 1 ~ 5)
      const newTier = Math.min(5, Math.floor(s.score / 10) + 1);
      if (newTier > s.tier) {
        s.tier = newTier;
        setDifficultyTier(newTier);
        setSpeedUpAlert(`도약 속도 증가! (Lv.${newTier})`);
        setTimeout(() => setSpeedUpAlert(null), 1800);
      }

      // 3. Player physics
      const gravity = Math.min(0.23, 0.17 + Math.floor(s.score / 15) * 0.015);
      s.player.vy += gravity;
      s.player.y += s.player.vy;
      s.player.rotation = Math.min(Math.PI / 4.5, Math.max(-Math.PI / 5, s.player.vy * 0.05));

      // Ceiling and floor checks
      if (s.player.y - s.player.radius < 0) {
        s.player.y = s.player.radius;
        s.player.vy = 0;
      }
      if (s.player.y + s.player.radius >= GAME_HEIGHT - 20) {
        if (!s.isFeverActive) {
          handleGameOver();
          return;
        } else {
          s.player.y = GAME_HEIGHT - 20 - s.player.radius;
          s.player.vy = -3;
        }
      }

      // 4. Move background
      s.bgScroll = (s.bgScroll + (s.isFeverActive ? 6.0 : currentSpeed * 0.7)) % GAME_WIDTH;

      // 5. Move Obstacles & Collision / Destruction Handling
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.x -= currentSpeed;

        if (!obs.passed && obs.x + obs.width < s.player.x) {
          obs.passed = true;
          s.score += 1;
          setHudScore(s.score);
          soundEngine.playScore();

          if (!s.isFeverActive) {
            s.feverEnergy = Math.min(100, s.feverEnergy + 12);
            setFeverGauge(s.feverEnergy);
            if (s.feverEnergy >= 100) {
              s.isFeverActive = true;
              s.feverEnergy = 0;
              s.feverTimeLeft = 360;
              s.feverTotalDuration = 360;
              setIsFever(true);
              setFeverSecondsLeft(6);
              soundEngine.playFeverStart();
              soundEngine.startBgm(faction, true);
            }
          }
        }

        // Collision logic
        if (s.isFeverActive) {
          if (!obs.topDestroyed) {
            if (
              s.player.x + s.player.radius + 6 > obs.x &&
              s.player.x - s.player.radius - 6 < obs.x + obs.width &&
              s.player.y - s.player.radius - 6 < obs.topHeight
            ) {
              obs.topDestroyed = true;
              smashObstacle(obs.x, 0, obs.width, obs.topHeight);
              s.score += 1;
              setHudScore(s.score);
            }
          }

          if (!obs.bottomDestroyed) {
            const bottomY = GAME_HEIGHT - obs.bottomHeight;
            if (
              s.player.x + s.player.radius + 6 > obs.x &&
              s.player.x - s.player.radius - 6 < obs.x + obs.width &&
              s.player.y + s.player.radius + 6 > bottomY
            ) {
              obs.bottomDestroyed = true;
              smashObstacle(obs.x, bottomY, obs.width, obs.bottomHeight);
              s.score += 1;
              setHudScore(s.score);
            }
          }
        } else {
          if (!obs.topDestroyed) {
            if (
              s.player.x + s.player.radius - 9 > obs.x &&
              s.player.x - s.player.radius + 9 < obs.x + obs.width &&
              s.player.y - s.player.radius + 9 < obs.topHeight
            ) {
              handleGameOver();
              return;
            }
          }

          if (!obs.bottomDestroyed) {
            if (
              s.player.x + s.player.radius - 9 > obs.x &&
              s.player.x - s.player.radius + 9 < obs.x + obs.width &&
              s.player.y + s.player.radius - 9 > GAME_HEIGHT - obs.bottomHeight
            ) {
              handleGameOver();
              return;
            }
          }
        }

        if (obs.x + obs.width < -60) {
          s.obstacles.splice(i, 1);
        }
      }

      // Spacing between obstacles
      const dynamicSpacing = s.isFeverActive
        ? 380
        : Math.max(280, 350 - Math.floor(s.score / 5) * 8);
      const lastObs = s.obstacles[s.obstacles.length - 1];
      if (lastObs && lastObs.x < GAME_WIDTH - dynamicSpacing) {
        s.obstacles.push(createObstaclePair(GAME_WIDTH + 40));
      }

      // 6. CONTINUOUS FACTION TRAILING PARTICLES (Gold/Yellow for Angel, Crimson/Purple for Demon)
      const trailColors = faction === 'angel' ? ANGEL_TRAIL_COLORS : DEVIL_TRAIL_COLORS;
      // Emit 2 trailing particles every frame behind the player character
      for (let i = 0; i < (s.isFeverActive ? 4 : 2); i++) {
        const color = trailColors[Math.floor(Math.random() * trailColors.length)];
        const offsetX = s.player.x - s.player.radius - Math.random() * 8;
        const offsetY = s.player.y + (Math.random() - 0.5) * (s.player.radius * 0.8);

        s.trailingParticles.push({
          x: offsetX,
          y: offsetY,
          vx: -(currentSpeed * 0.8) - Math.random() * 2,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 8 + (s.isFeverActive ? 6 : 4),
          color,
          alpha: 0.95,
          life: 0,
          maxLife: s.isFeverActive ? 28 : 22,
          type: faction === 'angel' ? 'sparkle' : 'flame',
        });
      }

      // Update trailing particles
      for (let i = s.trailingParticles.length - 1; i >= 0; i--) {
        const tp = s.trailingParticles[i];
        tp.x += tp.vx;
        tp.y += tp.vy;
        tp.size *= 0.96; // Gently shrink as they trail
        tp.life++;
        tp.alpha = 1 - tp.life / tp.maxLife;
        if (tp.life >= tp.maxLife || tp.size <= 0.8) {
          s.trailingParticles.splice(i, 1);
        }
      }

      // Update regular particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === 'debris') {
          p.vy += 0.35;
          if (p.rotation !== undefined && p.vRot !== undefined) {
            p.rotation += p.vRot;
          }
        }
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // Update full-screen fever particles
      for (let i = s.feverParticles.length - 1; i >= 0; i--) {
        const fp = s.feverParticles[i];
        fp.x += fp.vx;
        fp.y += fp.vy;
        fp.life++;
        fp.alpha = 1 - fp.life / fp.maxLife;
        if (fp.life >= fp.maxLife) {
          s.feverParticles.splice(i, 1);
        }
      }
    };

    const handleGameOver = () => {
      s.isOver = true;
      s.isRunning = false;
      soundEngine.stopBgm();
      soundEngine.playGameOver();
      onGameOverRef.current(s.score);
    };

    const renderGame = (c: CanvasRenderingContext2D) => {
      c.save();

      // Screen shake
      if (s.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        c.translate(shakeX, shakeY);
      }

      c.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      drawBackground(c);
      drawObstacles(c);

      // 1. Draw Faction Trailing Particles Behind Player
      drawTrailingParticles(c);

      drawParticles(c);

      // Draw full-screen fever particle storm
      if (s.isFeverActive) {
        drawFeverParticleStorm(c);
      }

      drawPlayer(c);
      drawGround(c);

      // Draw full-screen faction flashing visual effects
      if (s.isFeverActive) {
        drawFeverEffects(c);
      }

      c.restore();
    };

    const drawBackground = (c: CanvasRenderingContext2D) => {
      if (faction === 'angel') {
        const skyGrad = c.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        skyGrad.addColorStop(0, '#BAE6FD');
        skyGrad.addColorStop(0.6, '#FEF08A');
        skyGrad.addColorStop(1, '#E0F2FE');
        c.fillStyle = skyGrad;
        c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        c.fillStyle = '#FEF9C3';
        c.beginPath();
        c.arc(GAME_WIDTH - 120, 90, 60, 0, Math.PI * 2);
        c.fill();
        c.lineWidth = 4;
        c.strokeStyle = '#000000';
        c.stroke();

        const scroll = s.bgScroll * 0.4;
        c.fillStyle = '#FFFFFF';
        c.strokeStyle = '#000000';
        c.lineWidth = 3;

        for (let x = -100; x < GAME_WIDTH + 200; x += 220) {
          const cx = ((x - scroll) % (GAME_WIDTH + 300)) - 50;
          c.beginPath();
          c.arc(cx, 160, 32, 0, Math.PI * 2);
          c.arc(cx + 35, 150, 42, 0, Math.PI * 2);
          c.arc(cx + 70, 160, 34, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
      } else {
        const caveGrad = c.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        caveGrad.addColorStop(0, '#1E1B4B');
        caveGrad.addColorStop(0.5, '#450A0A');
        caveGrad.addColorStop(1, '#7F1D1D');
        c.fillStyle = caveGrad;
        c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        c.fillStyle = '#292524';
        c.strokeStyle = '#000000';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(50, GAME_HEIGHT - 60);
        c.lineTo(180, 220);
        c.lineTo(310, GAME_HEIGHT - 60);
        c.moveTo(340, GAME_HEIGHT - 60);
        c.lineTo(520, 190);
        c.lineTo(700, GAME_HEIGHT - 60);
        c.fill();
        c.stroke();

        c.fillStyle = '#F97316';
        c.beginPath();
        c.arc(520, 190, 16, 0, Math.PI * 2);
        c.fill();
      }
    };

    const drawObstacles = (c: CanvasRenderingContext2D) => {
      s.obstacles.forEach((obs) => {
        // TOP OBSTACLE
        if (!obs.topDestroyed) {
          c.save();
          const topGrad = c.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
          if (faction === 'angel') {
            topGrad.addColorStop(0, '#F0F9FF');
            topGrad.addColorStop(0.4, '#BAE6FD');
            topGrad.addColorStop(1, '#38BDF8');
          } else {
            topGrad.addColorStop(0, '#7F1D1D');
            topGrad.addColorStop(0.4, '#DC2626');
            topGrad.addColorStop(1, '#991B1B');
          }

          c.fillStyle = topGrad;
          c.fillRect(obs.x, 0, obs.width, obs.topHeight);
          c.lineWidth = 4;
          c.strokeStyle = '#000000';
          c.strokeRect(obs.x, 0, obs.width, obs.topHeight);

          c.fillStyle = faction === 'angel' ? '#FDE047' : '#1C1917';
          c.fillRect(obs.x - 6, obs.topHeight - 24, obs.width + 12, 24);
          c.strokeRect(obs.x - 6, obs.topHeight - 24, obs.width + 12, 24);

          c.fillStyle = '#FFFFFF';
          c.globalAlpha = 0.55;
          c.fillRect(obs.x + 8, 4, 8, obs.topHeight - 32);
          c.globalAlpha = 1.0;
          c.restore();
        }

        // BOTTOM OBSTACLE
        if (!obs.bottomDestroyed) {
          c.save();
          const bottomY = GAME_HEIGHT - obs.bottomHeight;
          const btmGrad = c.createLinearGradient(obs.x, bottomY, obs.x + obs.width, bottomY);
          if (faction === 'angel') {
            btmGrad.addColorStop(0, '#F0F9FF');
            btmGrad.addColorStop(0.4, '#BAE6FD');
            btmGrad.addColorStop(1, '#38BDF8');
          } else {
            btmGrad.addColorStop(0, '#7F1D1D');
            btmGrad.addColorStop(0.4, '#DC2626');
            btmGrad.addColorStop(1, '#991B1B');
          }

          c.fillStyle = btmGrad;
          c.fillRect(obs.x, bottomY, obs.width, obs.bottomHeight);
          c.lineWidth = 4;
          c.strokeStyle = '#000000';
          c.strokeRect(obs.x, bottomY, obs.width, obs.bottomHeight);

          c.fillStyle = faction === 'angel' ? '#FDE047' : '#1C1917';
          c.fillRect(obs.x - 6, bottomY, obs.width + 12, 24);
          c.strokeRect(obs.x - 6, bottomY, obs.width + 12, 24);

          c.fillStyle = '#FFFFFF';
          c.globalAlpha = 0.55;
          c.fillRect(obs.x + 8, bottomY + 28, 8, obs.bottomHeight - 36);
          c.globalAlpha = 1.0;
          c.restore();
        }
      });
    };

    // Draw Faction Trailing Particles Behind Character
    const drawTrailingParticles = (c: CanvasRenderingContext2D) => {
      s.trailingParticles.forEach((tp) => {
        c.save();
        c.globalAlpha = Math.max(0, tp.alpha);
        c.fillStyle = tp.color;

        // Glowing comic circle trail
        c.beginPath();
        c.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
        c.fill();

        // Subtle dark outline for cartoon flair
        c.lineWidth = 1.5;
        c.strokeStyle = faction === 'angel' ? '#78350F' : '#450A0A';
        c.stroke();

        // White core highlight on larger trailing particles
        if (tp.size > 4) {
          c.fillStyle = '#FFFFFF';
          c.beginPath();
          c.arc(tp.x - tp.size * 0.25, tp.y - tp.size * 0.25, tp.size * 0.35, 0, Math.PI * 2);
          c.fill();
        }

        c.restore();
      });
    };

    const drawParticles = (c: CanvasRenderingContext2D) => {
      s.particles.forEach((p) => {
        c.save();
        c.globalAlpha = Math.max(0, p.alpha);

        if (p.type === 'debris') {
          c.translate(p.x, p.y);
          if (p.rotation) c.rotate(p.rotation);
          c.fillStyle = p.color;
          c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          c.lineWidth = 3;
          c.strokeStyle = '#000000';
          c.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          c.fill();
          c.lineWidth = 1.5;
          c.strokeStyle = '#000000';
          c.stroke();
        }

        c.restore();
      });
    };

    // Full-screen fever particle storm
    const drawFeverParticleStorm = (c: CanvasRenderingContext2D) => {
      s.feverParticles.forEach((fp) => {
        c.save();
        c.globalAlpha = Math.max(0, fp.alpha);
        c.fillStyle = fp.color;

        c.translate(fp.x, fp.y);
        if (fp.rotation) c.rotate(fp.rotation);

        c.beginPath();
        c.arc(0, 0, fp.size, 0, Math.PI * 2);
        c.fill();
        c.lineWidth = 2;
        c.strokeStyle = '#FFFFFF';
        c.stroke();

        c.restore();
      });
    };

    const drawPlayer = (c: CanvasRenderingContext2D) => {
      c.save();
      c.translate(s.player.x, s.player.y);
      c.rotate(s.player.rotation);

      if (faction === 'angel') {
        const lightSphere = c.createRadialGradient(-2, 0, 8, 0, 0, s.isFeverActive ? 80 : 56);
        lightSphere.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
        lightSphere.addColorStop(0.35, s.isFeverActive ? 'rgba(250, 204, 21, 0.95)' : 'rgba(254, 240, 138, 0.8)');
        lightSphere.addColorStop(0.7, 'rgba(56, 189, 248, 0.5)');
        lightSphere.addColorStop(1, 'rgba(255, 255, 255, 0)');

        c.fillStyle = lightSphere;
        c.beginPath();
        c.arc(0, 0, s.isFeverActive ? 80 : 56, 0, Math.PI * 2);
        c.fill();

        c.save();
        c.strokeStyle = s.isFeverActive ? '#FACC15' : 'rgba(253, 224, 71, 0.85)';
        c.lineWidth = s.isFeverActive ? 6 : 4;
        c.beginPath();
        c.arc(0, 0, (s.isFeverActive ? 42 : 36) + Math.sin(s.frameCount * 0.15) * 4, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        const img = angelImgRef.current;
        if (img && img.complete) {
          const spriteSize = s.isFeverActive ? 72 : 64;
          c.drawImage(img, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
        } else {
          c.fillStyle = '#FEF08A';
          c.beginPath();
          c.arc(0, 0, 26, 0, Math.PI * 2);
          c.fill();
        }
      } else {
        const flameSphere = c.createRadialGradient(-4, 0, 8, 0, 0, s.isFeverActive ? 82 : 60);
        flameSphere.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        flameSphere.addColorStop(0.35, s.isFeverActive ? 'rgba(239, 68, 68, 0.95)' : 'rgba(249, 115, 22, 0.85)');
        flameSphere.addColorStop(0.7, 'rgba(239, 68, 68, 0.6)');
        flameSphere.addColorStop(1, 'rgba(127, 29, 29, 0)');

        c.fillStyle = flameSphere;
        c.beginPath();
        c.arc(0, 0, s.isFeverActive ? 82 : 60, 0, Math.PI * 2);
        c.fill();

        c.save();
        c.strokeStyle = s.isFeverActive ? '#EF4444' : 'rgba(239, 68, 68, 0.85)';
        c.lineWidth = s.isFeverActive ? 6 : 4;
        c.beginPath();
        c.arc(0, 0, (s.isFeverActive ? 44 : 36) + Math.sin(s.frameCount * 0.18) * 5, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        const img = devilImgRef.current;
        if (img && img.complete) {
          const spriteSize = s.isFeverActive ? 72 : 64;
          c.drawImage(img, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
        } else {
          c.fillStyle = '#EF4444';
          c.beginPath();
          c.arc(0, 0, 26, 0, Math.PI * 2);
          c.fill();
        }
      }

      c.restore();
    };

    const drawGround = (c: CanvasRenderingContext2D) => {
      const groundY = GAME_HEIGHT - 20;
      c.fillStyle = faction === 'angel' ? '#FDE047' : '#450A0A';
      c.fillRect(0, groundY, GAME_WIDTH, 20);
      c.lineWidth = 4;
      c.strokeStyle = '#000000';
      c.beginPath();
      c.moveTo(0, groundY);
      c.lineTo(GAME_WIDTH, groundY);
      c.stroke();
    };

    const drawFeverEffects = (c: CanvasRenderingContext2D) => {
      c.save();

      const flashAlpha = 0.25 + Math.sin(s.frameCount * 0.25) * 0.2;

      const vignette = c.createRadialGradient(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        180,
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        450
      );

      if (faction === 'angel') {
        vignette.addColorStop(0, 'rgba(254, 240, 138, 0)');
        vignette.addColorStop(0.6, `rgba(56, 189, 248, ${flashAlpha * 0.6})`);
        vignette.addColorStop(1, `rgba(250, 204, 21, ${flashAlpha})`);
      } else {
        vignette.addColorStop(0, 'rgba(239, 68, 68, 0)');
        vignette.addColorStop(0.6, `rgba(249, 115, 22, ${flashAlpha * 0.6})`);
        vignette.addColorStop(1, `rgba(220, 38, 38, ${flashAlpha * 1.2})`);
      }

      c.fillStyle = vignette;
      c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      c.strokeStyle =
        faction === 'angel'
          ? Math.sin(s.frameCount * 0.3) > 0
            ? '#FACC15'
            : '#38BDF8'
          : Math.sin(s.frameCount * 0.3) > 0
          ? '#EF4444'
          : '#F97316';
      c.lineWidth = 12;
      c.strokeRect(6, 6, GAME_WIDTH - 12, GAME_HEIGHT - 12);

      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 3;
      for (let i = 0; i < 7; i++) {
        const sy = 60 + i * 75 + Math.sin(s.frameCount * 0.4 + i) * 20;
        const sx = ((s.frameCount * 30 + i * 140) % (GAME_WIDTH + 200)) - 100;
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + 90, sy);
        c.stroke();
      }

      const secondsRemaining = (s.feverTimeLeft / 60).toFixed(1);

      c.fillStyle = 'rgba(0, 0, 0, 0.75)';
      c.fillRect(GAME_WIDTH / 2 - 210, 68, 420, 50);
      c.lineWidth = 3.5;
      c.strokeStyle = faction === 'angel' ? '#FACC15' : '#EF4444';
      c.strokeRect(GAME_WIDTH / 2 - 210, 68, 420, 50);

      c.fillStyle = faction === 'angel' ? '#FEF08A' : '#FCA5A5';
      c.font = '900 22px sans-serif';
      c.textAlign = 'center';
      c.fillText(`★ 초고속 파괴 피버 (${secondsRemaining}초 남음) ★`, GAME_WIDTH / 2, 102);

      c.restore();
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [faction]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black select-none overflow-hidden">
      {/* Cartoon Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onClick={jump}
        className="w-full max-w-[800px] max-h-[600px] aspect-[4/3] rounded-2xl border-4 border-black shadow-[8px_8px_0px_#000] cursor-pointer touch-none bg-sky-100"
      />

      {/* Speed Up / Tier Alert Banner */}
      {speedUpAlert && (
        <div className="absolute top-20 pointer-events-none z-30 animate-bounce">
          <div className="px-4 py-1.5 bg-yellow-400 border-3 border-black text-black font-black text-sm rounded-xl shadow-[3px_3px_0px_#000]">
            ⚡ {speedUpAlert}
          </div>
        </div>
      )}

      {/* Top HUD Controls overlay */}
      <div className="absolute top-3 left-3 right-3 max-w-[770px] mx-auto flex items-center justify-between pointer-events-none">
        {/* Left: Back / Pause */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onBackToLobby}
            className="px-2.5 py-1 bg-white hover:bg-gray-100 rounded-lg border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1"
          >
            <span>로비</span>
          </button>
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="px-2.5 py-1 bg-yellow-300 hover:bg-yellow-400 rounded-lg border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            {isPaused ? '계속하기 ▶' : '일시정지 ❚❚'}
          </button>
        </div>

        {/* Center: Score, Difficulty Tier, & Fever Bar with countdown */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="px-4 py-0.5 bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-black tracking-tight">{hudScore}</span>
            <span className="text-[11px] font-black text-gray-500">점</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 bg-amber-200 rounded border border-black text-amber-900">
              Lv.{difficultyTier}
            </span>
          </div>

          {/* Fever Gauge & Remaining Seconds Badge */}
          <div className="w-32 sm:w-36 h-4 bg-gray-900 rounded-full border border-black p-0.5 mt-1 shadow-[1px_1px_0px_#000] overflow-hidden relative flex items-center">
            <div
              style={{ width: `${isFever ? (feverSecondsLeft / 6) * 100 : feverGauge}%` }}
              className={`h-full rounded-full transition-all duration-150 ${
                isFever
                  ? faction === 'angel'
                    ? 'bg-gradient-to-r from-yellow-300 via-sky-300 to-amber-400 animate-pulse'
                    : 'bg-gradient-to-r from-orange-400 via-rose-500 to-red-600 animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-300'
              }`}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_1px_#000]">
              {isFever ? `파괴 피버 ${feverSecondsLeft}초!` : `피버: ${Math.round(feverGauge)}%`}
            </span>
          </div>
        </div>

        {/* Right: High Score */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="px-2.5 py-1 bg-white rounded-lg border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] flex items-center gap-1">
            <DecorLogo size={16} />
            <span className="text-gray-500 text-[10px]">최고:</span>
            <span className="text-black">{Math.max(highScore, hudScore)}점</span>
          </div>
        </div>
      </div>

      {/* Pause Screen Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-40">
          <div className="bg-white rounded-2xl border-4 border-black p-5 shadow-[6px_6px_0px_#000] flex flex-col items-center gap-2.5 max-w-xs text-center">
            <DecorLogo size={36} />
            <h3 className="text-xl font-black text-black">일시 정지됨</h3>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setIsPaused(false)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                계속하기
              </button>
              <button
                onClick={onBackToLobby}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                로비로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
