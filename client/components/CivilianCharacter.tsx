import { useEffect, useState, useRef } from "react";

/**
 * Spritesheet: /civilian-spritesheet.png (853 × 1280)
 * Frames extracted from Figma node positions:
 *   walking1 : x≈25,  y≈6,   w≈224, h≈267
 *   walking2 : x≈230, y≈0,   w≈209, h≈270
 *   standing : x≈624, y≈0,   w≈217, h≈267
 */

const SPRITE = "/civilian-spritesheet.png";

const FRAMES = {
  standing: { x: 624, y: 0, w: 217, h: 267 },
  walk1: { x: 25, y: 6, w: 224, h: 267 },
  walk2: { x: 230, y: 0, w: 209, h: 270 },
} as const;

const CHAR_W = 96;
const CHAR_H = 120;
const MOVE_SPEED = 4;
const ANIM_INTERVAL = 200; // ms per walk frame

// Character hitbox in % (smaller than sprite for forgiving feel)
const HB_W = 3; // % of viewport width
const HB_H = 4; // % of viewport height

/**
 * Obstacle zones mapped from the user's red-marked screenshot.
 * Rectangles: { x1, y1, x2, y2 } in viewport-%.
 * The central portal uses an ellipse collision.
 */

// Rectangular obstacles
const RECT_OBSTACLES = [
  // Top wall / health bar
  { x1: 0, y1: 0, x2: 100, y2: 8 },
  // Left console/machine (upper-left)
  { x1: 0, y1: 8, x2: 35, y2: 38 },
  // Right console/panels + pipes (upper-right)
  { x1: 62, y1: 8, x2: 100, y2: 30 },
  // Left battery panels
  { x1: 7, y1: 55, x2: 26, y2: 77 },
  // Right battery panels
  { x1: 78, y1: 55, x2: 97, y2: 77 },
  // Bottom-left pipes
  { x1: 0, y1: 76, x2: 8, y2: 100 },
  // Bottom-right pipes
  { x1: 68, y1: 85, x2: 100, y2: 100 },
  // Bottom edge
  { x1: 0, y1: 97, x2: 100, y2: 100 },
];

// Central portal – elliptical collision
const PORTAL = { cx: 50, cy: 50, rx: 26, ry: 32 };

/** Check if a point (character centre) collides with any obstacle */
function collides(cx: number, cy: number): boolean {
  const halfW = HB_W / 2;
  const halfH = HB_H / 2;

  // Check rectangular obstacles
  for (const ob of RECT_OBSTACLES) {
    if (
      cx + halfW > ob.x1 &&
      cx - halfW < ob.x2 &&
      cy + halfH > ob.y1 &&
      cy - halfH < ob.y2
    ) {
      return true;
    }
  }

  // Check elliptical portal
  const edx = (cx - PORTAL.cx) / (PORTAL.rx + halfW);
  const edy = (cy - PORTAL.cy) / (PORTAL.ry + halfH);
  if (edx * edx + edy * edy < 1) {
    return true;
  }

  return false;
}

type Direction = "left" | "right";

export default function CivilianCharacter() {
  const [pos, setPos] = useState({ x: 50, y: 18 }); // start near the door (top-center)
  const [facing, setFacing] = useState<Direction>("right");
  const facingRef = useRef<Direction>("right");
  const [isMoving, setIsMoving] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Key tracking
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Movement loop with collision
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (keys.has("a")) dx -= 1;
      if (keys.has("d")) dx += 1;
      if (keys.has("w")) dy -= 1;
      if (keys.has("s")) dy += 1;

      const moving = dx !== 0 || dy !== 0;
      setIsMoving(moving);

      if (dx < 0 && facingRef.current !== "left") {
        facingRef.current = "left";
        setFacing("left");
      } else if (dx > 0 && facingRef.current !== "right") {
        facingRef.current = "right";
        setFacing("right");
      }

      if (moving) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / len) * MOVE_SPEED * 0.15;
        dy = (dy / len) * MOVE_SPEED * 0.15;

        setPos((prev) => {
          // Try full move
          let nx = prev.x + dx;
          let ny = prev.y + dy;

          // Clamp to viewport
          nx = Math.max(2, Math.min(98, nx));
          ny = Math.max(5, Math.min(98, ny));

          if (!collides(nx, ny)) return { x: nx, y: ny };

          // Slide along X only
          const slideX = { x: nx, y: prev.y };
          if (!collides(slideX.x, slideX.y)) return slideX;

          // Slide along Y only
          const slideY = { x: prev.x, y: ny };
          if (!collides(slideY.x, slideY.y)) return slideY;

          // Blocked in both axes
          return prev;
        });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Walk animation cycle
  useEffect(() => {
    if (isMoving) {
      animRef.current = setInterval(() => {
        setWalkFrame((f) => (f === 0 ? 1 : 0));
      }, ANIM_INTERVAL);
    } else {
      if (animRef.current) clearInterval(animRef.current);
      setWalkFrame(0);
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [isMoving]);

  // Pick the current frame data
  const frame = isMoving
    ? walkFrame === 0
      ? FRAMES.walk1
      : FRAMES.walk2
    : FRAMES.standing;

  // background-position and background-size to crop the spritesheet
  const bgSizeX = (853 / frame.w) * 100;
  const bgSizeY = (1280 / frame.h) * 100;
  const bgPosX = (frame.x / (853 - frame.w)) * 100;
  const bgPosY = (frame.y / (1280 - frame.h)) * 100;

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: CHAR_W,
        height: CHAR_H,
        transform: `translate(-50%, -50%) scaleX(${facing === "right" ? -1 : 1})`,
        transition: "left 0.05s linear, top 0.05s linear",
      }}
    >
      <div
        className="w-full h-full pixelated"
        style={{
          backgroundImage: `url(${SPRITE})`,
          backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
          backgroundPosition: `${bgPosX}% ${bgPosY}%`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
