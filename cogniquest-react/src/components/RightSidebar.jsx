import React from 'react';
import styles from './RightSidebar.module.css';

export default function RightSidebar({ isMuted, onToggleMute, isMusicPlaying, onToggleMusic }) {
  return (
    <aside className={styles.sidebar}>

      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>How to Play</h3>
        <ul className={styles.infoList}>
          <li>Observe the cards during the preview phase.</li>
          <li>Click to flip and uncover matching pairs.</li>
          <li>Complete the board as fast as you can.</li>
        </ul>
      </div>

      <div className={styles.divider} />

      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>Scoring Rules</h3>
        <div className={styles.scoreRule}>
          <span className={styles.scoreBadge}>+150</span>
          <span className={styles.scoreText}>Per matched pair</span>
        </div>
        <div className={styles.scoreRule}>
          <span className={`${styles.scoreBadge} ${styles.negative}`}>-20</span>
          <span className={styles.scoreText}>Per mistake made</span>
        </div>
        <div className={styles.scoreRule}>
          <span className={`${styles.scoreBadge} ${styles.bonus}`}>Time</span>
          <span className={styles.scoreText}>Speed bonus applied</span>
        </div>
      </div>

      <div className={styles.bottomActions}>
        <div className={styles.idleNudge}>← Configure & click Start</div>
        <button
          className={`${styles.actionBtn} ${isMusicPlaying ? styles.activeMusic : ''}`}
          onClick={onToggleMusic}
        >
          {isMusicPlaying ? '🎵' : '📻'} &nbsp;{isMusicPlaying ? 'Music Playing' : 'Ambient Music'}
        </button>
        <button
          className={`${styles.actionBtn} ${isMuted ? styles.muted : ''}`}
          onClick={onToggleMute}
        >
          {isMuted ? '🔇' : '🔊'} &nbsp;{isMuted ? 'SFX Off' : 'SFX On'}
        </button>
      </div>
    </aside>
  );
}
