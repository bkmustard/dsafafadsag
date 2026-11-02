import { useState, useEffect } from 'react';
import { Faction, GameSettings, LeaderboardEntry, PlayerProfile } from './types';
import {
  loadProfile,
  saveProfile,
  loadSettings,
  saveSettings,
  loadLeaderboard,
  updateLeaderboard,
  clearAllLeaderboard,
  syncRechargeLives,
  consumeLife,
} from './utils/storage';
import { soundEngine } from './utils/soundEngine';
import { applyRemoteAccount, getGameAccount } from './utils/gameApi';
import { calculateEventChips } from './utils/chipCalculator';
import { Lobby } from './components/Lobby';
import { GameCanvas } from './components/GameCanvas';
import { GameOverModal } from './components/GameOverModal';
import { FactionSelectModal } from './components/FactionSelectModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ChipHistoryModal } from './components/ChipHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { AccountModal } from './components/AccountModal';
import { TicketShopModal } from './components/TicketShopModal';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const loaded = loadProfile();
    const { profile: synced } = syncRechargeLives(loaded);
    return synced;
  });

  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard());

  // Discord event-chip balance is authoritative on the bot server.
  useEffect(() => {
    if (!profile.serialNumber) return;
    let active = true;
    const refresh = async () => {
      try {
        const remote = await getGameAccount(profile.serialNumber!);
        if (!active) return;
        setProfile((current) => {
          if (current.serialNumber !== profile.serialNumber) return current;
          const updated = applyRemoteAccount(current, remote);
          saveProfile(updated);
          return updated;
        });
      } catch {
        // The game remains playable while the Discord bot/API is offline.
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [profile.serialNumber]);

  const [currentView, setCurrentView] = useState<'lobby' | 'playing' | 'gameover'>('lobby');
  const [activeModal, setActiveModal] = useState<
    'leaderboard' | 'history' | 'settings' | 'account' | 'ticketShop' | null
  >(null);

  // Game over state
  const [lastScore, setLastScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);

  // Sync sound engine with settings
  useEffect(() => {
    soundEngine.updateSettings(settings.bgmVolume, settings.sfxVolume, settings.isMuted);
    saveSettings(settings);
  }, [settings]);

  // Main menu background music (Jorge Hernandez - Chopsticks 8-bit Music)
  useEffect(() => {
    if (currentView === 'lobby') {
      soundEngine.playMenuBgm();
    } else if (currentView === 'gameover') {
      // Delay slightly so game over sound effect plays clearly
      const timer = setTimeout(() => {
        soundEngine.playMenuBgm();
      }, 700);
      return () => clearTimeout(timer);
    } else {
      soundEngine.stopMenuBgm();
    }
  }, [currentView]);

  // Periodic life sync (hourly recharge & daily reset check)
  useEffect(() => {
    const checkLives = () => {
      const { profile: synced } = syncRechargeLives(profile);
      if (synced.lives !== profile.lives) {
        setProfile(synced);
      }
    };
    const timer = setInterval(checkLives, 30000);
    return () => clearInterval(timer);
  }, [profile]);

  // Persist profile changes and sync leaderboard
  const handleUpdateProfile = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
    const updatedLb = updateLeaderboard(newProfile);
    setLeaderboard(updatedLb);
  };

  // Batch delete all leaderboard records
  const handleClearLeaderboard = () => {
    const cleared = clearAllLeaderboard();
    setLeaderboard(cleared);
  };

  // Handle faction and name selection from initial modal
  const handleSelectFaction = (faction: Faction, name: string) => {
    const updated: PlayerProfile = {
      ...profile,
      faction,
      name,
    };
    handleUpdateProfile(updated);
  };

  // Start game session (requires 1 life)
  const handleStartGame = () => {
    const res = consumeLife(profile);
    if (!res.success || res.updatedProfile.lives < 0) {
      setActiveModal('ticketShop');
      return;
    }

    handleUpdateProfile(res.updatedProfile);
    setActiveModal(null);
    setCurrentView('playing');
  };

  // Handle game over
  const handleGameOver = (finalScore: number) => {
    setLastScore(finalScore);
    const newHighAchieved = finalScore > profile.highScore;
    setIsNewHigh(newHighAchieved);

    const { chips: chipsEarned } = calculateEventChips(finalScore);

    const updatedProfile: PlayerProfile = {
      ...profile,
      highScore: Math.max(profile.highScore, finalScore),
      totalChips: profile.totalChips + chipsEarned,
      gamesPlayed: profile.gamesPlayed + 1,
      chipHistory: [
        {
          id: Date.now().toString(),
          date: new Date().toLocaleString('ko-KR'),
          faction: profile.faction || 'angel',
          score: finalScore,
          chipsEarned,
        },
        ...profile.chipHistory,
      ],
    };

    handleUpdateProfile(updatedProfile);
    setCurrentView('gameover');
  };

  const handleRetry = () => {
    // Check if player has lives to retry
    const res = consumeLife(profile);
    if (!res.success) {
      setCurrentView('lobby');
      setActiveModal('ticketShop');
      return;
    }
    handleUpdateProfile(res.updatedProfile);
    setCurrentView('playing');
  };

  const handleBackToLobby = () => {
    soundEngine.stopBgm();
    setCurrentView('lobby');
  };

  return (
    <main className="w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-black font-sans">
      {/* 1. Initial Faction Selection Modal (if not chosen) */}
      {!profile.faction && (
        <FactionSelectModal
          profile={profile}
          onSelectFaction={handleSelectFaction}
        />
      )}

      {/* 2. Main Game View or Lobby */}
      {currentView === 'playing' ? (
        <GameCanvas
          faction={profile.faction || 'angel'}
          highScore={profile.highScore}
          onGameOver={handleGameOver}
          onBackToLobby={handleBackToLobby}
        />
      ) : (
        <Lobby
          profile={profile}
          leaderboard={leaderboard}
          onStartGame={handleStartGame}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenChipHistory={() => setActiveModal('history')}
          onOpenAccount={() => setActiveModal('account')}
          onOpenTicketShop={() => setActiveModal('ticketShop')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* 3. Game Over Modal */}
      {currentView === 'gameover' && (
        <GameOverModal
          score={lastScore}
          isNewHigh={isNewHigh}
          profile={profile}
          onRetry={handleRetry}
          onBackToLobby={handleBackToLobby}
          onOpenTicketShop={() => setActiveModal('ticketShop')}
        />
      )}

      {/* 4. Global Leaderboard Modal with Left/Right Slam and Fall-off-screen */}
      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          entries={leaderboard}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 5. Chip Acquisition History Modal */}
      {activeModal === 'history' && (
        <ChipHistoryModal
          totalChips={profile.totalChips}
          history={profile.chipHistory}
          onClose={() => setActiveModal(null)}
          onOpenAccount={() => setActiveModal('account')}
        />
      )}

      {/* 6. Account & Discord Linking Modal */}
      {activeModal === 'account' && (
        <AccountModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 7. Lives & Discord Ticket Shop Modal */}
      {activeModal === 'ticketShop' && (
        <TicketShopModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setActiveModal(null)}
          onOpenAccount={() => setActiveModal('account')}
        />
      )}

      {/* 8. Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          profile={profile}
          onUpdateSettings={setSettings}
          onUpdateProfile={handleUpdateProfile}
          onClearLeaderboard={handleClearLeaderboard}
          onClose={() => setActiveModal(null)}
        />
      )}
    </main>
  );
}
