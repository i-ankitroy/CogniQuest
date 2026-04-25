import { useState, useRef } from 'react';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  };

  const playSound = (id) => {
    if (isMutedRef.current) return;
    const el = document.getElementById(id);
    if (el) { el.currentTime = 0; el.play().catch(() => {}); }
  };

  return { isMuted, toggleMute, playSound };
}
