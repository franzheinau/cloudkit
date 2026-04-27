import { createContext, useContext } from "react";
import { useMusic } from "../hooks/useMusic";

const MusicCtx = createContext(null);

const MUSIC_URL = "https://files.catbox.moe/2zeyfo.mp3"; // ← ganti ini

export function MusicProvider({ children }) {
  const music = useMusic(MUSIC_URL, { volume: 0.35 });
  return <MusicCtx.Provider value={music}>{children}</MusicCtx.Provider>;
}

export const useMusicCtx = () => useContext(MusicCtx);