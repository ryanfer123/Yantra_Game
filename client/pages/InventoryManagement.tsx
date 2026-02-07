import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GAME_DURATION = 60;

const ROBOTICS_AI_TERMS = [
  // AI/ML
  "Tensor", "Neural", "Gradient", "Epoch", "Sigmoid", "Perceptron",
  "Backprop", "Bias", "Variance", "Overfit", "Dropout", "Softmax",
  "Heuristic", "Agent", "Cluster", "Vector", "Embedding", "Token",
  "Transformer", "Attention", "Latency", "Inference", "Dataset",
  // Robotics/Electronics
  "Actuator", "Servo", "Arduino", "Raspberry", "Micro", "Voltage",
  "Current", "Resistor", "Capacitor", "Inductor", "Diode", "Transistor",
  "MOSFET", "Relay", "Sensor", "Lidar", "Sonar", "Encoder", "Gyro",
  "Accel", "Magnet", "Solenoid", "Circuit", "PCB", "Schematic",
  "Firmware", "Signal", "Analog", "Digital", "PWM", "UART", "I2C",
  "SPI", "Serial", "Baud", "Kinematics", "Torque", "Payload", "DOF",
];

function calcScore(rawScore: number): number {
  return Math.max(60, Math.min(100, 60 + rawScore));
}

function pickNewWord(seen: Set<string>): string {
  let available = ROBOTICS_AI_TERMS.filter((w) => !seen.has(w));
  if (available.length === 0) available = [...ROBOTICS_AI_TERMS];
  return available[Math.floor(Math.random() * available.length)];
}

