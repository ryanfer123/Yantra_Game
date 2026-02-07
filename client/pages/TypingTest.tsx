import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const GAME_DURATION = 60;

const PARAGRAPHS = [
  "The neural interface requires a precise calibration sequence before deployment. Each signal must pass through the cortex bridge at exactly the right frequency to avoid data corruption. Operators must maintain focus during the entire synchronization process, as even minor deviations can cause catastrophic feedback loops in the system.",
  "Quantum entanglement allows for instantaneous communication across vast distances, but it demands strict adherence to encoding protocols. The slightest error in qubit alignment can collapse the wavefunction, rendering the message irretrievable. Engineers have spent decades perfecting these systems to ensure reliable transmission.",
  "In the legacy systems of the Old World, binary code served as the foundation of all digital communication. Programmers wrote instructions line by line, carefully debugging each routine. Though primitive by modern standards, these early architectures laid the groundwork for the intelligent networks we rely on today.",
  "Firewall penetration testing involves a systematic analysis of network vulnerabilities. Security experts simulate attacks to identify weak points, then develop patches to reinforce the defenses. This ongoing cycle of testing and improvement is crucial in an era where cyber threats evolve rapidly.",
  "Machine learning models thrive on large datasets and iterative training cycles. Each epoch refines the model weights, gradually improving accuracy and reducing loss. The process requires substantial computational resources but yields powerful predictive capabilities when properly calibrated.",
];

// Keyboard layout
const KB_ROW1 = ["q","w","e","r","t","y","u","i","o","p"];
const KB_ROW1_SUB = ["1","2","3","4","5","6","7","8","9","0"];
const KB_ROW2 = ["a","s","d","f","g","h","j","k","l"];
const KB_ROW2_SUB = ["@","#","€","&","*","(",")","`","\""];
const KB_ROW3 = ["z","x","c","v","b","n","m",",","."];
const KB_ROW3_SUB = ["%","-","+","=","/",";",":","!","?"];

function sequenceMatchRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  let matches = 0;
  const used = new Array(longer.length).fill(false);
  for (let i = 0; i < shorter.length; i++) {
    if (i < longer.length && !used[i] && shorter[i] === longer[i]) {
      matches++; used[i] = true; continue;
    }
    const searchStart = Math.max(0, i - 5);
    const searchEnd = Math.min(longer.length, i + 6);
    for (let j = searchStart; j < searchEnd; j++) {
      if (!used[j] && shorter[i] === longer[j]) {
        matches++; used[j] = true; break;
      }
    }
  }
  return (2 * matches) / (a.length + b.length);
}

function calcTypingScore(wpm: number, accuracy: number): number {
  const wpmScore = Math.max(0, Math.min(40, ((wpm - 20) / 60) * 40));
  const score = 60 + wpmScore * (accuracy / 100);
  return Math.max(60, Math.min(100, Math.round(score)));
}

