import React from 'react';
import styles from './Card.module.css';

export default function Card({ card, onClick, numCards }) {
  const { isFlipped, isMatched, isWrong, image } = card;

  const cls = [
    styles.card,
    isFlipped || isMatched ? styles.flipped : '',
    isMatched ? styles.matched : '',
    isWrong ? styles.wrong : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.wrap} ${numCards === 12 ? styles.sm : ''}`}>
      <div className={cls} onClick={() => !isMatched && onClick(card.id)}>
        <div className={`${styles.face} ${styles.back}`}>
          <div className={styles.backPattern}></div>
          <div className={styles.backIcon}>CQ</div>
        </div>
        <div className={`${styles.face} ${styles.front}`}>
          <img src={image} alt="card" draggable={false} />
        </div>
      </div>
    </div>
  );
}
