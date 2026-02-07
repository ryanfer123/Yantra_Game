import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GAME_DURATION = 60;
const WATCH_TIME = 2250;
const TILE_SIZE = 65;
const GAP = 8;
const MAX_GRID = 6;
const FIXED_GRID_WIDTH = MAX_GRID * TILE_SIZE + (MAX_GRID - 1) * GAP;

type TileState = "default" | "target" | "correct" | "wrong";

function calcScore(level: number): number {
  return Math.max(60, Math.min(100, 60 + level * 4));
}

export default function VisualMemory() {
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState<"start" | "watching" | "playing" | "over">("start");
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gridSize, setGridSize] = useState(3);
  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const watchRef = useRef<ReturnType<typeof setTimeout>>();

  const generateLevel = useCallback((lvl: number) => {
    const gs = Math.min(6, 3 + Math.floor(lvl / 3));
    const numTargets = Math.min(gs * gs - 1, 2 + lvl);
    const t = new Set<string>();
    while (t.size < numTargets) {
      const r = Math.floor(Math.random() * gs);
      const c = Math.floor(Math.random() * gs);
      t.add(`${r},${c}`);
    }
    setGridSize(gs);
    setTargets(t);
    setClicked(new Set());
    setWrong(new Set());
  }, []);

  const startGame = useCallback(() => {
    setLevel(1);
    setLives(3);
    setTimeLeft(GAME_DURATION);
    generateLevel(1);
    setGamePhase("watching");
  }, [generateLevel]);

  /* Countdown timer — runs while watching or playing */
  useEffect(() => {
    if (gamePhase !== "watching" && gamePhase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGamePhase("over");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  }, [gamePhase]);

  /* Watch-phase timeout — auto-transition to playing */
  useEffect(() => {
    if (gamePhase !== "watching") return;
    const id = setTimeout(() => setGamePhase("playing"), WATCH_TIME);
    watchRef.current = id;
    return () => clearTimeout(id);
  }, [gamePhase]);

  const advanceLevel = useCallback(
    (nextLvl: number) => {
      generateLevel(nextLvl);
      setGamePhase("watching");
    },
    [generateLevel]
  );

  const handleTileClick = useCallback(
    (r: number, c: number) => {
      if (gamePhase !== "playing") return;
      const key = `${r},${c}`;
      if (clicked.has(key) || wrong.has(key)) return;

      if (targets.has(key)) {
        const nc = new Set(clicked);
        nc.add(key);
        setClicked(nc);
        if (nc.size === targets.size) {
          const next = level + 1;
          setLevel(next);
          advanceLevel(next);
        }
      } else {
        const nw = new Set(wrong);
        nw.add(key);
        setWrong(nw);
        const nl = lives - 1;
        setLives(nl);
        if (nl <= 0) setGamePhase("over");
      }
    },
    [gamePhase, clicked, wrong, targets, level, lives, advanceLevel]
  );

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const score = calcScore(level);

  const renderGrid = () => {
    const tiles: JSX.Element[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const key = `${r},${c}`;
        const isTarget = targets.has(key);
        const isClicked = clicked.has(key);
        const isWrong = wrong.has(key);

        let state: TileState = "default";
        if (gamePhase === "watching" && isTarget) state = "target";
        else if (isClicked) state = "correct";
        else if (isWrong) state = "wrong";

        const bg =
          state === "target" || state === "correct"
            ? "#6ec4e5"
            : state === "wrong"
            ? "#e54444"
            : "#24272c";

        const shadow =
          state === "target" || state === "correct"
            ? "-4px -4px 10px 0px rgba(110,196,229,0.15), 4px 4px 10px 0px rgba(0,0,0,0.25), inset 2.4px 2.4px 2.4px 0px rgba(255,255,255,0.25)"
            : state === "wrong"
            ? "-4px -4px 10px 0px rgba(229,68,68,0.15), 4px 4px 10px 0px rgba(0,0,0,0.25), inset 2.4px 2.4px 2.4px 0px rgba(255,255,255,0.15)"
            : "-6px -6px 12px 0px rgba(255,255,255,0.05), 6px 6px 12px 0px rgba(0,0,0,0.25), inset 2.4px 2.4px 2.4px 0px rgba(255,255,255,0.15)";

        const clickable = gamePhase === "playing" && !isClicked && !isWrong;

        tiles.push(
          <button
            key={key}
            disabled={!clickable}
            onClick={() => handleTileClick(r, c)}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundColor: bg,
              borderRadius: 14.4,
              border: "0.6px solid #111214",
              boxShadow: shadow,
              cursor: clickable ? "pointer" : "default",
              transition: "all 150ms",
            }}
            className={clickable ? "hover:brightness-110 active:scale-95" : ""}
          />
        );
      }
    }
    return tiles;
  };

  const renderLives = () =>
    Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="rounded-sm transition-all duration-300"
        style={{
          height: 17,
          width: 69,
          backgroundColor: i < lives ? "#6ec4e5" : "#24272c",
        }}
      />
    ));

  /* Corner-bracket decorator */
  const Corners = ({ size = 13 }: { size?: number }) => (
    <>
      <div className="absolute top-0 left-0 border-t-[2.4px] border-l-[2.4px] border-white" style={{ width: size, height: size }} />
      <div className="absolute top-0 right-0 border-t-[2.4px] border-r-[2.4px] border-white" style={{ width: size, height: size }} />
      <div className="absolute bottom-0 left-0 border-b-[2.4px] border-l-[2.4px] border-white" style={{ width: size, height: size }} />
      <div className="absolute bottom-0 right-0 border-b-[2.4px] border-r-[2.4px] border-white" style={{ width: size, height: size }} />
    </>
  );

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] select-none"
      style={{ fontFamily: "'Jura', sans-serif" }}
    >
      {/* ── Background ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(/memory-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark + blur overlay */}
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.50)] backdrop-blur-[5px]" />

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 z-10 flex flex-col items-center">
        {/* Title */}
        <h1 className="font-bold text-white text-[36px] sm:text-[50px] uppercase text-center mt-6 sm:mt-[30px] tracking-wider">
          Code Calibration
        </h1>

        {/* Timer */}
        <p className="font-bold text-[#6ec4e5] text-[30px] sm:text-[40px] uppercase text-center mt-1">
          {mins}:{secs}
        </p>

        {/* Score & Error Margin row */}
        <div className="w-full max-w-[1000px] px-6 flex justify-between items-center mt-2">
          {/* Score panel */}
          <div className="relative min-w-[180px]" style={{ padding: 0 }}>
            <img src="/card-bg-score.svg" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
            <div className="relative px-5 py-3">
              <Corners size={16} />
              <p className="font-bold text-white text-[24px] sm:text-[30px] uppercase text-center">
                Score: <span className="text-[#6ec4e5]">{gamePhase === "start" ? "\u2014" : score}</span>
              </p>
            </div>
          </div>

          {/* Error Margin panel */}
          <div className="relative min-w-[350px]" style={{ padding: 0 }}>
            <img src="/card-bg-error.svg" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
            <div className="relative px-5 py-3">
              <Corners size={16} />
              <div className="flex items-center justify-center gap-4">
                <p className="font-bold text-white text-[24px] sm:text-[30px] uppercase whitespace-nowrap">
                  Error Margin:
                </p>
                <div className="flex gap-[20px]">{renderLives()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid card — fixed size container so it never shifts */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-6 mt-2">
          <div
            className="relative"
            style={{ width: FIXED_GRID_WIDTH + 64, height: FIXED_GRID_WIDTH + 64, padding: 0 }}
          >
            <img src="/card-bg-grid.svg" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
            <div className="relative w-full h-full flex items-center justify-center">
              <Corners size={13} />
              {/* CSS Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridSize}, ${TILE_SIZE}px)`,
                  gap: GAP,
                }}
              >
                {renderGrid()}
              </div>
            </div>
          </div>

          {/* Memorize text — below the grid card */}
          {gamePhase === "watching" && (
            <p className="font-bold text-[#6ec4e5] text-xl sm:text-2xl uppercase tracking-widest animate-pulse mt-4">
              Memorize the pattern...
            </p>
          )}
        </div>
      </div>

      {/* ── START SCREEN ── */}
      {gamePhase === "start" && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
          style={{ fontFamily: "'Jura', sans-serif" }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(110,196,229,0.08) 2px, rgba(110,196,229,0.08) 4px)",
            }}
          />
          <p className="text-[#6ec4e5]/60 text-xs uppercase tracking-[0.3em] mb-4">// MISSION BRIEFING</p>
          <h2 className="font-bold text-3xl sm:text-4xl text-[#6ec4e5] uppercase tracking-widest mb-3">
            MACHINE LEARNING
          </h2>
          <p className="text-white/50 text-sm uppercase tracking-wider mb-2">
            {"PROTOCOL: MEMORIZE THE PATTERN \u2022 "}
            <span className="text-[#6ec4e5] font-bold">60s</span>
            {" TIMER"}
          </p>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-8">
            REPLICATE THE HIGHLIGHTED TILES FROM MEMORY
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 border-2 border-[#6ec4e5] text-[#6ec4e5] font-bold text-lg uppercase tracking-wider hover:bg-[#6ec4e5]/20 transition-colors"
          >
            START CALIBRATION
          </button>
          <button
            onClick={() => navigate("/play")}
            className="mt-4 px-6 py-2 border border-white/20 text-white/40 font-bold text-xs uppercase hover:text-white/70 transition-colors"
          >
            {"\u2190 BACK TO BASE"}
          </button>
        </div>
      )}

      {/* ── GAME OVER ── */}
      {gamePhase === "over" && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-loading-fade-in"
          style={{ fontFamily: "'Jura', sans-serif" }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(110,196,229,0.08) 2px, rgba(110,196,229,0.08) 4px)",
            }}
          />
          <div className="absolute top-[30%] left-0 right-0 h-px bg-[#6ec4e5]/20" />
          <div className="absolute top-[70%] left-0 right-0 h-px bg-[#6ec4e5]/20" />

          <p className="text-[#6ec4e5]/60 text-xs uppercase tracking-[0.3em] mb-6">
            {lives <= 0 ? "// SYSTEM FAILURE" : "// CALIBRATION COMPLETE"}
          </p>
          <h2 className="font-bold text-2xl sm:text-3xl text-[#6ec4e5] uppercase tracking-widest mb-3">
            {lives <= 0 ? "PATTERN MISMATCH" : "RESULTS"}
          </h2>

          <div className="flex gap-8 sm:gap-12 my-6">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">MAX LEVEL</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{level}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">SCORE</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{score}</p>
            </div>
          </div>

          <p className="text-white/50 text-sm uppercase tracking-wider mb-8">
            {"STATUS : "}
            <span className={"font-bold " + (score > 75 ? "text-green-400" : "text-yellow-400")}>
              {score > 75 ? "AUTHORITY APPROVED" : "TRAINING REQUIRED"}
            </span>
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/play")}
              className="px-8 py-3 border-2 border-[#6ec4e5] text-[#6ec4e5] font-bold text-sm uppercase tracking-wider hover:bg-[#6ec4e5]/20 transition-colors"
            >
              RETURN TO BASE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
