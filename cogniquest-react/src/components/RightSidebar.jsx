import React from 'react';
import styles from './RightSidebar.module.css';

export default function RightSidebar({
  timer, errors, matchCount, totalPairs, score,
  isMuted, onToggleMute, onRestart,
  winData, // { time, errors, score } when game is won
}) {
  const scoreTooltip = `Calculation:\nBase: Pairs × 150\nPenalty: -20 per Error\nTime Bonus: Max(0, 300 - Time × 2)`;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.statCard}>
        <div className={styles.label}>Time</div>
        <div className={`${styles.value} ${styles.blue}`}>{timer}</div>
        <div className={styles.sub}>elapsed</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.label}>Errors</div>
        <div className={`${styles.value} ${styles.red}`}>{errors}</div>
        <div className={styles.sub}>mistakes made</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.label}>Matched</div>
        <div className={`${styles.value} ${styles.green}`}>
          {matchCount}/{totalPairs}
        </div>
        <div className={styles.sub}>pairs found</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Score</span>
          <span className={styles.infoIcon} data-tooltip={scoreTooltip}>ℹ️</span>
        </div>
        <div className={`${styles.value} ${styles.gradient}`}>{score}</div>
        <div className={styles.sub}>this round</div>
      </div>

      {/* Progress */}
      <div className={styles.progressRow}>
        <div className={styles.progressMeta}>
          <span>Progress</span>
          <span>{matchCount} of {totalPairs} pairs</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: totalPairs ? `${(matchCount / totalPairs) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Win Banner */}
      {winData && (
        <div className={styles.winCard}>
          <div className={styles.winTitle}>🎉 All matched!</div>
          <div className={styles.winSub}>Great memory — play again?</div>
          <div className={styles.winStats}>
            <span style={{ color: '#60a5fa' }}>⏱ Time: <strong>{winData.time}</strong></span>
            <span style={{ color: '#f87171' }}>❌ <strong>{winData.errors}</strong> errors</span>
            <span style={{ color: '#4ade80' }}>⭐ Score: <strong>{winData.score}</strong></span>
          </div>
          <button className={styles.playAgain} onClick={onRestart}>Play Again</button>
        </div>
      )}

      <div className={styles.bottomActions}>
        <button className={styles.actionBtn} onClick={onRestart}>🔄 &nbsp;Restart Game</button>
        <button
          className={`${styles.actionBtn} ${isMuted ? styles.muted : ''}`}
          onClick={onToggleMute}
        >
          {isMuted ? '🔇' : '🔊'} &nbsp;{isMuted ? 'Muted' : 'Sound On'}
        </button>
      </div>
    </aside>
  );
}
