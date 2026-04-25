import React from 'react';
import styles from './IdleBoard.module.css';

export default function IdleBoard() {
  return (
    <div className={styles.board}>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className={styles.wrap}
          style={{ '--i': i }}
        >
          <div className={styles.card}>
            <div className={styles.back}>
              <div className={styles.pattern} />
              <span className={styles.cq}>CQ</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
