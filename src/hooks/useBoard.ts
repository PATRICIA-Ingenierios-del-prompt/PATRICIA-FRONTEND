import { useEffect, useState, useRef, useCallback } from 'react';
import { boardApi } from '../services/boardApi';
import { BoardWebSocketService } from '../services/websocket';
import { Stroke, CursorMessage, BoardResponse } from '../types/board';

export function useBoard(parcheId: number, userId: string) {
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

    async function initBoard() {
      try {
        const storageKey = `parche_board_${parcheId}`;
        let savedBoardId = localStorage.getItem(storageKey);

        if (!savedBoardId) {
          const res = await boardApi.createBoard();
          savedBoardId = res.boardId;
          localStorage.setItem(storageKey, savedBoardId);
        }
        
        if (!active) return;
        setBoardId(savedBoardId);

        // Fetch initial state
        try {
          const boardState = await boardApi.getBoard(savedBoardId);
          if (active) setStrokes(boardState.strokes || []);
        } catch (fetchErr) {
          console.warn('Failed to fetch existing board state (it may have been deleted). Creating new one.');
          const res = await boardApi.createBoard();
          savedBoardId = res.boardId;
          localStorage.setItem(storageKey, savedBoardId);
          setBoardId(savedBoardId);
          if (active) setStrokes([]);
        }

      } catch (err: any) {
        if (active) setError(err.message || 'Failed to initialize board');
      }
    }

    initBoard();
    return () => { active = false; };
  }, [parcheId]);

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
