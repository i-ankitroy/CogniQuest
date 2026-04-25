import { useState, useRef, useEffect } from 'react';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const isMutedRef = useRef(false);

  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  };

  const toggleMusic = () => {
    const musicEl = document.getElementById('ambient-music');
    if (!musicEl) return;

    if (isMusicPlaying) {
      musicEl.pause();
      setIsMusicPlaying(false);
    } else {
      musicEl.play().catch(() => {});
      setIsMusicPlaying(true);
    }
  };

  const playSound = (id) => {
    if (isMutedRef.current) return;
    const el = document.getElementById(id);
    if (el) { el.currentTime = 0; el.play().catch(() => {}); }
  };

  // Sync music volume with mute state
  useEffect(() => {
    const musicEl = document.getElementById('ambient-music');
    if (musicEl) {
      musicEl.muted = isMuted;
    }
  }, [isMuted]);

  return { isMuted, isMusicPlaying, toggleMute, toggleMusic, playSound };
}
