import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const GAME_DURATION = 60; // seconds

const PARAGRAPHS = [
  "The neural interface requires a precise calibration sequence before deployment. Each signal must pass through the cortex bridge at exactly the right frequency to avoid data corruption. Operators must maintain focus during the entire synchronization process, as even minor deviations can cause catastrophic feedback loops in the system.",
  "Quantum entanglement allows for instantaneous communication across vast distances, but it demands strict adherence to encoding protocols. The slightest error in qubit alignment can collapse the wavefunction, rendering the message irretrievable. Engineers have spent decades perfecting these systems to ensure reliable transmission.",
  "In the legacy systems of the Old World, binary code served as the foundation of all digital communication. Programmers wrote instructions line by line, carefully debugging each routine. Though primitive by modern standards, these early architectures laid the groundwork for the intelligent networks we rely on today.",
  "Firewall penetration testing involves a systematic analysis of network vulnerabilities. Security experts simulate attacks to identify weak points, then develop patches to reinforce the defenses. This ongoing cycle of testing and improvement is crucial in an era where cyber threats evolve rapidly.",
  "Machine learning models thrive on large datasets and iterative training cycles. Each epoch refines the model weights, gradually improving accuracy and reducing loss. The process requires substantial computational resources but yields powerful predictive capabilities when properly calibrated.",
];

// Simple sequence matcher (port of Python's difflib.SequenceMatcher ratio)
function sequenceMatchRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;

  let matches = 0;
  const used = new Array(longer.length).fill(false);

  for (let i = 0; i < shorter.length; i++) {
    // Try exact position first
    if (i < longer.length && !used[i] && shorter[i] === longer[i]) {
      matches++;
      used[i] = true;
      continue;
    }
    // Search nearby
    const searchStart = Math.max(0, i - 5);
    const searchEnd = Math.min(longer.length, i + 6);
    let found = false;
    for (let j = searchStart; j < searchEnd; j++) {
      if (!used[j] && shorter[i] === longer[j]) {
        matches++;
        used[j] = true;
        found = true;
        break;
      }
    }
  }

  return (2 * matches) / (a.length + b.length);
}

function calcTypingScore(wpm: number, accuracy: number): number {
  // wpm_score: maps 20–80 WPM to 0–40 bonus points
  const wpmScore = Math.max(0, Math.min(40, ((wpm - 20) / 60) * 40));
  const score = 60 + wpmScore * (accuracy / 100);
  return Math.max(60, Math.min(100, Math.round(score)));
}

