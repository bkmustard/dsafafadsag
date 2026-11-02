import { Faction } from '../types';
import { GAME_ASSETS } from '../assets/gameAssets';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private currentBgmFaction: Faction | null = null;
  private isFeverBgm: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;

  // Main Menu (Lobby) 8-bit Music Track
  private menuAudio: HTMLAudioElement | null = null;
  private isMenuBgmPlaying: boolean = false;
  private pendingAutoplayUnlock: boolean = false;

  private bgmVolume: number = 0.6;
  private sfxVolume: number = 0.8;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateSettings(bgmVol: number, sfxVol: number, muted: boolean) {
    this.bgmVolume = bgmVol;
    this.sfxVolume = sfxVol;
    this.isMuted = muted;

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx?.currentTime || 0);
    }
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx?.currentTime || 0);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx?.currentTime || 0);
    }

    if (this.menuAudio) {
      this.menuAudio.volume = this.isMuted ? 0 : this.bgmVolume;
      if (this.isMenuBgmPlaying && !this.isMuted && this.menuAudio.paused) {
        this.menuAudio.play().catch(() => {});
      }
    }
  }

  // --- Main Menu Audio ---

  public playMenuBgm() {
    this.isMenuBgmPlaying = true;
    if (!this.menuAudio) {
      this.menuAudio = new Audio(GAME_ASSETS.mainMenuBgm);
      this.menuAudio.loop = true;
      this.menuAudio.preload = 'auto';
    }
    this.menuAudio.volume = this.isMuted ? 0 : this.bgmVolume;

    const playPromise = this.menuAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Handle browser autoplay policy by waiting for the first user interaction
        if (!this.pendingAutoplayUnlock) {
          this.pendingAutoplayUnlock = true;
          const unlock = () => {
            if (this.isMenuBgmPlaying && this.menuAudio) {
              this.menuAudio.volume = this.isMuted ? 0 : this.bgmVolume;
              this.menuAudio.play().catch(() => {});
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            this.pendingAutoplayUnlock = false;
          };
          window.addEventListener('pointerdown', unlock, { once: true });
          window.addEventListener('keydown', unlock, { once: true });
        }
      });
    }
  }

  public stopMenuBgm() {
    this.isMenuBgmPlaying = false;
    if (this.menuAudio) {
      this.menuAudio.pause();
      this.menuAudio.currentTime = 0;
    }
  }

  // --- Sound Effects ---

  public playJump(faction: Faction) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    if (faction === 'angel') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(740, t + 0.18);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.18);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    }

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playScore() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, t);
    osc.frequency.setValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Cartoon "펑!" sound (poof / punchy comic pop)
  public playPoof() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // 1. Low punch pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.26);

    // 2. White noise burst (the "펑!" air release)
    try {
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.18);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.2);
    } catch {
      // Fallback
    }
  }

  public playFeverStart() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  public playGameOver() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.5);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  public playChip() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [987.77, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }

  // --- Dynamic Procedural BGM ---

  public startBgm(faction: Faction, isFever: boolean = false) {
    this.stopMenuBgm();
    this.initCtx();
    if (!this.ctx || !this.bgmGain) return;

    if (this.currentBgmFaction === faction && this.isFeverBgm === isFever && this.bgmInterval) {
      return;
    }

    this.stopBgm();
    this.currentBgmFaction = faction;
    this.isFeverBgm = isFever;
    this.bgmStep = 0;

    const tempo = isFever ? 130 : 180;
    this.bgmInterval = window.setInterval(() => {
      this.playBgmStep();
    }, tempo);
  }

  private playBgmStep() {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const step = this.bgmStep % 16;
    this.bgmStep++;

    if (this.currentBgmFaction === 'angel') {
      const angelMelody = [587.33, 659.25, 698.46, 880, 1046.5, 880, 698.46, 783.99, 880, 1046.5, 1174.66, 1046.5, 880, 698.46, 659.25, 587.33];
      const angelBass = [293.66, 0, 0, 0, 349.23, 0, 0, 0, 440, 0, 0, 0, 392, 0, 0, 0];

      if (angelBass[step] > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(angelBass[step], t);
        bassGain.gain.setValueAtTime(0.16, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.46);
      }

      if (this.isFeverBgm || step % 2 === 0) {
        const bellOsc = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bellOsc.type = 'triangle';
        bellOsc.frequency.setValueAtTime(angelMelody[step], t);
        bellGain.gain.setValueAtTime(this.isFeverBgm ? 0.2 : 0.1, t);
        bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        bellOsc.connect(bellGain);
        bellGain.connect(this.bgmGain);
        bellOsc.start(t);
        bellOsc.stop(t + 0.26);
      }
    } else {
      const devilBass = [164.81, 164.81, 196.0, 164.81, 220.0, 164.81, 246.94, 220.0, 164.81, 164.81, 196.0, 164.81, 146.83, 164.81, 130.81, 146.83];
      const devilLead = [329.63, 0, 392.0, 0, 440.0, 0, 493.88, 0, 523.25, 0, 493.88, 0, 440.0, 392.0, 349.23, 329.63];

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(devilBass[step] / 2, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.isFeverBgm ? 1600 : 850, t);
      bassOsc.connect(filter);
      filter.connect(bassGain);

      bassGain.gain.setValueAtTime(0.16, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      bassGain.connect(this.bgmGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.15);

      if (devilLead[step] > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(devilLead[step], t);
        leadGain.gain.setValueAtTime(this.isFeverBgm ? 0.14 : 0.07, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);
        leadOsc.start(t);
        leadOsc.stop(t + 0.15);
      }
    }
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBgmFaction = null;
    this.isFeverBgm = false;
  }
}

export const soundEngine = new SoundEngine();
