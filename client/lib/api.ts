/**
 * YANTRA 2026 – API client
 * Talks to the Python Flask backend on Cloud Run.
 */

const API_BASE =
  import.meta.env.VITE_API_URL ??
  "https://yantra-game-server-79752798341.us-central1.run.app";

// ---------- helpers ----------

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const json = await res.json();
  if (!res.ok) throw new ApiError(json.error ?? res.statusText, res.status, json);
  return json as T;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// ---------- Auth ----------

export async function verifyToken(idToken: string) {
  return request<{ success: boolean; uid: string }>("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function registerUser(email: string, displayName: string) {
  return request<{
    success: boolean;
    userId: string;
    message: string;
    tempPassword: string;
  }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, displayName }),
  });
}

// ---------- Session ----------

export async function createSession() {
  return request<{ success: boolean; sessionId: string; session: GameSession }>(
    "/api/session/create",
    { method: "POST" }
  );
}

export async function joinSession(sessionId: string) {
  return request<{ success: boolean; playerCount: number }>(
    `/api/session/${sessionId}/join`,
    { method: "POST" }
  );
}

export async function startSession(sessionId: string) {
  return request<{ success: boolean; roles: Record<string, string> }>(
    `/api/session/${sessionId}/start`,
    { method: "POST" }
  );
}

export async function nextRound(sessionId: string) {
  return request<{
    success: boolean;
    gameOver?: boolean;
    winner?: string;
    newRound?: number;
    roles?: Record<string, string>;
  }>(`/api/session/${sessionId}/nextRound`, { method: "POST" });
}

// ---------- Game state ----------

export async function getGameState(sessionId: string) {
  return request<GameState>(`/api/session/${sessionId}/state`);
}

export async function getLeaderboard(sessionId: string) {
  return request<{
    success: boolean;
    leaderboard: LeaderboardEntry[];
  }>(`/api/session/${sessionId}/leaderboard`);
}

// ---------- Minigames ----------

export async function getMinigame(sessionId: string) {
  return request<{
    success: boolean;
    problemId: string;
    problem: MinigameProblem;
    timeLimit: number;
  }>(`/api/session/${sessionId}/minigame`);
}

export async function submitMinigame(
  sessionId: string,
  problemId: string,
  answer: number,
  infectionLevel?: "none" | "minor" | "major"
) {
  return request<{
    success: boolean;
    certificateId: string;
    score: number;
    bufferTime: number;
  }>(`/api/session/${sessionId}/minigame/submit`, {
    method: "POST",
    body: JSON.stringify({ problemId, answer, infectionLevel }),
  });
}

// ---------- Authority ----------

export async function getPendingCertificates(sessionId: string) {
  return request<{
    success: boolean;
    certificates: PendingCertificate[];
  }>(`/api/session/${sessionId}/certificates/pending`);
}

export async function processCertificate(
  sessionId: string,
  certId: string,
  action: "approve" | "reject",
  medianEstimate: number
) {
  return request<{
    success: boolean;
    approved: boolean;
    healthChange: number;
    winner: string | null;
  }>(`/api/session/${sessionId}/certificates/${certId}/process`, {
    method: "POST",
    body: JSON.stringify({ action, medianEstimate }),
  });
}

// ---------- Auditor ----------

export async function getLedger(sessionId: string) {
  return request<{
    success: boolean;
    entries: LedgerEntry[];
  }>(`/api/session/${sessionId}/ledger`);
}

export async function issueCooldown(
  sessionId: string,
  targetPlayerId: string,
  reason: string
) {
  return request<{ success: boolean; cooldownDuration: number }>(
    `/api/session/${sessionId}/cooldown`,
    {
      method: "POST",
      body: JSON.stringify({ targetPlayerId, reason }),
    }
  );
}

// ---------- Types ----------

export interface GameSession {
  id: string;
  status: "waiting" | "active" | "completed";
  currentRound: number;
  globalHealth: number;
  createdAt: number;
  medianScore: number;
}

export interface GameState {
  success: boolean;
  globalHealth: number;
  currentRound: number;
  status: "waiting" | "active" | "completed";
  winner?: string;
  playerRole?: "citizen" | "attacker" | "authority" | "auditor";
  playerTrustScore: number;
  cooldownUntil: number;
  totalPlayers: number;
}

export interface MinigameProblem {
  type: string;
  problemId: number;
  instruction: string;
  targetValue?: number;
  tolerance?: number;
  minValue?: number;
  maxValue?: number;
  readings?: number[];
  sequence?: number[];
  leftWeight?: number;
  rightWeight?: number;
  baseFrequency?: number;
  harmonic?: number;
}

export interface PendingCertificate {
  id: string;
  problemType: string;
  score: number;
  createdAt: number;
}

export interface LeaderboardEntry {
  playerId: string;
  trustScore: number;
  role: string;
}

export interface LedgerEntry {
  certificateId: string;
  playerId: string;
  authorityId: string;
  action: string;
  score: number;
  wasInfected: boolean;
  healthChange: number;
  timestamp: number;
}
