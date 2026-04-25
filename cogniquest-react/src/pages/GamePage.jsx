import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftSidebar    from '../components/LeftSidebar';
import RightSidebar   from '../components/RightSidebar';
import Board          from '../components/Board';
import ConfettiCanvas from '../components/ConfettiCanvas';
import { useGameLogic } from '../hooks/useGameLogic';
import { useTimer }     from '../hooks/useTimer';
import { useAudio }     from '../hooks/useAudio';
import styles           from './GamePage.module.css';

export default function GamePage() {
  const navigate = useNavigate();

  const [numCards,    setNumCards]    = useState(8);
  const [revealTime,  setRevealTime]  = useState(3000);
  const [uploadLabel, setUploadLabel] = useState('Upload Images');
  const [winData,     setWinData]     = useState(null);
  const [confetti,    setConfetti]    = useState(false);

  const { isMuted, toggleMute, playSound } = useAudio();
  const { seconds, start: startTimer, stop: stopTimer, reset: resetTimer, format } = useTimer();

  // Capture seconds in a ref so win handler always has the current value
  const secondsRef = useRef(0);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  const handleWin = useCallback(() => {
    stopTimer();
    setConfetti(true);
    playSound('win-sound');
  }, [stopTimer, playSound]);

  const {
    cards, matchCount, errorCount, totalPairs, gameStarted,
    startGame, flipCard, handleUpload, calcScore,
  } = useGameLogic({ onWin: handleWin, playSound, revealTime });

  // Keep stable ref to startGame for effects
  const startGameRef = useRef(startGame);
  startGameRef.current = startGame;

  // Mount: start game once
  useEffect(() => {
    startGameRef.current(8);
  }, []); // eslint-disable-line

  // Start timer once preview ends
  useEffect(() => {
    if (gameStarted) startTimer();
  }, [gameStarted]); // eslint-disable-line

  // Show win banner when all pairs matched
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
  const handleRestart = useCallback(() => {
    setWinData(null);
    setConfetti(false);
    resetTimer();
    startGame(numCards);
  }, [numCards, resetTimer, startGame]);

  const handleNumCardsChange = useCallback((n) => {
    setNumCards(n);
    setWinData(null);
    setConfetti(false);
    resetTimer();
    startGame(n);
  }, [resetTimer, startGame]);

  const handleRevealTimeChange = useCallback((t) => {
    setRevealTime(t);
    // Will take effect on next restart since revealTimeRef is kept current in hook
  }, []);

  const handleUploadWrapped = useCallback((files) => {
    setUploadLabel(`✓ Uploaded (${files.length})`);
    // Wait for FileReader to finish, then restart game with custom images
    handleUpload(files, () => {
      setWinData(null);
      setConfetti(false);
      resetTimer();
      startGame(numCards);
    });
  }, [handleUpload, numCards, resetTimer, startGame]);

  // Live score (updates every second)
  const liveScore = matchCount > 0
    ? calcScore(matchCount, errorCount, seconds)
    : '—';

  return (
    <div className={styles.app}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      <ConfettiCanvas active={confetti} />

      <LeftSidebar
        numCards={numCards}
        onNumCardsChange={handleNumCardsChange}
        revealTime={revealTime}
        onRevealTimeChange={handleRevealTimeChange}
        onUpload={handleUploadWrapped}
        uploadLabel={uploadLabel}
      />

      <main className={styles.center}>
        <div className={styles.boardArea}>
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
        </div>
      </main>

      <RightSidebar
        timer={format(seconds)}
        errors={errorCount}
        matchCount={matchCount}
        totalPairs={totalPairs}
        score={liveScore}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onRestart={handleRestart}
        winData={winData}
      />

      <audio id="bell-sound"   src="assets/audio/bell2.mp3"   preload="auto" />
      <audio id="buzzer-sound" src="assets/audio/buzzer2.mp3" preload="auto" />
      <audio id="swipe-sound"  src="assets/audio/swipe.mp3"   preload="auto" />
      <audio id="win-sound"    src="assets/audio/win.mp3"     preload="auto" />
    </div>
  );
}
