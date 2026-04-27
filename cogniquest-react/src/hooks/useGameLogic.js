import { useState, useRef, useCallback } from 'react';

// Exact filenames from the physical asset folder — note: file 14 has no space, 14 is skipped in original
const DEFAULT_IMAGES = [
  'assets/images/db_img/1 (1).JPG',
  'assets/images/db_img/1 (2).JPG',
  'assets/images/db_img/1 (3).JPG',
  'assets/images/db_img/1 (4).jpg',
  'assets/images/db_img/1 (5).jpg',
  'assets/images/db_img/1 (6).jpg',
  'assets/images/db_img/1 (7).jpg',
  'assets/images/db_img/1 (8).jpg',
  'assets/images/db_img/1 (9).jpg',
  'assets/images/db_img/1 (10).jpg',
  'assets/images/db_img/1 (11).jpg',
  'assets/images/db_img/1 (12).jpg',
  'assets/images/db_img/1 (13).jpg',
  'assets/images/db_img/1 (15).jpg',
  'assets/images/db_img/1 (16).jpg',
  'assets/images/db_img/1 (17).jpg',
];

function buildDeck(images, numCards) {
  const pairs = numCards / 2;
  const shuffled = [...images].sort(() => Math.random() - 0.5);
  const pool = shuffled.slice(0, pairs);
  const deck = [...pool, ...pool].sort(() => Math.random() - 0.5);
  return deck.map((src, idx) => ({
    id: idx,
    image: src,
    isFlipped: true,    // start revealed for preview
    isMatched: false,
    isWrong: false,
  }));
}

export function useGameLogic({ onWin, onMatch, playSound, revealTime }) {
  const [cards, setCards]           = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [customImages, setCustomImages] = useState([]);
  const [useCustom, setUseCustom]   = useState(false);

  // Refs to avoid stale closures & prevent double-fire side effects
  const cardsRef        = useRef([]);
  const firstCardRef    = useRef(null);
  const lockBoardRef    = useRef(false);
  const matchCountRef   = useRef(0);
  const errorCountRef   = useRef(0);
  const totalPairsRef   = useRef(0);
  const customImagesRef = useRef([]);
  const useCustomRef    = useRef(false);
  const revealTimeRef   = useRef(revealTime);

  // Keep revealTimeRef current every render
  revealTimeRef.current = revealTime;

  const calcScore = (pairs, errors, secs) =>
    Math.max(0, pairs * 150 - errors * 20 + Math.max(0, 300 - secs * 2));

  const startGame = useCallback((numCards) => {
    const pool = useCustomRef.current && customImagesRef.current.length > 0
      ? customImagesRef.current
      : DEFAULT_IMAGES;

    const deck  = buildDeck(pool, numCards);
    const pairs = numCards / 2;

    // Reset all refs
    totalPairsRef.current  = pairs;
    matchCountRef.current  = 0;
    errorCountRef.current  = 0;
    firstCardRef.current   = null;
    lockBoardRef.current   = true;
    cardsRef.current       = deck;

    // Reset all state
    setCards([...deck]);
    setTotalPairs(pairs);
    setMatchCount(0);
    setErrorCount(0);
    setGameStarted(false);

    // After preview time: hide all cards and unlock board
    const rt = revealTimeRef.current;
    setTimeout(() => {
      const hidden = cardsRef.current.map(c => ({ ...c, isFlipped: false }));
      cardsRef.current = hidden;
      setCards([...hidden]);
      lockBoardRef.current = false;
      setGameStarted(true);
    }, rt);
  }, []); // stable — uses refs only, no state deps

  const flipCard = useCallback((id) => {
    if (lockBoardRef.current) return;

    // Operate on ref directly — never inside a setState(prev=>{}) to avoid StrictMode double-calls
    const current = cardsRef.current;
    const card    = current.find(c => c.id === id);

    if (!card || card.isFlipped || card.isMatched) return;

    // Flip this card
    const afterFlip = current.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    cardsRef.current = afterFlip;
    setCards([...afterFlip]);
    playSound('swipe-sound');

    // First card of a pair
    if (!firstCardRef.current) {
      firstCardRef.current = card;
      return;
    }

    // Second card — evaluate
    const first = firstCardRef.current;
    firstCardRef.current = null;

    if (first.image === card.image) {
      // ── MATCH ──
      playSound('bell-sound');
      const matched = cardsRef.current.map(c =>
        c.id === id || c.id === first.id
          ? { ...c, isFlipped: true, isMatched: true, isWrong: false }
          : c
      );
      cardsRef.current = matched;
      setCards([...matched]);

      const newMatch = matchCountRef.current + 1;
      matchCountRef.current = newMatch;
      setMatchCount(newMatch);

      // Fire onMatch so the UI can trigger the fall animation
      if (onMatch) onMatch([first.id, id], first.image);

      if (newMatch === totalPairsRef.current) {
        setTimeout(() => onWin(), 800);
      }

    } else {
      // ── MISMATCH ──
      lockBoardRef.current = true;
      playSound('buzzer-sound');

      const newErr = errorCountRef.current + 1;
      errorCountRef.current = newErr;
      setErrorCount(newErr);

      // Mark wrong
      const wrong = cardsRef.current.map(c =>
        c.id === id || c.id === first.id
          ? { ...c, isWrong: true }
          : c
      );
      cardsRef.current = wrong;
      setCards([...wrong]);

      setTimeout(() => {
        const flipped = cardsRef.current.map(c =>
          (c.id === id || c.id === first.id) && !c.isMatched
            ? { ...c, isFlipped: false, isWrong: false }
            : c
        );
        cardsRef.current = flipped;
        setCards([...flipped]);
        lockBoardRef.current = false;
      }, 900);
    }
  }, [onWin, playSound]);

  const handleUpload = useCallback((files, onComplete) => {
    Promise.all(
      Array.from(files).map(f => new Promise(resolve => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(f);
      }))
    ).then(imgs => {
      customImagesRef.current = imgs;
      useCustomRef.current    = true;
      setCustomImages(imgs);
      setUseCustom(true);
      if (onComplete) onComplete();
    });
  }, []);

  return {
    cards, matchCount, errorCount, totalPairs, gameStarted,
    startGame, flipCard, handleUpload, useCustom, calcScore,
  };
}
