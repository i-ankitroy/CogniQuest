import React, { useRef } from 'react';
import styles from './LeftSidebar.module.css';

const GRID_OPTIONS = [
  { label: '2×4', badge: '8 cards',  val: 8  },
  { label: '2×5', badge: '10 cards', val: 10 },
  { label: '2×6', badge: '12 cards', val: 12 },
];

const TIME_OPTIONS = [
  { label: '2 seconds', val: 2000 },
  { label: '3 seconds', val: 3000 },
  { label: '4 seconds', val: 4000 },
];

export default function LeftSidebar({
  numCards, onNumCardsChange,
  revealTime, onRevealTimeChange,
  onUpload, uploadLabel,
}) {
  const fileInputRef = useRef(null);

  return (
    <aside className={styles.sidebar}>
      <a href="/" className={styles.logoLink}>
        <div className={styles.logo}>Cogni<span>Quest</span></div>
        <div className={styles.logoSub}>Memory Card Game</div>
      </a>

      <div className={styles.divider} />

      <div>
        <div className={styles.sectionLabel}>Images</div>
        <button
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current.click()}
        >
          ⊕ &nbsp;{uploadLabel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => onUpload(e.target.files)}
        />
      </div>

      <div>
        <div className={styles.sectionLabel}>Grid Size</div>
        <div className={styles.btnGroup}>
          {GRID_OPTIONS.map(o => (
            <button
              key={o.val}
              className={`${styles.optBtn} ${numCards === o.val ? styles.active : ''}`}
              onClick={() => onNumCardsChange(o.val)}
            >
              {o.label}
              <span className={styles.badge}>{o.badge}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Preview Time</div>
        <div className={styles.btnGroup}>
          {TIME_OPTIONS.map(o => (
            <button
              key={o.val}
              className={`${styles.optBtn} ${revealTime === o.val ? styles.active : ''}`}
              onClick={() => onRevealTimeChange(o.val)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