export default function TypingTest() {
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState<"start" | "playing" | "over">("start");
  const [paragraph, setParagraph] = useState("");
  const [typedText, setTypedText] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track pressed key — keyboard is hidden until a key is pressed
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeKeyTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (gamePhase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setGamePhase("over"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase !== "over") return;
    const elapsed = (Date.now() - startTime) / 1000;
    const minutes = elapsed / 60;
    const calculatedWpm = minutes > 0 ? Math.round((typedText.length / 5) / minutes) : 0;
    const calculatedAccuracy = Math.round(sequenceMatchRatio(typedText, paragraph) * 100);
    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);
  }, [gamePhase, startTime, typedText, paragraph]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const startGame = useCallback(() => {
    const idx = Math.floor(Math.random() * PARAGRAPHS.length);
    setParagraph(PARAGRAPHS[idx]);
    setTypedText("");
    setTimeLeft(GAME_DURATION);
    setStartTime(Date.now());
    setGamePhase("playing");
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Handle typing & highlight the pressed key
  const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTypedText(val);
    const lastChar = val.length > 0 ? val[val.length - 1].toLowerCase() : null;
    if (lastChar) {
      setActiveKey(lastChar);
      if (activeKeyTimeout.current) clearTimeout(activeKeyTimeout.current);
      activeKeyTimeout.current = setTimeout(() => setActiveKey(null), 200);
    }
  }, []);

  // Click anywhere on card focuses the hidden textarea
  const handleCardClick = useCallback(() => {
    if (gamePhase === "playing") textareaRef.current?.focus();
  }, [gamePhase]);

  // Render paragraph with text color: cyan correct, red incorrect, gray untyped
  const renderHighlightedParagraph = () => {
    if (!paragraph) return null;
    return paragraph.split("").map((char, i) => {
      let colorClass = "text-[#9a9a9a]";
      if (i < typedText.length) {
        colorClass = typedText[i] === char ? "text-[#6ec4e5]" : "text-[#e54444]";
      }
      return <span key={i} className={colorClass}>{char}</span>;
    });
  };

  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    if (gamePhase === "over" && !showLoading) setShowLoading(true);
  }, [gamePhase, showLoading]);

  const score = calcTypingScore(wpm, accuracy);

  // Key component — only visible when activeKey matches
  const Key = ({ label, sub, wide, icon, isSpecial }: {
    label?: string; sub?: string; wide?: string; icon?: React.ReactNode; isSpecial?: boolean;
  }) => {
    const isActive = label ? activeKey === label.toLowerCase() : false;
    // Keyboard is hidden: only show a key when it's actively pressed
    if (!isActive && !isSpecial) {
      return (
        <div className={`rounded-[10px] ${wide || "w-[60px] sm:w-[65px]"} h-[48px] sm:h-[55px]`} />
      );
    }
    if (!isActive && isSpecial) {
      return (
        <div className={`rounded-[10px] ${wide || "w-[60px] sm:w-[65px]"} h-[48px] sm:h-[55px]`} />
      );
    }
    return (
      <div
        className={`relative rounded-[10px] flex items-center justify-center transition-all duration-100 ${
          wide || "w-[60px] sm:w-[65px]"
        } h-[48px] sm:h-[55px] bg-[#6ec4e5]/20 border border-[#6ec4e5]/60 shadow-[0_0_12px_rgba(110,196,229,0.35)]`}
      >
        {sub && (
          <span className="absolute top-1 left-0 right-0 text-center text-[10px] sm:text-[11px] text-white/40 font-medium">{sub}</span>
        )}
        {icon ? (
          <div className="text-white/70">{icon}</div>
        ) : (
          <span className={`text-white text-[18px] sm:text-[20px] font-normal ${sub ? "mt-2" : ""}`}>{label}</span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] select-none"
      style={{ fontFamily: "'Jura', sans-serif" }}
    >
      {/* Background image (blurred) */}
      <img
        src="/aim-bg-new.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ filter: "blur(6px) brightness(0.5)" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.5)] backdrop-blur-[5px]" />

      {/* Hidden textarea to capture keyboard input */}
      {gamePhase === "playing" && (
        <textarea
          ref={textareaRef}
          value={typedText}
          onChange={handleTyping}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          style={{ position: "fixed", top: -9999, left: -9999 }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="absolute inset-0 z-10 flex flex-col items-center">

        {/* Title */}
        <h1 className="font-bold text-white text-[36px] sm:text-[50px] uppercase text-center mt-6 sm:mt-[30px] tracking-wider">
          Code Calibration
        </h1>

        {/* Timer */}
        <p className="font-bold text-[#6ec4e5] text-[30px] sm:text-[40px] uppercase text-center mt-1">
          {mins}:{secs}
        </p>

        {/* Single card with reference paragraph + highlights */}
        <div className="w-full max-w-[900px] px-6 sm:px-[40px] mt-4 sm:mt-6 flex-1 min-h-0 max-h-[345px]">
          <div
            className="relative w-full h-full cursor-text"
            onClick={handleCardClick}
          >
            {/* Card background SVG (semi-transparent) */}
            <div className="absolute inset-0 bg-[#0a1020]/30 rounded-sm" />

            {/* Corner brackets (white, 2.4px, per Figma) */}
            <div className="absolute top-0 left-0 w-[18px] h-[13px] border-t-[2.4px] border-l-[2.4px] border-white" />
            <div className="absolute top-0 right-0 w-[18px] h-[13px] border-t-[2.4px] border-r-[2.4px] border-white" />
            <div className="absolute bottom-0 left-0 w-[30px] h-[28px] border-b-[2.4px] border-l-[2.4px] border-white" />
            <div className="absolute bottom-0 right-0 w-[18px] h-[13px] border-b-[2.4px] border-r-[2.4px] border-white" />

            <div className="relative p-6 sm:p-8 h-full overflow-y-auto z-10">
              <p className="text-[#9a9a9a] text-[20px] sm:text-[24px] leading-[1.3] font-bold">
                {gamePhase === "playing" ? renderHighlightedParagraph() : (
                  <span>Reference paragraph is written here</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Keyboard — hidden by default, only pressed key lights up */}
        <div className="mt-4 sm:mt-6 mb-4 flex flex-col items-center gap-[6px] sm:gap-[8px]">
          {/* Row 1: q-p + backspace */}
          <div className="flex gap-[5px] sm:gap-[6px]">
            {KB_ROW1.map((k, i) => <Key key={k} label={k} sub={KB_ROW1_SUB[i]} />)}
            <Key isSpecial icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>} />
          </div>
          {/* Row 2: a-l + enter */}
          <div className="flex gap-[5px] sm:gap-[6px]">
            <div className="w-3 sm:w-4" />
            {KB_ROW2.map((k, i) => <Key key={k} label={k} sub={KB_ROW2_SUB[i]} />)}
            <Key isSpecial icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 01-4 4H4"/></svg>} />
          </div>
          {/* Row 3: shift + z-. + shift */}
          <div className="flex gap-[5px] sm:gap-[6px]">
            <Key isSpecial icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>} />
            {KB_ROW3.map((k, i) => <Key key={k} label={k} sub={KB_ROW3_SUB[i]} />)}
            <Key isSpecial icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>} />
          </div>
          {/* Row 4: Ctrl, globe, mic, space, .?123, keyboard */}
          <div className="flex gap-[5px] sm:gap-[6px]">
            <Key isSpecial label="Ctrl" />
            <Key isSpecial icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>} />
            <Key isSpecial icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>} />
            <div className={`rounded-[10px] ${activeKey === " " ? "bg-[#6ec4e5]/20 border-[#6ec4e5]/60 shadow-[0_0_12px_rgba(110,196,229,0.35)]" : "border-transparent"} border w-[280px] sm:w-[390px] h-[48px] sm:h-[55px] transition-all duration-100`} />
            <Key isSpecial label=".?123" />
            <Key isSpecial icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="10" y1="12" x2="10.01" y2="12"/><line x1="14" y1="12" x2="14.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>} />
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
