import { useEffect, useState, useRef, useCallback } from 'react';
import { boardApi } from '../services/boardApi';
import { BoardWebSocketService } from '../services/websocket';
import { Stroke, CursorMessage } from '../types/board';

/**
 * Live board state + socket for a parche's canvas.
 *
 * @param canvasId The REAL board id provisioned by the Board MS (from the
 *                 parche's CollaborationTools.canvasId). Null while the
 *                 parche detail is loading or provisioning hasn't landed —
 *                 the hook stays idle until it arrives.
 * @param userId   The authenticated user's UUID (cursor attribution).
 */
export function useBoard(canvasId: string | null, userId: string) {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorMessage>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsServiceRef = useRef<BoardWebSocketService | null>(null);

  // To prevent echoing our own strokes, we keep track of sent stroke IDs
  const pendingStrokesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function initBoard(id: string) {
      try {
        // Fetch initial state. The Board MS provisioned this canvas when the
        // parche was created (parche.created -> board.ready), so it should
        // exist; createBoard is only a self-heal for canvases lost to a
        // Board MS restart (its provisioning map is in-memory).
        try {
          const boardState = await boardApi.getBoard(id);
          if (active) setStrokes(boardState.strokes || []);
        } catch {
          console.warn('Board not found; re-creating canvas', id);
          await boardApi.createBoard(id);
          if (active) setStrokes([]);
        }
        if (active) setBoardId(id);
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to initialize board');
      }
    }

    setBoardId(null);
    setStrokes([]);
    setRemoteCursors({});
    setError(null);
    if (canvasId) void initBoard(canvasId);
    return () => { active = false; };
  }, [canvasId]);

  useEffect(() => {
    if (!boardId) return;

    const wsService = new BoardWebSocketService(
      () => setIsConnected(true),
      () => setIsConnected(false),
      boardId,
      (stroke) => {
        // If we sent this stroke, remove from pending and don't duplicate
        if (pendingStrokesRef.current.has(stroke.id)) {
          pendingStrokesRef.current.delete(stroke.id);
          return;
        }
        setStrokes(prev => [...prev, stroke]);
      },
      () => {
        setStrokes([]);
      },
      (cursor) => {
        if (cursor.userId !== userId) {
          setRemoteCursors(prev => ({
            ...prev,
            [cursor.userId]: cursor
          }));
        }
      }
    );

    wsService.connect();
    wsServiceRef.current = wsService;

    return () => {
      wsService.disconnect();
      wsServiceRef.current = null;
    };
  }, [boardId, userId]);

  const sendStroke = useCallback((stroke: Stroke) => {
    pendingStrokesRef.current.add(stroke.id);
    // Add locally immediately for perceived performance
    setStrokes(prev => [...prev, stroke]);
    if (wsServiceRef.current) {
      wsServiceRef.current.sendStroke(stroke);
    }
  }, []);

  const sendCursor = useCallback((cursor: CursorMessage) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.sendCursor(cursor);
    }
  }, []);

  const clearBoard = useCallback(async () => {
    if (!boardId) return;
    try {
      await boardApi.clearBoard(boardId);
      // Wait for WS event to clear locally, or do it speculatively? 
      // WS event will clear for everyone.
    } catch (err) {
      console.error('Failed to clear board', err);
    }
  }, [boardId]);

  return {
    boardId,
    strokes,
    remoteCursors,
    isConnected,
    error,
    sendStroke,
    sendCursor,
    clearBoard,
  };
}
