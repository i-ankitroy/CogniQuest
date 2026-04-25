import React from 'react';
import Card from './Card';
import styles from './Board.module.css';

export default function Board({ cards, numCards, onCardClick }) {
  const gridClass = numCards === 8
    ? styles.grid2x4
    : numCards === 10
    ? styles.grid2x5
    : styles.grid2x6;

  return (
    <div className={`${styles.board} ${gridClass}`}>
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