export default function TypingTest() {
  const navigate = useNavigate();

  // ── Game states ──
  const [gamePhase, setGamePhase] = useState<"start" | "playing" | "over">("start");
  const [paragraph, setParagraph] = useState("");
  const [typedText, setTypedText] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Timer ──
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

  // ── Calculate results when game ends ──
  useEffect(() => {
    if (gamePhase !== "over") return;
    const elapsed = (Date.now() - startTime) / 1000;
    const minutes = elapsed / 60;
    const charCount = typedText.length;
    const calculatedWpm = minutes > 0 ? Math.round((charCount / 5) / minutes) : 0;
    const calculatedAccuracy = Math.round(sequenceMatchRatio(typedText, paragraph) * 100);
    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);
  }, [gamePhase, startTime, typedText, paragraph]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  // ── Start game ──
  const startGame = useCallback(() => {
    const idx = Math.floor(Math.random() * PARAGRAPHS.length);
    setParagraph(PARAGRAPHS[idx]);
    setTypedText("");
    setTimeLeft(GAME_DURATION);
    setStartTime(Date.now());
    setGamePhase("playing");
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // ── Radar sweep ──
  const [sweepAngle, setSweepAngle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSweepAngle((a) => (a + 3) % 360), 30);
    return () => clearInterval(id);
  }, []);

  // ── Audio bars ──
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

  // ── Radio messages ──
  const radioMessages = [
    "CALIBRATING NEURAL LINK",
    "SYNCING PROTOCOL LAYER",
    "DATA STREAM ACTIVE",
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

  // ── Flash text ──
  const [flashBright, setFlashBright] = useState(false);
  useEffect(() => {
    const flash = () => { setFlashBright(true); setTimeout(() => setFlashBright(false), 600); };
    const id = setInterval(flash, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // ── Cursor position ──
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

  // ── Render highlighted reference text ──
  const renderHighlightedParagraph = () => {
    if (!paragraph) return null;
    return paragraph.split("").map((char, i) => {
      let color = "text-white/60"; // not yet typed
      if (i < typedText.length) {
        color = typedText[i] === char ? "text-green-400" : "text-red-400";
      }
      return (
        <span key={i} className={color}>
          {char}
        </span>
      );
    });
  };

  // ── Loading screen state ──
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    if (gamePhase === "over" && !showLoading) setShowLoading(true);
  }, [gamePhase, showLoading]);

  const score = calcTypingScore(wpm, accuracy);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] select-none"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Jura', sans-serif" }}
    >
      {/* Background */}
      <img src="/aim-bg-new.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <img src="/aim-grid.svg" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-15" />

      {/* ═══ FLEX HUD LAYOUT ═══ */}
      <div className="absolute inset-0 z-10 flex flex-col p-4 sm:p-6 lg:p-8 pointer-events-none">

        {/* ─── TOP ROW ─── */}
        <div className="flex items-start justify-between gap-4 shrink-0">
          {/* Top Left: EXIT + Coordinates */}
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
                <p><span className="text-white">ALT :</span> <span className="text-[#6ec4e5]">9000m</span></p>
              </div>
              <div className="font-bold text-xs sm:text-sm uppercase leading-snug mt-2 sm:mt-4">
                <p><span className="text-white">LOCATION :</span></p>
                <p className="text-[#6ec4e5]">XX HORIZON</p>
                <p className="text-[#6ec4e5]">FRONT II</p>
              </div>
            </div>
          </div>

          {/* Top Center: Title + Timer */}
          <div className="text-center shrink-0">
            <h1 className="font-bold text-white text-xl sm:text-3xl uppercase tracking-[0.15em]">
              CODE CALIBRATION
            </h1>
            <p className="font-bold text-[#6ec4e5] text-xl sm:text-3xl mt-1">
              {mins}:{secs}
            </p>
          </div>

          {/* Top Right: Radar */}
          <div className="flex items-start gap-3">
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
          <div className="flex flex-col items-center justify-start gap-2 sm:gap-4 shrink-0 w-28 sm:w-36 lg:w-44">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36">
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
              </svg>
            </div>
            <p className="text-[#6ec4e5]/40 text-[10px] font-bold uppercase tracking-widest">SECTOR MAP</p>

            <div
              className="text-[10px] sm:text-[11px] font-bold uppercase leading-[1.6]"
              style={{ opacity: flashBright ? 1 : 0.35, transition: "opacity 0.3s", textShadow: flashBright ? '0 0 8px #6ec4e5, 0 0 16px #6ec4e5' : 'none' }}
            >
              <div className="flex gap-4 sm:gap-6">
                <div className="text-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <p key={i}><span className="text-white">FOR THE</span>{" "}<span className="text-[#6ec4e5]">O.S.</span></p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Center: Typing area (two cards side by side) */}
          <div className="flex-1 flex items-center justify-center pointer-events-auto">
            {gamePhase === "playing" && (
              <div className="flex gap-4 w-full max-w-5xl h-full max-h-[340px]">
                {/* Left Card: Reference Paragraph */}
                <div className="flex-1 relative border border-[#6ec4e5]/30 bg-[#0a1428]/60 overflow-hidden">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#6ec4e5]/60" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#6ec4e5]/60" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#6ec4e5]/60" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#6ec4e5]/60" />

                  <div className="p-4 sm:p-6 h-full overflow-y-auto">
                    <p className="text-[#6ec4e5]/40 text-[10px] uppercase tracking-wider mb-2">// REFERENCE TEXT</p>
                    <p className="text-sm sm:text-base leading-relaxed font-medium">
                      {renderHighlightedParagraph()}
                    </p>
                  </div>
                </div>

                {/* Right Card: Typing Area */}
                <div className="flex-1 relative border border-[#6ec4e5]/30 bg-[#0a1428]/60 overflow-hidden">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#6ec4e5]/60" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#6ec4e5]/60" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#6ec4e5]/60" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#6ec4e5]/60" />

                  <div className="p-4 sm:p-6 h-full flex flex-col">
                    <p className="text-[#6ec4e5]/40 text-[10px] uppercase tracking-wider mb-2">// TYPE HERE</p>
                    <textarea
                      ref={textareaRef}
                      value={typedText}
                      onChange={(e) => setTypedText(e.target.value)}
                      className="flex-1 w-full bg-transparent text-white/90 text-sm sm:text-base leading-relaxed font-medium resize-none outline-none caret-[#6ec4e5] placeholder:text-white/20"
                      placeholder="Start typing..."
                      spellCheck={false}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Right: Audio bars */}
          <div className="flex flex-col items-end justify-start gap-3 sm:gap-4 shrink-0">
            <div className="border border-white/30 bg-[#0a1428]/60 px-4 sm:px-6 py-3 sm:py-4 w-48 sm:w-56 lg:w-64">
              <p className="font-bold text-sm sm:text-base uppercase">
                <span className="text-white">CHARS :</span>{" "}
                <span className="text-[#6ec4e5] inline-block w-12 sm:w-14 text-right tabular-nums">{typedText.length}</span>
              </p>
              <p className="font-bold text-sm sm:text-base uppercase mt-1">
                <span className="text-white">WORDS :</span>{" "}
                <span className="text-[#6ec4e5] inline-block w-12 sm:w-14 text-right tabular-nums">
                  {typedText.trim() ? typedText.trim().split(/\s+/).length : 0}
                </span>
              </p>
            </div>

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

          {/* Bottom Center: Progress */}
          <div className="text-center">
            <p className="font-bold text-lg sm:text-2xl uppercase">
              <span className="text-white">PROGRESS :</span>{" "}
              <span className="text-[#6ec4e5]">
                {paragraph ? Math.min(100, Math.round((typedText.length / paragraph.length) * 100)) : 0}%
              </span>
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

      {/* ─── START SCREEN ─── */}
      {gamePhase === "start" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 pointer-events-auto" style={{ fontFamily: "'Jura', sans-serif" }}>
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(110,196,229,0.08) 2px, rgba(110,196,229,0.08) 4px)' }} />
          <p className="text-[#6ec4e5]/60 text-xs uppercase tracking-[0.3em] mb-4">// MISSION BRIEFING</p>
          <h2 className="font-bold text-3xl sm:text-4xl text-[#6ec4e5] uppercase tracking-widest mb-3">CODE CALIBRATION</h2>
          <p className="text-white/50 text-sm uppercase tracking-wider mb-2">
            PROTOCOL: REPLICATE TEXT FOR <span className="text-[#6ec4e5] font-bold">{GAME_DURATION}s</span>
          </p>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-8">TYPE THE REFERENCE TEXT AS FAST AND ACCURATELY AS POSSIBLE</p>
          <button onClick={startGame} className="px-8 py-3 border-2 border-[#6ec4e5] text-[#6ec4e5] font-bold text-lg uppercase tracking-wider hover:bg-[#6ec4e5]/20 transition-colors">
            START CALIBRATION
          </button>
          <button onClick={() => navigate("/play")} className="mt-4 px-6 py-2 border border-white/20 text-white/40 font-bold text-xs uppercase hover:text-white/70 transition-colors">
            ← BACK TO BASE
          </button>
        </div>
      )}

      {/* ─── GAME OVER SCREEN ─── */}
      {showLoading && gamePhase === "over" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 pointer-events-auto animate-loading-fade-in" style={{ fontFamily: "'Jura', sans-serif" }}>
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(110,196,229,0.08) 2px, rgba(110,196,229,0.08) 4px)' }} />
          <div className="absolute top-[30%] left-0 right-0 h-px bg-[#6ec4e5]/20" />
          <div className="absolute top-[70%] left-0 right-0 h-px bg-[#6ec4e5]/20" />

          <p className="text-[#6ec4e5]/60 text-xs uppercase tracking-[0.3em] mb-6">// CALIBRATION COMPLETE</p>
          <h2 className="font-bold text-2xl sm:text-3xl text-[#6ec4e5] uppercase tracking-widest mb-3">RESULTS</h2>

          <div className="flex gap-8 sm:gap-12 my-6">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">WPM</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{wpm}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">ACCURACY</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{accuracy}%</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">SCORE</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{score}</p>
            </div>
          </div>

          <p className="text-white/50 text-sm uppercase tracking-wider mb-8">
            STATUS : <span className={`font-bold ${score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
              {score > 80 ? 'AUTHORITY APPROVED' : 'STANDARD PERFORMANCE'}
            </span>
          </p>

          <div className="flex gap-4">
            <button onClick={() => navigate("/play")} className="px-8 py-3 border-2 border-[#6ec4e5] text-[#6ec4e5] font-bold text-sm uppercase tracking-wider hover:bg-[#6ec4e5]/20 transition-colors">
              RETURN TO BASE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
