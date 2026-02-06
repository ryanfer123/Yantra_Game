import { useEffect, useRef, useState, useCallback } from "react";
import { getGameState, type GameState } from "@/lib/api";

const POLL_INTERVAL = 3000; // 3 s

/**
 * Polls the Python backend for fresh game state every few seconds.
 * Returns { state, loading, error, refetch }.
 */
export function useGameState(sessionId: string | null) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await getGameState(sessionId);
      setState(data);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch game state");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetchState();
    intervalRef.current = setInterval(fetchState, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId, fetchState]);

  return { state, loading, error, refetch: fetchState };
}