export default function InventoryManagement() {
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState<"start" | "playing" | "over">("start");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(3);
  const [rawScore, setRawScore] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [isNew, setIsNew] = useState(true);
  const seenRef = useRef<Set<string>>(new Set());

  const nextWord = useCallback(() => {
    const seen = seenRef.current;
    // If no seen words yet, always show new
    if (seen.size === 0) {
      const word = pickNewWord(seen);
      seen.add(word);
      setCurrentWord(word);
      setIsNew(true);
      return;
    }
    // 40% chance to show a SEEN word
    if (Math.random() < 0.4) {
      const arr = Array.from(seen);
      setCurrentWord(arr[Math.floor(Math.random() * arr.length)]);
      setIsNew(false);
    } else {
      const word = pickNewWord(seen);
      seen.add(word);
      setCurrentWord(word);
      setIsNew(true);
    }
  }, []);

  const startGame = useCallback(() => {
    seenRef.current = new Set();
    setRawScore(0);
    setLives(3);
    setTimeLeft(GAME_DURATION);
    setGamePhase("playing");
    // pick first word
    const word = pickNewWord(new Set());
    seenRef.current.add(word);
    setCurrentWord(word);
    setIsNew(true);
  }, []);

  /* Timer */
  useEffect(() => {
    if (gamePhase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGamePhase("over");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gamePhase]);

  const handleChoice = useCallback(
    (userSaysNew: boolean) => {
      if (gamePhase !== "playing") return;
      const correct = userSaysNew === isNew;
      if (correct) {
        setRawScore((s) => s + 1);
      } else {
        setLives((l) => {
          const nl = l - 1;
          if (nl <= 0) setGamePhase("over");
          return nl;
        });
      }
      nextWord();
    },
    [gamePhase, isNew, nextWord]
  );

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const score = calcScore(rawScore);

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
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(/inventory-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Double dark + blur overlay (matches Figma) */}
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.5)] backdrop-blur-[5px]" />
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.5)] backdrop-blur-[5px]" />

      {/* MAIN CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col items-center">
        {/* Title */}
        <h1 className="font-bold text-white text-[36px] sm:text-[50px] uppercase text-center mt-6 sm:mt-[30px] tracking-wider">
          Inventory Management
        </h1>

        {/* Timer */}
        <p className="font-bold text-[#6ec4e5] text-[30px] sm:text-[40px] uppercase text-center mt-1">
          {mins}:{secs}
        </p>

        {/* Score & Error Margin row */}
        <div className="w-full max-w-[1000px] px-6 flex justify-between items-center mt-2">
          {/* Score panel */}
          <div className="relative min-w-[180px]">
            <img src="/card-bg-score.svg" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
            <div className="relative px-5 py-3">
              <Corners size={16} />
              <p className="font-bold text-white text-[24px] sm:text-[30px] uppercase text-center">
                Score: <span className="text-[#6ec4e5]">{gamePhase === "start" ? "\u2014" : score}</span>
              </p>
            </div>
          </div>

          {/* Error Margin panel */}
          <div className="relative min-w-[350px]">
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

        {/* Word card */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-6 mt-2">
          <div className="relative" style={{ width: 543, height: 264 }}>
            <img src="/card-bg-grid.svg" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
            <div className="relative w-full h-full flex items-center justify-center">
              <Corners size={37} />
              <p className="font-bold text-white text-[40px] sm:text-[50px]">
                {currentWord || "\u00A0"}
              </p>
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex gap-8 mt-10">
            {/* ARCHIVED = seen before */}
            <button
              onClick={() => handleChoice(false)}
              disabled={gamePhase !== "playing"}
              className="w-[333px] h-[72px] rounded-[15px] text-white text-[35px] font-normal transition-all hover:brightness-125 active:scale-95 disabled:opacity-40"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: "#2a3548",
                boxShadow: "-6px -6px 12px 0px rgba(255,255,255,0.25), 6px 6px 12px 0px rgba(0,0,0,0.25)",
              }}
            >
              ARCHIVED
            </button>

            {/* LOG = new word */}
            <button
              onClick={() => handleChoice(true)}
              disabled={gamePhase !== "playing"}
              className="w-[333px] h-[72px] rounded-[15px] text-white text-[35px] font-normal transition-all hover:brightness-125 active:scale-95 disabled:opacity-40"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: "#2a3548",
                boxShadow: "-6px -6px 12px 0px rgba(255,255,255,0.25), 6px 6px 12px 0px rgba(0,0,0,0.25)",
              }}
            >
              LOG
            </button>
          </div>
        </div>
      </div>

      {/* START SCREEN */}
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
            REGISTER CATEGORIZATION
          </h2>
          <p className="text-white/50 text-sm uppercase tracking-wider mb-2">
            {"PROTOCOL: MEMORIZE THE WORDS \u2022 "}
            <span className="text-[#6ec4e5] font-bold">60s</span>
            {" TIMER"}
          </p>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
            CLICK <span className="text-[#6ec4e5]">LOG</span> IF THE WORD IS NEW
          </p>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-8">
            CLICK <span className="text-[#6ec4e5]">ARCHIVED</span> IF YOU'VE SEEN IT BEFORE
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 border-2 border-[#6ec4e5] text-[#6ec4e5] font-bold text-lg uppercase tracking-wider hover:bg-[#6ec4e5]/20 transition-colors"
          >
            START CATEGORIZATION
          </button>
          <button
            onClick={() => navigate("/play")}
            className="mt-4 px-6 py-2 border border-white/20 text-white/40 font-bold text-xs uppercase hover:text-white/70 transition-colors"
          >
            {"\u2190 BACK TO BASE"}
          </button>
        </div>
      )}

      {/* GAME OVER SCREEN */}
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
            {lives <= 0 ? "// SYSTEM FAILURE" : "// CATEGORIZATION COMPLETE"}
          </p>
          <h2 className="font-bold text-2xl sm:text-3xl text-[#6ec4e5] uppercase tracking-widest mb-3">
            {lives <= 0 ? "MEMORY BUFFER OVERFLOW" : "RESULTS"}
          </h2>

          <div className="flex gap-8 sm:gap-12 my-6">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">WORDS CATEGORIZED</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{rawScore}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">SCORE</p>
              <p className="font-bold text-3xl sm:text-4xl text-[#6ec4e5]">{score}</p>
            </div>
          </div>

          <p className="text-white/50 text-sm uppercase tracking-wider mb-8">
            {"STATUS : "}
            <span className={"font-bold " + (score > 75 ? "text-green-400" : "text-yellow-400")}>
              {score > 75 ? "AUTHORITY APPROVED" : "MEMORY BUFFER OVERFLOW"}
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
