import React, { useState, useCallback, useEffect, useRef } from 'react';
import LeftSidebar    from '../components/LeftSidebar';
import RightSidebar   from '../components/RightSidebar';
import Board          from '../components/Board';
import IdleBoard      from '../components/IdleBoard';
import ConfettiCanvas from '../components/ConfettiCanvas';
import ShatterCanvas  from '../components/ShatterCanvas';
import { useGameLogic } from '../hooks/useGameLogic';
import { useTimer }     from '../hooks/useTimer';
import { useAudio }     from '../hooks/useAudio';
import DynamicBackground from '../components/DynamicBackground';
import styles           from './GamePage.module.css';

export default function GamePage() {
  // ── Settings state (sidebar selections, not yet applied) ──────────
  const [numCards,   setNumCards]   = useState(8);
  const [revealTime, setRevealTime] = useState(3000);
  const [uploadLabel, setUploadLabel] = useState('Upload Images');

  // ── Game phase: 'idle' | 'game' ───────────────────────────────────
  const [gamePhase, setGamePhase] = useState('idle');
  const [winData,   setWinData]   = useState(null);
  const [confetti,  setConfetti]  = useState(false);

  // Ref for the physics shatter overlay
  const shatterRef = useRef(null);

  const { isMuted, isMusicPlaying, toggleMute, toggleMusic, playSound } = useAudio();
  const { seconds, start: startTimer, stop: stopTimer, reset: resetTimer, format } = useTimer();
  const secondsRef = useRef(0);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  // ── Win callback ───────────────────────────────────────────────────
  const handleWin = useCallback(() => {
    stopTimer();
    setConfetti(true);
    playSound('win-sound');
  }, [stopTimer, playSound]);

  // Find matched card DOM elements and trigger the fall physics animation
  const handleMatch = useCallback((ids, imageSrc) => {
    if (!shatterRef.current) return;
    setTimeout(() => {
      ids.forEach(id => {
        const el = document.querySelector(`[data-card-id="${id}"]`);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        shatterRef.current.triggerFall(
          rect.left + rect.width  / 2,
          rect.top  + rect.height / 2,
          rect.width,
          rect.height,
          imageSrc,
        );
      });
    }, 640);
  }, []);

  const {
    cards, matchCount, errorCount, totalPairs, gameStarted,
    startGame, flipCard, handleUpload, calcScore,
  } = useGameLogic({ onWin: handleWin, onMatch: handleMatch, playSound, revealTime });

  const startGameRef = useRef(startGame);
  startGameRef.current = startGame;

  // Start timer once preview ends
  useEffect(() => {
    if (gameStarted) startTimer();
  }, [gameStarted]); // eslint-disable-line

  // Populate winData once all matched
  useEffect(() => {
    if (totalPairs > 0 && matchCount === totalPairs) {
      const secs = secondsRef.current;
      setWinData({
        time:   format(secs),
        errors: errorCount,
        score:  calcScore(totalPairs, errorCount, secs),
      });
    }
  }, [matchCount, totalPairs]); // eslint-disable-line

  // ── Handlers ──────────────────────────────────────────────────────

  const handleQuit = useCallback(() => {
    stopTimer();
    shatterRef.current?.clearAll();
    setGamePhase('idle');
    setWinData(null);
    setConfetti(false);
  }, [stopTimer]);

  /** Apply selected settings and begin a fresh game */
  const handleStart = useCallback(() => {
    setWinData(null);
    setConfetti(false);
    resetTimer();
    setGamePhase('game');
    startGame(numCards);        // numCards is the currently selected value
  }, [numCards, resetTimer, startGame]);

  /** Restart with whatever settings are currently active */
  const handleRestart = useCallback(() => {
    shatterRef.current?.clearAll();
    setWinData(null);
    setConfetti(false);
    resetTimer();
    startGame(numCards);
  }, [numCards, resetTimer, startGame]);

  /** Sidebar option changes — only update state, DO NOT start the game */
  const handleNumCardsChange   = useCallback((n) => setNumCards(n),   []);
  const handleRevealTimeChange = useCallback((t) => setRevealTime(t), []);

  const handleUploadWrapped = useCallback((files) => {
    setUploadLabel(`✓ Uploaded (${files.length})`);
    handleUpload(files, () => {
      setWinData(null);
      setConfetti(false);
      resetTimer();
      setGamePhase('game');
      startGame(numCards);
    });
  }, [handleUpload, numCards, resetTimer, startGame]);

  // ── Live score ─────────────────────────────────────────────────────
  const liveScore = matchCount > 0
    ? calcScore(matchCount, errorCount, seconds)
    : '—';

  const isIdle = gamePhase === 'idle';

  return (
    <div className={`${styles.app} ${!isIdle ? styles.gameMode : ''}`}>
      <DynamicBackground />
      <ShatterCanvas ref={shatterRef} />
      <ConfettiCanvas active={confetti} />

      <div className={`${styles.sidebarWrapper} ${styles.left} ${!isIdle ? styles.slideOutLeft : ''}`}>
        <LeftSidebar
          numCards={numCards}
          onNumCardsChange={handleNumCardsChange}
          revealTime={revealTime}
          onRevealTimeChange={handleRevealTimeChange}
          onUpload={handleUploadWrapped}
          uploadLabel={uploadLabel}
          onStart={handleStart}
        />
      </div>

      {/* ── Center Board ── */}
      <main className={styles.center}>
        <div className={styles.boardArea}>
          {!isIdle && (
            <div className={styles.gameTopBar}>
              <div className={styles.statsGroup}>
                <div className={styles.statItem}>⏱ {format(seconds)}</div>
                <div className={styles.statItem}>❌ {errorCount}</div>
                <div className={styles.statItem}>⭐ {liveScore}</div>
              </div>
              <button onClick={handleQuit} className={styles.quitBtn}>Quit</button>
            </div>
          )}

          {isIdle ? (
            /* Idle: animated 2×4 card-back placeholder */
            <>
              <div className={styles.idleHint}>
                Choose your settings and press <strong>Start Game</strong>
              </div>
              <IdleBoard />
            </>
          ) : (
            /* Active game */
            <>
              <Board cards={cards} numCards={numCards} onCardClick={flipCard} />
              <div className={styles.progressRow}>
                <div className={styles.progressMeta}>
                  <span>Progress</span>
                  <span>{matchCount} of {totalPairs} pairs matched</span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: totalPairs ? `${(matchCount / totalPairs) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {winData && (
                <div className={styles.winOverlay}>
                  <div className={styles.winTitle}>🎉 All matched!</div>
                  <div className={styles.winStats}>
                    <span style={{ color: '#60a5fa' }}>⏱ {winData.time}</span>
                    <span style={{ color: '#f87171' }}>❌ {winData.errors} errs</span>
                    <span style={{ color: '#4ade80' }}>⭐ {winData.score} pts</span>
                  </div>
                  <div className={styles.winActions}>
                    <button className={styles.playAgainBtn} onClick={handleRestart}>
                      Play Again
                    </button>
                    <button className={styles.quitBtnSecondary} onClick={handleQuit}>
                      Quit
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <div className={`${styles.sidebarWrapper} ${styles.right} ${!isIdle ? styles.slideOutRight : ''}`}>
        <RightSidebar
          isMuted={isMuted}
          onToggleMute={toggleMute}
          isMusicPlaying={isMusicPlaying}
          onToggleMusic={toggleMusic}
        />
      </div>

      <audio id="bell-sound"   src="assets/audio/bell2.mp3"   preload="auto" />
      <audio id="buzzer-sound" src="assets/audio/buzzer2.mp3" preload="auto" />
      <audio id="swipe-sound"  src="assets/audio/swipe.mp3"   preload="auto" />
      <audio id="win-sound"    src="assets/audio/win.mp3"     preload="auto" />
      <audio id="ambient-music" src="assets/audio/ambient.mp3" loop preload="auto" />
    </div>
  );
}
