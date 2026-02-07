import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function AimTrainer() {
  const navigate = useNavigate();

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(120); // 2-minute wave
  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  // ── Ammo & Shield ──
  const [ammo, setAmmo] = useState(1000);
  const [shield, setShield] = useState(200);
  const clickCountRef = useRef(0);
  const [glitchesEliminated, setGlitchesEliminated] = useState(0);

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

  // ── Click (shoot) ──
  const handleClick = () => {
    if (ammo <= 0) return;
    setAmmo((a) => a - 1);
    clickCountRef.current += 1;
    if (clickCountRef.current % 13 === 0) {
      setShield((s) => Math.max(0, s - 10));
    }
    // Random chance to "hit" a glitch
    if (Math.random() < 0.3) {
      setGlitchesEliminated((g) => g + 1);
    }
  };

  // ── Radar sweep angle ──
  const [sweepAngle, setSweepAngle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSweepAngle((a) => (a + 3) % 360), 30);
    return () => clearInterval(id);
  }, []);

  // ── Audio bars (randomize every 15s) ──
  const [bars, setBars] = useState(() =>
    Array.from({ length: 9 }, () => 20 + Math.random() * 60)
  );
  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => {
        const next = [...prev];
        // move 2-3 random bars
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = 20 + Math.random() * 60;
        }
        return next;
      });
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // ── Radio messages (cycle like F1 radio) ──
  const radioMessages = [
    "SECURE THE FRONTLINE",
    "NEXT WAVE OF GLITCHES INCOMING",
    "LEAVE NO GLITCH ALIVE",
  ];
  const [radioIdx, setRadioIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRadioIdx((i) => (i + 1) % 3), 5000);
    return () => clearInterval(id);
  }, []);

  // ── "FOR THE O.S." text flash ──
  const [flashVisible, setFlashVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(
      () => setFlashVisible((v) => !v),
      3000 + Math.random() * 2000
    );
    return () => clearInterval(id);
  }, []);

  // ── Vitals flash ──
  const [vitalsFlash, setVitalsFlash] = useState(true);
  useEffect(() => {
    const id = setInterval(
      () => setVitalsFlash((v) => !v),
      4000 + Math.random() * 3000
    );
    return () => clearInterval(id);
  }, []);

  // ── Task popup placeholder ──
  const [showTaskPopup, setShowTaskPopup] = useState(false);

  // ── Complete task → go back to portal ──
  const handleCompleteTask = () => {
    navigate("/play");
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{ fontFamily: "'Jura', 'Press Start 2P', monospace" }}
    >
      {/* Background image (space scene + grid baked in) */}
      <img
        src="/aim-bg.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {/* Grid overlay */}
      <img
        src="/aim-grid.svg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-15"
      />

      {/* ─── TOP LEFT: Coordinates & Location ─── */}
      <div className="absolute top-5 left-8 z-10">
        <div className="font-bold text-[#6ec4e5] text-sm uppercase leading-snug">
          <p>23.2139 N</p>
          <p>58.932 W</p>
          <p>
            <span className="text-white">ALT :</span>{" "}
            <span className="text-[#6ec4e5]">9000m</span>
          </p>
        </div>
        <div className="font-bold text-sm uppercase leading-snug mt-4">
          <p>
            <span className="text-white">LOCATION :</span>
          </p>
          <p className="text-[#6ec4e5]">XX HORIZON</p>
          <p className="text-[#6ec4e5]">FRONT II</p>
        </div>
      </div>

      {/* ─── TOP CENTER: Wave timer ─── */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-center">
        <p className="font-bold text-white text-lg uppercase">
          WAVE PERSISTING FOR
        </p>
        <p className="font-bold text-[#6ec4e5] text-3xl">
          {mins}:{secs}
        </p>
      </div>

      {/* ─── TOP RIGHT: Radar ─── */}
      <div className="absolute top-8 right-8 z-10">
        <div className="w-48 h-48 rounded-full border-2 border-[#6ec4e5]/30 bg-[#0a1a2a]/70 relative overflow-hidden">
          {/* Concentric rings */}
          <div className="absolute inset-[25%] rounded-full border border-[#6ec4e5]/15" />
          <div className="absolute inset-[40%] rounded-full border border-[#6ec4e5]/15" />
          {/* Crosshairs */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#6ec4e5]/15" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[#6ec4e5]/15" />
          {/* Sweep */}
          <div
            className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
            style={{
              transform: `rotate(${sweepAngle}deg)`,
              background:
                "linear-gradient(90deg, #6ec4e5 0%, transparent 100%)",
              boxShadow: "0 0 12px 3px rgba(110,196,229,0.3)",
            }}
          />
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6ec4e5]" />
        </div>
      </div>

      {/* ─── LEFT MID: Globe / Map ─── */}
      <div className="absolute top-[27%] left-8 z-10 w-52">
        <img
          src="/aim-globe.svg"
          alt="Globe"
          className="w-40 h-40 opacity-50 mx-auto"
        />
        <img
          src="/aim-info.svg"
          alt="Info"
          className="w-full opacity-50 mt-1"
        />
      </div>

      {/* ─── LEFT MID-LOW: "FOR THE O.S." text columns ─── */}
      <div
        className="absolute left-8 top-[56%] z-10 text-[11px] font-bold uppercase leading-[1.6]"
        style={{ opacity: flashVisible ? 0.7 : 0.15, transition: "opacity 0.5s" }}
      >
        <div className="flex gap-6">
          <div className="text-center">
            {Array.from({ length: 7 }).map((_, i) => (
              <p key={i}>
                <span className="text-white">FOR THE</span>{" "}
                <span className="text-[#6ec4e5]">O.S.</span>
              </p>
            ))}
          </div>
          <div className="text-center">
            {Array.from({ length: 7 }).map((_, i) => (
              <p key={i}>
                <span className="text-white">FOR THE</span>{" "}
                <span className="text-[#6ec4e5]">O.S.</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ─── LEFT BOTTOM: Vitals card ─── */}
      <div className="absolute left-8 bottom-[22%] z-10">
        <div
          className="border border-white/30 bg-[#0a1428]/60 px-6 py-3"
          style={{ opacity: vitalsFlash ? 1 : 0.3, transition: "opacity 0.4s" }}
        >
          <p className="font-bold text-base uppercase">
            <span className="text-white">VITALS :</span>{" "}
            <span className="text-[#6ec4e5]">GOOD</span>
          </p>
        </div>
      </div>

      {/* ─── LEFT BOTTOM: Coordinates card ─── */}
      <div className="absolute left-8 bottom-8 z-10">
        <div className="border border-white/30 bg-[#0a1428]/60 px-6 py-4">
          <p className="font-bold text-sm text-white uppercase">Coordinates</p>
          <p className="font-bold text-sm uppercase mt-1">
            <span className="text-white">X :</span>{" "}
            <span className="text-[#6ec4e5]">{cursor.x}</span>
          </p>
          <p className="font-bold text-sm uppercase">
            <span className="text-white">Y :</span>{" "}
            <span className="text-[#6ec4e5]">{cursor.y}</span>
          </p>
        </div>
      </div>

      {/* ─── RIGHT MID: Ammo & Shield card ─── */}
      <div className="absolute right-8 top-[35%] z-10">
        <div className="border border-white/30 bg-[#0a1428]/60 px-6 py-4">
          <p className="font-bold text-base uppercase">
            <span className="text-white">AMMO LEFT :</span>{" "}
            <span className="text-[#6ec4e5]">{ammo}</span>
          </p>
          <p className="font-bold text-base uppercase mt-1">
            <span className="text-white">SHIELD :</span>{" "}
            <span className="text-[#6ec4e5]">{shield}</span>
          </p>
        </div>
      </div>

      {/* ─── RIGHT MID: Audio bars ─── */}
      <div className="absolute right-8 top-[52%] z-10 flex flex-col gap-1">
        {bars.map((w, i) => (
          <div key={i} className="flex items-center h-4 gap-1">
            <div
              className="h-3 bg-[#6ec4e5]/10 border border-[#6ec4e5]/20"
              style={{ width: 120, transition: "all 1s" }}
            />
            <div
              className="h-3 bg-[#6ec4e5]"
              style={{
                width: `${w}px`,
                transition: "width 1s ease-in-out",
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          </div>
        ))}
      </div>

      {/* ─── RIGHT BOTTOM: Radio message card ─── */}
      <div className="absolute right-8 bottom-8 z-10">
        <div className="border border-white/30 bg-[#0a1428]/60 px-5 py-3 w-56">
          <img src="/aim-chart.svg" alt="" className="w-28 h-10 mb-2 opacity-70" />
          <p
            className="font-bold text-xs text-[#6ec4e5] uppercase text-center transition-opacity duration-500"
            key={radioIdx}
          >
            {radioMessages[radioIdx]}
          </p>
        </div>
      </div>

      {/* ─── BOTTOM CENTER: Glitches eliminated ─── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <p className="font-bold text-2xl uppercase">
          <span className="text-white">GLITCHES ELIMINATED :</span>{" "}
          <span className="text-[#6ec4e5]">{glitchesEliminated}</span>
        </p>
      </div>

      {/* ─── CENTER: Custom crosshair ─── */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{
          left: `${cursor.x}%`,
          top: `${cursor.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <line x1="22" y1="0" x2="22" y2="16" stroke="#6ec4e5" strokeWidth="1.5" />
          <line x1="22" y1="28" x2="22" y2="44" stroke="#6ec4e5" strokeWidth="1.5" />
          <line x1="0" y1="22" x2="16" y2="22" stroke="#6ec4e5" strokeWidth="1.5" />
          <line x1="28" y1="22" x2="44" y2="22" stroke="#6ec4e5" strokeWidth="1.5" />
          <circle cx="22" cy="22" r="8" stroke="#6ec4e5" strokeWidth="1" opacity="0.5" />
          <circle cx="22" cy="22" r="2" fill="#6ec4e5" />
        </svg>
      </div>

      {/* ─── CENTER: HUD crosshair indicator (static) ─── */}
      <div className="absolute left-1/2 top-[47%] -translate-x-1/2 z-10 pointer-events-none">
        <img src="/aim-hud.svg" alt="" className="w-16 h-10 opacity-40" />
      </div>

      {/* ─── TASK POPUP (placeholder) ─── */}
      {showTaskPopup && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-auto">
          <div className="border-2 border-[#6ec4e5] bg-[#0a1428]/90 p-8 max-w-md w-full mx-4">
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

      {/* ─── BACK TO PORTAL button ─── */}
      <button
        onClick={() => navigate("/play")}
        className="absolute top-4 left-4 z-30 px-3 py-1.5 border border-[#6ec4e5]/40 bg-black/50 text-[#6ec4e5] font-bold text-xs uppercase hover:bg-[#6ec4e5]/20 transition-colors pointer-events-auto"
      >
        ← EXIT
      </button>

      {/* ─── SHOW TASK button (temporary, for testing) ─── */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowTaskPopup(true);
        }}
        className="absolute top-4 right-[220px] z-30 px-3 py-1.5 border border-[#6ec4e5]/40 bg-black/50 text-[#6ec4e5] font-bold text-xs uppercase hover:bg-[#6ec4e5]/20 transition-colors pointer-events-auto"
      >
        TASK
      </button>
    </div>
  );
}
