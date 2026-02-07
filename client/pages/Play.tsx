import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CivilianCharacter from "@/components/CivilianCharacter";
import { useGameState } from "@/hooks/use-game-state";
import { auth, onAuthStateChanged, type User } from "@/lib/firebase";
import { refreshToken } from "@/lib/firebase";

const labScene = "/lab-scene.png";

export default function Play() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth guard – redirect to login if not signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) navigate("/game");
    });
    return unsub;
  }, [navigate]);

  // Refresh token every 50 minutes (tokens expire in 60 min)
  useEffect(() => {
    const interval = setInterval(() => refreshToken(), 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);



  // Read session from localStorage (set after login/join)
  const sessionId = localStorage.getItem("sessionId");
  const { state } = useGameState(sessionId);

  const health = state?.globalHealth ?? 100;
  const round = state?.currentRound ?? 1;
  const role = state?.playerRole ?? "citizen";
  const trustScore = state?.playerTrustScore ?? 0;
  const totalPlayers = state?.totalPlayers ?? (user ? 1 : 0);

  // WASD hint – show briefly then fade
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#1f2227] flex items-center justify-center">
        <span className="font-pixel text-sm text-pixel-cyan animate-pulse">LOADING...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1f2227]">
      <img
        src={labScene}
        alt="Lab scene"
        className="absolute inset-0 h-full w-full object-cover pixelated"
      />

      {/* Civilian character – move with W A S D */}
      <CivilianCharacter />

      {/* Top status bar – health */}
      <div className="relative z-10 mx-auto mt-4 w-[92%] max-w-5xl">
        <div className="relative flex h-7 sm:h-8 w-full overflow-hidden border-2 border-[#2b3446] bg-[#1b202b] shadow-[0_0_0_2px_rgba(12,14,20,0.7)]">
          <div
            className="h-full bg-[#2c7a54] health-bar-disintegrate transition-[width] duration-700"
            style={{ width: `${health}%` }}
          />
          <div className="h-full flex-1 bg-[#2e3654]" />
          {/* Chevron join */}
          <div
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 bg-[#2e3654] [clip-path:polygon(0_0,100%_50%,0_100%,18%_50%)] sm:h-7 sm:w-7 transition-[left] duration-700"
            style={{ left: `${health}%` }}
          />
          {/* Health text */}
          <span className="absolute inset-0 flex items-center justify-center font-pixel text-[10px] sm:text-xs text-white/80 tracking-wider">
            SYSTEM HEALTH {health}%
          </span>
        </div>
      </div>

      {/* HUD – round, role, trust score */}
      <div className="absolute z-10 top-14 left-4 sm:left-8 flex flex-col gap-1">
        <span className="font-pixel text-[10px] sm:text-xs text-pixel-cyan uppercase">
          Round {round}/4
        </span>
        <span className="font-pixel text-[10px] sm:text-xs text-pixel-cream uppercase">
          Role: {role}
        </span>
        <span className="font-pixel text-[10px] sm:text-xs text-gray-400 uppercase">
          Trust: {trustScore}
        </span>
        {user && (
          <span className="font-pixel text-[10px] sm:text-xs text-gray-500">
            {user.displayName}
          </span>
        )}
      </div>

      {/* Player count */}
      <div className="absolute z-10 top-14 right-4 sm:right-8 flex flex-col items-end gap-1">
        <span className="font-pixel text-[10px] sm:text-xs text-gray-400 uppercase">
          Players: {totalPlayers}
        </span>
      </div>

      {/* WASD controls hint */}
      {showHint && (
        <div className="absolute z-30 inset-0 flex items-center justify-center pointer-events-none animate-fade-out">
          <div className="bg-black/70 border border-pixel-cyan/50 px-6 py-4 flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <span className="font-pixel text-sm text-pixel-cyan border border-pixel-cyan/40 bg-pixel-cyan/10 w-8 h-8 flex items-center justify-center">W</span>
            </div>
            <div className="flex gap-1">
              <span className="font-pixel text-sm text-pixel-cyan border border-pixel-cyan/40 bg-pixel-cyan/10 w-8 h-8 flex items-center justify-center">A</span>
              <span className="font-pixel text-sm text-pixel-cyan border border-pixel-cyan/40 bg-pixel-cyan/10 w-8 h-8 flex items-center justify-center">S</span>
              <span className="font-pixel text-sm text-pixel-cyan border border-pixel-cyan/40 bg-pixel-cyan/10 w-8 h-8 flex items-center justify-center">D</span>
            </div>
            <span className="font-pixel text-[10px] text-gray-400 mt-1">USE KEYS TO MOVE</span>
          </div>
        </div>
      )}
    </div>
  );
}
