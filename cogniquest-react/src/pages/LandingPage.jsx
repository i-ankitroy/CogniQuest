import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      {/* Orbs */}
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
      <div className={`${styles.orb} ${styles.orbGaming}`} />

      {/* Floating 3D card backs */}
      <div className={styles.floatingCards}>
        {[1,2,3,4].map(n => (
          <div key={n} className={`${styles.floatCard} ${styles[`fc${n}`]}`}>
            <div className={styles.cardBack}>
              <div className={styles.backGlow} />
              <span className={styles.cqText}>CQ</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.badge}>⚡ The Ultimate Memory Challenge</div>

        <h1 className={styles.title}>
          Cogni<span className={styles.glow}>Quest</span>
        </h1>

        <div className={styles.pills}>
          <div className={styles.pill}>🕒 Race the Clock</div>
          <div className={styles.pill}>🧠 Sharpen Focus</div>
          <div className={styles.pill}>📸 Custom Images</div>
        </div>

        <button className={styles.playBtn} onClick={() => navigate('/game')}>
          <span className={styles.btnText}>ENTER GAME</span>
          <div className={styles.btnGlow} />
        </button>
      </div>
    </div>
  );
}
