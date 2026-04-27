import { useEffect, useRef, useState } from "react";

export function useMusic(src, { volume = 0.4 } = {}) {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("canplaythrough", () => setReady(true));

    // autoplay — browser butuh interaksi user pertama
    const tryPlay = () => {
      audio.play().catch(() => {});
      window.removeEventListener("click", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };

    // coba langsung, kalau gagal tunggu interaksi
    audio.play().catch(() => {
      window.addEventListener("click", tryPlay);
      window.addEventListener("keydown", tryPlay);
    });

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("click", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
  }, [src]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(v => !v);
  };

  return { muted, toggleMute, ready };
}