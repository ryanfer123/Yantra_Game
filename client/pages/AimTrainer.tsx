import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const GRID_SIZE = 5;
const GAME_DURATION = 45; // seconds

function randomPos(): [number, number] {
  return [
    Math.floor(Math.random() * GRID_SIZE),
    Math.floor(Math.random() * GRID_SIZE),
  ];
}

function calcScore(hits: number): number {
  // 0 hits → 60,  60+ hits → 100 (linear scale, clamped)
  const pointsAdded = (hits / 60) * 40;
  return Math.max(60, Math.min(100, 60 + Math.floor(pointsAdded)));
}

export default function AimTrainer() {
  const navigate = useNavigate();

  // ── Game states: "start" | "playing" | "over" ──
  const [gamePhase, setGamePhase] = useState<"start" | "playing" | "over">("start");

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  useEffect(() => {
    if (gamePhase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGamePhase("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gamePhase]);
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  // ── Target position ──
  const [targetPos, setTargetPos] = useState<[number, number]>(randomPos);

  // ── Ammo & Shield ──
  const [ammo, setAmmo] = useState(1000);
  const [shield, setShield] = useState(200);
  const clickCountRef = useRef(0);
  const [glitchesEliminated, setGlitchesEliminated] = useState(0);

  // ── Start / Restart game ──
  const startGame = useCallback(() => {
    setTimeLeft(GAME_DURATION);
    setGlitchesEliminated(0);
    setAmmo(1000);
    setShield(200);
    clickCountRef.current = 0;
    setTargetPos(randomPos());
    setGamePhase("playing");
    setShowLoading(false);
  }, []);

  // ── Grid target hit ──
  const handleTargetHit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (gamePhase !== "playing") return;
    setGlitchesEliminated((g) => g + 1);
    setAmmo((a) => Math.max(0, a - 1));
    clickCountRef.current += 1;
    if (clickCountRef.current % 13 === 0) {
      setShield((s) => Math.max(0, s - 10));
    }
    setTargetPos(randomPos());
  }, [gamePhase]);

  // ── Background click (miss) ──
  const handleMiss = useCallback(() => {
    if (gamePhase !== "playing") return;
    if (ammo <= 0) return;
    setAmmo((a) => a - 1);
    clickCountRef.current += 1;
    if (clickCountRef.current % 13 === 0) {
      setShield((s) => Math.max(0, s - 10));
    }
  }, [gamePhase, ammo]);

  // ── Cursor position (coordinates display) ──
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCursor({
      x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
    });
  }, []);

  // ── Radar sweep angle ──
  const [sweepAngle, setSweepAngle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSweepAngle((a) => (a + 3) % 360), 30);
    return () => clearInterval(id);
  }, []);

  // ── Audio bars (auto-animating sliders) ──
  const [bars, setBars] = useState(() =>
    Array.from({ length: 9 }, () => 20 + Math.random() * 60)
  );
  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => {
        const next = [...prev];
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = 10 + Math.random() * 70;
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // ── Radio messages (cycle like F1 radio) ──
  const radioMessages = [
    "SECURE THE FRONTLINE",
    "NEXT WAVE OF GLITCHES INCOMING",
    "LEAVE NO GLITCH ALIVE",
  ];
  const [radioIdx, setRadioIdx] = useState(0);
  const [radioActive, setRadioActive] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setRadioActive(false);
      setTimeout(() => {
        setRadioIdx((i) => (i + 1) % 3);
        setRadioActive(true);
      }, 800);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // ── "FOR THE O.S." text flash ──
  const [flashBright, setFlashBright] = useState(false);
  useEffect(() => {
    const flash = () => {
      setFlashBright(true);
      setTimeout(() => setFlashBright(false), 600);
    };
    const id = setInterval(flash, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // ── Task popup ──
  const [showTaskPopup, setShowTaskPopup] = useState(false);

  // ── Loading screen (shown when game ends) ──
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (gamePhase === "over" && !showLoading) {
      setShowLoading(true);
    }
  }, [gamePhase, showLoading]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onClick={handleMiss}
      style={{ fontFamily: "'Jura', sans-serif" }}
    >
      {/* Background image (nighttime cityscape) */}
      <img
        src="/aim-bg-new.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {/* Grid overlay */}
      <img
        src="/aim-grid.svg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-15"
      />

      {/* ═══ FLEX HUD LAYOUT ═══ */}
      <div className="absolute inset-0 z-10 flex flex-col p-4 sm:p-6 lg:p-8 pointer-events-none">

        {/* ─── TOP ROW ─── */}
        <div className="flex items-start justify-between gap-4 shrink-0">
          {/* Top Left: EXIT + Coordinates & Location */}
          <div className="flex items-start gap-3 pointer-events-auto">
            <button
              onClick={() => navigate("/play")}
              className="px-3 py-1.5 border border-[#6ec4e5]/40 bg-black/50 text-[#6ec4e5] font-bold text-xs uppercase hover:bg-[#6ec4e5]/20 transition-colors shrink-0"
            >
              ← EXIT
            </button>
            <div>
              <div className="font-bold text-[#6ec4e5] text-xs sm:text-sm uppercase leading-snug">
                <p>23.2139 N</p>
                <p>58.932 W</p>
                <p>
                  <span className="text-white">ALT :</span>{" "}
                  <span className="text-[#6ec4e5]">9000m</span>
                </p>
              </div>
              <div className="font-bold text-xs sm:text-sm uppercase leading-snug mt-2 sm:mt-4">
                <p><span className="text-white">LOCATION :</span></p>
                <p className="text-[#6ec4e5]">XX HORIZON</p>
                <p className="text-[#6ec4e5]">FRONT II</p>
              </div>
            </div>
          </div>

          {/* Top Center: Wave timer */}
          <div className="text-center shrink-0">
            <p className="font-bold text-white text-sm sm:text-lg uppercase">
              WAVE PERSISTING FOR
            </p>
            <p className="font-bold text-[#6ec4e5] text-xl sm:text-3xl">
              {mins}:{secs}
            </p>
          </div>

          {/* Top Right: TASK button + Radar */}
          <div className="flex items-start gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTaskPopup(true); }}
              className="px-3 py-1.5 border border-[#6ec4e5]/40 bg-black/50 text-[#6ec4e5] font-bold text-xs uppercase hover:bg-[#6ec4e5]/20 transition-colors pointer-events-auto shrink-0"
            >
              TASK
            </button>
            <div className="w-28 h-28 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-[#6ec4e5]/30 bg-[#0a1a2a]/70 relative overflow-hidden shrink-0">
              <div className="absolute inset-[25%] rounded-full border border-[#6ec4e5]/15" />
              <div className="absolute inset-[40%] rounded-full border border-[#6ec4e5]/15" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#6ec4e5]/15" />
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[#6ec4e5]/15" />
              <div
                className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
                style={{
                  transform: `rotate(${sweepAngle}deg)`,
                  background: "linear-gradient(90deg, #6ec4e5 0%, transparent 100%)",
                  boxShadow: "0 0 12px 3px rgba(110,196,229,0.3)",
                }}
              />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6ec4e5]" />
            </div>
          </div>
        </div>

        {/* ─── MIDDLE ROW (flex-1) ─── */}
        <div className="flex-1 flex items-stretch justify-between gap-4 min-h-0 py-2 sm:py-4">
          {/* Middle Left: Globe + FOR THE O.S. */}
          <div className="flex flex-col items-center justify-start gap-2 sm:gap-4 shrink-0 w-36 sm:w-44 lg:w-52">
            {/* Globe */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t border-l border-[#6ec4e5]/40" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t border-r border-[#6ec4e5]/40" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b border-l border-[#6ec4e5]/40" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b border-r border-[#6ec4e5]/40" />
              <svg viewBox="0 0 200 200" className="w-full h-full opacity-40" fill="none" stroke="#6ec4e5" strokeWidth="0.8">
                <circle cx="100" cy="100" r="85" strokeWidth="1" />
                <ellipse cx="100" cy="60" rx="78" ry="8" />
                <ellipse cx="100" cy="80" rx="83" ry="6" />
                <ellipse cx="100" cy="100" rx="85" ry="4" strokeWidth="1" />
                <ellipse cx="100" cy="120" rx="83" ry="6" />
                <ellipse cx="100" cy="140" rx="78" ry="8" />
                <ellipse cx="100" cy="100" rx="4" ry="85" strokeWidth="1" />
                <ellipse cx="100" cy="100" rx="42" ry="85" />
                <ellipse cx="100" cy="100" rx="74" ry="85" />
                <line x1="30" y1="50" x2="170" y2="150" strokeWidth="0.4" opacity="0.3" />
              </svg>
            </div>
            <p className="text-[#6ec4e5]/40 text-[10px] font-bold uppercase tracking-widest">SECTOR MAP</p>

            {/* FOR THE O.S. */}
            <div
              className="text-[10px] sm:text-[11px] font-bold uppercase leading-[1.6]"
              style={{ opacity: flashBright ? 1 : 0.35, transition: "opacity 0.3s", textShadow: flashBright ? '0 0 8px #6ec4e5, 0 0 16px #6ec4e5' : 'none' }}
            >
              <div className="flex gap-4 sm:gap-6">
                <div className="text-center">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <p key={i}><span className="text-white">FOR THE</span>{" "}<span className="text-[#6ec4e5]">O.S.</span></p>
                  ))}
                </div>
                <div className="text-center">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <p key={i}><span className="text-white">FOR THE</span>{" "}<span className="text-[#6ec4e5]">O.S.</span></p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Center: 5×5 Invisible Aim Grid (glitches appear randomly) */}
          <div className="flex-1 flex items-center justify-center">
            {gamePhase === "playing" && (
              <div className="grid grid-cols-5 w-full h-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                  const r = Math.floor(idx / GRID_SIZE);
                  const c = idx % GRID_SIZE;
                  const isTarget = r === targetPos[0] && c === targetPos[1];
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={isTarget ? handleTargetHit : handleMiss}
                      className={`flex items-center justify-center cursor-crosshair transition-all duration-150 ${
                        isTarget
                          ? "text-3xl sm:text-4xl lg:text-5xl hover:scale-110"
                          : ""
                      }`}
                    >
                      {isTarget && <span className="drop-shadow-[0_0_12px_rgba(110,196,229,0.6)]">👾</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Middle Right: Ammo/Shield + Audio bars */}
          <div className="flex flex-col items-end justify-start gap-3 sm:gap-4 shrink-0">
            {/* Ammo & Shield */}
            <div className="border border-white/30 bg-[#0a1428]/60 px-4 sm:px-6 py-3 sm:py-4 w-48 sm:w-56 lg:w-64">
              <p className="font-bold text-sm sm:text-base uppercase">
                <span className="text-white">AMMO LEFT :</span>{" "}
                <span className="text-[#6ec4e5] inline-block w-12 sm:w-14 text-right tabular-nums">{ammo}</span>
              </p>
              <p className="font-bold text-sm sm:text-base uppercase mt-1">
                <span className="text-white">SHIELD :</span>{" "}
                <span className="text-[#6ec4e5] inline-block w-12 sm:w-14 text-right tabular-nums">{shield}</span>
              </p>
            </div>

            {/* Audio bars (auto-animating sliders) */}
            <div className="flex flex-col gap-1">
              {bars.map((w, i) => (
                <div key={i} className="flex items-center h-5">
                  <div className="relative h-3 bg-[#6ec4e5]/10 border border-[#6ec4e5]/20 w-32 sm:w-40 lg:w-[200px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#6ec4e5]"
                      style={{ width: `${w}%`, transition: 'width 1.5s ease-in-out', opacity: 0.7 }}
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white/80" style={{ left: `${w}%`, transition: 'left 1.5s ease-in-out', transform: 'translate(-50%, -50%)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── BOTTOM ROW ─── */}
        <div className="flex items-end justify-between gap-4 shrink-0">
          {/* Bottom Left: Vitals + Coordinates */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="border border-white/30 bg-[#0a1428]/60 px-4 sm:px-6 py-2 sm:py-3">
              <p className="font-bold text-sm sm:text-base uppercase">
                <span className="text-white">VITALS :</span>{" "}
                <span className="text-[#6ec4e5]">GOOD</span>
              </p>
            </div>
            <div className="border border-white/30 bg-[#0a1428]/60 px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-bold text-xs sm:text-sm text-white uppercase">Coordinates</p>
              <p className="font-bold text-xs sm:text-sm uppercase mt-1">
                <span className="text-white">X :</span>{" "}
                <span className="text-[#6ec4e5]">{cursor.x}</span>
              </p>
              <p className="font-bold text-xs sm:text-sm uppercase">
                <span className="text-white">Y :</span>{" "}
                <span className="text-[#6ec4e5]">{cursor.y}</span>
              </p>
            </div>
          </div>

          {/* Bottom Center: Glitches eliminated */}
          <div className="text-center">
            <p className="font-bold text-lg sm:text-2xl uppercase">
              <span className="text-white">GLITCHES ELIMINATED :</span>{" "}
              <span className="text-[#6ec4e5]">{glitchesEliminated}</span>
            </p>
          </div>

          {/* Bottom Right: Radio message card */}
          <div className="border border-white/30 bg-[#0a1428]/60 px-4 sm:px-5 py-3 sm:py-4 w-48 sm:w-56 lg:w-64 h-24 sm:h-28 flex flex-col items-center justify-center">
            <div className="flex items-end justify-center gap-[2px] h-6 sm:h-8 mb-2 sm:mb-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-[2px] bg-[#6ec4e5]/70 ${radioActive ? 'animate-audio-bar' : ''}`}
                  style={{
                    animationDelay: radioActive ? `${i * 0.06}s` : undefined,
                    animationDuration: radioActive ? `${0.6 + Math.sin(i) * 0.3}s` : undefined,
                    height: radioActive ? undefined : '3px',
                    transition: 'height 0.3s ease',
                  }}
                />
              ))}
            </div>
            <p className="font-bold text-[10px] sm:text-xs text-[#6ec4e5] uppercase text-center animate-radio-fade" key={radioIdx}>
              {radioMessages[radioIdx]}
            </p>
          </div>
        </div>
      </div>

      {/* ─── CENTER: Custom crosshair (diamond reticle) ─── */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{
          left: `${cursor.x}%`,
          top: `${cursor.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <img src="/aim-crosshair-new.svg" alt="" className="w-24 h-14" style={{ filter: 'drop-shadow(0 0 6px rgba(106,186,237,0.4))' }} />
      </div>

      {/* ─── CENTER: HUD crosshair indicator (static) ─── */}
      <div className="absolute left-1/2 top-[47%] -translate-x-1/2 z-10 pointer-events-none">
        <img src="/aim-hud.svg" alt="" className="w-16 h-10 opacity-40" />
      </div>

      {/* ─── TASK POPUP (placeholder) ─── */}
      {showTaskPopup && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-auto">
          <div className="relative border-2 border-[#6ec4e5] bg-[#0a1428]/90 p-6 sm:p-8 max-w-md w-full mx-4">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTaskPopup(false); }}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-[#6ec4e5] border border-[#6ec4e5]/40 hover:bg-[#6ec4e5]/20 transition-colors font-bold text-sm"
            >
              ✕
            </button>
            <h2 className="font-bold text-xl text-[#6ec4e5] uppercase text-center mb-4">
              MISSION TASK
            </h2>
            <p className="text-white/70 text-sm text-center mb-6">
              Task placeholder — details coming soon.
            </p>
            <button
              onClick={handleCompleteTask}
              className="w-full py-2 border border-[#6ec4e5] text-[#6ec4e5] font-bold uppercase text-sm hover:bg-[#6ec4e5]/20 transition-colors"
            >
              COMPLETE TASK
            </button>
          </div>
        </div>
      )}

      {/* ─── START SCREEN ─── */}
      {gamePhase === "start" && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 pointer-events-auto"
          style={{ fontFamily: "'Jura', sans-serif" }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(110,196,229,0.08) 2px, rgba(110,196,229,0.08) 4px)' }}
          />
          <p className="text-[#6ec4e5]/60 text-xs uppercase tracking-[0.3em] mb-4">
            // MISSION BRIEFING
          </p>
          <h2 className="font-bold text-3xl sm:text-4xl text-[#6ec4e5] uppercase tracking-widest mb-3">
            TERMINATE THE GLITCH
          </h2>
          <p className="text-white/50 text-sm uppercase tracking-wider mb-2">
            PROTOCOL: ELIMINATE GLITCHES FOR <span className="text-[#6ec4e5] font-bold">{GAME_DURATION}s</span>
          </p>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-8">
            CLICK THE 👾 TO ELIMINATE • MISSES COST AMMO
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 border-2 border-[#6ec4e5] text-[#6ec4e5] font-bold text-lg uppercase tracking-wider hover:bg-[#6ec4e5]/20 transition-colors"
          >
            START MISSION
          </button>
          <button
            onClick={() => navigate("/play")}
            className="mt-4 px-6 py-2 border border-white/20 text-white/40 font-bold text-xs uppercase hover:text-white/70 transition-colors"
          >
            ← BACK TO BASE
          </button>
        </div>
      )}

      {/* ─── GAME OVER SCREEN ─── */}
      {showLoading && gamePhase === "over" && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 pointer-events-auto animate-loading-fade-in"
          style={{ fontFamily: "'Jura', sans-serif" }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(110,196,229,0.08) 2px, rgba(110,196,229,0.08) 4px)' }}
          />
          <div className="absolute top-[30%] left-0 right-0 h-px bg-[#6ec4e5]/20" />
          <div className="absolute top-[70%] left-0 right-0 h-px bg-[#6ec4e5]/20" />

          <p className="text-[#6ec4e5]/60 text-xs uppercase tracking-[0.3em] mb-6">
            // TIME LIMIT REACHED
          </p>
          <h2 className="font-bold text-2xl sm:text-3xl text-[#6ec4e5] uppercase tracking-widest mb-3">
            WAVE COMPLETE
          </h2>

          <div className="flex gap-8 sm:gap-12 my-6">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">TOTAL GLITCHES</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{glitchesEliminated}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">MISSION SCORE</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{calcScore(glitchesEliminated)}</p>
            </div>
          </div>

          <p className="text-white/50 text-sm uppercase tracking-wider mb-8">
            STATUS : <span className={`font-bold ${calcScore(glitchesEliminated) > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
              {calcScore(glitchesEliminated) > 80 ? 'AUTHORITY APPROVED' : 'STANDARD PERFORMANCE'}
            </span>
          </p>

          <div className="flex gap-4">
            <button
              onClick={startGame}
              className="px-6 py-2 border-2 border-[#6ec4e5] text-[#6ec4e5] font-bold text-sm uppercase tracking-wider hover:bg-[#6ec4e5]/20 transition-colors"
            >
              RE-CALIBRATE
            </button>
            <button
              onClick={() => navigate("/play")}
              className="px-6 py-2 border border-white/30 text-white/60 font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              RETURN TO BASE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
