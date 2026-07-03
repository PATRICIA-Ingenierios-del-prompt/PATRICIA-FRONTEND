import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BackendGameState, BackendPiece } from '../types/game';
import { gameApi } from '../services/gameApi';

// ─── Constants ──────────────────────────────────────────────────────────────

const WS_URL = '/parques-ws';
const MY_PLAYER_ID = 'player-you';
const MY_PLAYER_NAME = 'Tú';
const GAME_ID_KEY = 'parques-game-id';
// Absolute exit positions indexed by player order (AMARILLO, AZUL, VERDE, ROJO)
const BACKEND_EXIT_POSITIONS = [4, 21, 55, 38] as const;
const LADDER_THRESHOLD = 63; // relative positions >= 63 are on the home ladder

// ─── Frontend piece interface (matches the existing board component) ──────────

export interface FrontendPiece {
  id: number;       // 0–15
  player: number;   // 0–3
  trackPos: number; // -1=jail, 0-67=track, -2=ladder(hidden), 100=done
}

// ─── Position conversion ─────────────────────────────────────────────────────

function toFrontendTrackPos(piece: BackendPiece, playerIndex: number): number {
  if (piece.inJail) return -1;
  if (piece.atHome) return 100;
  // Ladder pieces: hide them from the common track (they'll disappear until victory)
  if (piece.relativePosition >= LADDER_THRESHOLD) return -2;
  const exitPos = BACKEND_EXIT_POSITIONS[playerIndex];
  return (piece.absolutePosition - exitPos + 68) % 68;
}

function buildFrontendPieces(state: BackendGameState): FrontendPiece[] {
  return state.players.flatMap((player, pi) =>
    player.pieces.map((p, pieceIdx) => ({
      id: pi * 4 + pieceIdx,
      player: pi,
      trackPos: toFrontendTrackPos(p, pi),
    }))
  );
}

// Choose the right diceSelection based on which dice are still available
function chooseDiceSelection(state: BackendGameState): number {
  if (!state.die1Used && !state.die2Used) return 3; // use sum
  if (state.die1Used && !state.die2Used) return 2;
  if (!state.die1Used && state.die2Used) return 1;
  return 3;
}

// ─── Log helpers ─────────────────────────────────────────────────────────────

function makeLogEntry(prev: BackendGameState | null, curr: BackendGameState): string | null {
  const currentName = curr.players.find(p => p.id === curr.currentPlayerId)?.name ?? '?';

  if (!prev) return `Turno de ${currentName} — tira los dados`;

  if (curr.winnerId && !prev.winnerId) {
    const winnerName = curr.players.find(p => p.id === curr.winnerId)?.name ?? '?';
    return `🏆 ¡${winnerName} GANÓ!`;
  }

  if (curr.state === 'IN_PROGRESS' && prev.state === 'WAITING_FOR_PLAYERS') {
    return `Partida iniciada — turno de ${currentName}`;
  }

  if (curr.diceRolled && !prev.diceRolled && curr.currentPlayerId === prev.currentPlayerId) {
    const { die1, die2 } = curr;
    const rollerName = currentName;
    const isDouble = die1 === die2;
    return `${rollerName} sacó ${die1}+${die2}=${die1 + die2}${isDouble ? ' 🎯 ¡Doble!' : ''}`;
  }

  if (!curr.diceRolled && prev.diceRolled) {
    if (curr.currentPlayerId !== prev.currentPlayerId) {
      return `Turno de ${currentName} — tira los dados`;
    }
    // Same player, doubles case
    return `¡Doble! ${currentName} tira de nuevo`;
  }

  return null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

type InitPhase = 'init' | 'creating' | 'adding_bots' | 'starting' | 'ready';

export function useParquesGame() {
  const [gameState, setGameState] = useState<BackendGameState | null>(null);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const initPhaseRef = useRef<InitPhase>('init');
  const prevStateRef = useRef<BackendGameState | null>(null);
  const rollingRef = useRef(false);
  const rollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDiceRef = useRef<[number, number] | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-12), msg]);
  }, []);

  const send = useCallback((destination: string, body: object) => {
    clientRef.current?.publish({ destination, body: JSON.stringify(body) });
  }, []);

  const handleGameState = useCallback((newState: BackendGameState) => {
    const prev = prevStateRef.current;
    prevStateRef.current = newState;
    setGameState(newState);

    // ── Init state machine ──────────────────────────────────────────────────
    const phase = initPhaseRef.current;
    const gameId = gameIdRef.current!;

    if (phase === 'creating' && newState.players.length >= 1) {
      initPhaseRef.current = 'adding_bots';
      send(`/app/game/${gameId}/addBot`, { difficulty: 'EASY' });
      send(`/app/game/${gameId}/addBot`, { difficulty: 'MEDIUM' });
      send(`/app/game/${gameId}/addBot`, { difficulty: 'HARD' });
    }

    if (initPhaseRef.current === 'adding_bots' && newState.players.length === 4) {
      initPhaseRef.current = 'starting';
      send(`/app/game/${gameId}/start`, {});
    }

    if (initPhaseRef.current === 'starting' && newState.state === 'IN_PROGRESS') {
      initPhaseRef.current = 'ready';
    }

    // ── Dice update & rolling animation ────────────────────────────────────
    const isMyRoll =
      newState.diceRolled &&
      newState.currentPlayerId === MY_PLAYER_ID &&
      (!prev || !prev.diceRolled || prev.currentPlayerId !== MY_PLAYER_ID);

    if (isMyRoll && rollingRef.current) {
      const newDice: [number, number] = [newState.die1, newState.die2];
      if (rollingTimerRef.current) {
        // Timer still running — stash values for when it fires
        pendingDiceRef.current = newDice;
      } else {
        setDice(newDice);
        setRolling(false);
        rollingRef.current = false;
      }
    } else if (!rollingRef.current && newState.die1 > 0) {
      // Update dice display for other players / bot rolls without animation
      setDice([newState.die1, newState.die2]);
    }

    // ── Log ────────────────────────────────────────────────────────────────
    const entry = makeLogEntry(prev, newState);
    if (entry) addLog(entry);
  }, [send, addLog]);

  // ── WebSocket + init ──────────────────────────────────────────────────────

  useEffect(() => {
    const storedId = sessionStorage.getItem(GAME_ID_KEY);

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    clientRef.current = client;

    const subscribeAndHandle = (gameId: string) => {
      client.subscribe(`/topic/game/${gameId}`, msg => {
        if (msg.body) handleGameState(JSON.parse(msg.body) as BackendGameState);
      });
      client.subscribe('/topic/errors', msg => {
        if (msg.body) {
          try { setError((JSON.parse(msg.body) as { error: string }).error); }
          catch { /* ignore */ }
        }
      });
    };

    const createFreshGame = () => {
      const newId = crypto.randomUUID();
      gameIdRef.current = newId;
      sessionStorage.setItem(GAME_ID_KEY, newId);
      subscribeAndHandle(newId);
      initPhaseRef.current = 'creating';
      client.publish({
        destination: '/app/game/create',
        body: JSON.stringify({
          gameId: newId,
          players: [{ id: MY_PLAYER_ID, name: MY_PLAYER_NAME }],
        }),
      });
    };

    client.onConnect = async () => {
      setWsConnected(true);

      if (storedId) {
        try {
          const state = await gameApi.getGame(storedId);
          if (state.state === 'IN_PROGRESS' || state.state === 'WAITING_FOR_PLAYERS') {
            gameIdRef.current = storedId;
            subscribeAndHandle(storedId);
            initPhaseRef.current = state.state === 'IN_PROGRESS' ? 'ready' : 'starting';
            handleGameState(state);
            return;
          }
        } catch {
          sessionStorage.removeItem(GAME_ID_KEY);
        }
      }

      createFreshGame();
    };

    client.onDisconnect = () => setWsConnected(false);

    client.onStompError = frame => {
      console.error('[ParquesWS] STOMP error:', frame.headers['message']);
    };

    client.activate();

    return () => {
      if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current);
      client.deactivate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const rollDice = useCallback(() => {
    const gs = gameState;
    if (!gs || rollingRef.current || gs.diceRolled || gs.state !== 'IN_PROGRESS' || gs.currentPlayerId !== MY_PLAYER_ID) return;

    setRolling(true);
    rollingRef.current = true;
    pendingDiceRef.current = null;

    // Minimum animation duration so the dice spin is visible
    rollingTimerRef.current = setTimeout(() => {
      rollingTimerRef.current = null;
      const pending = pendingDiceRef.current;
      if (pending) {
        setDice(pending);
        pendingDiceRef.current = null;
      }
      setRolling(false);
      rollingRef.current = false;
    }, 650);

    send(`/app/game/${gameIdRef.current}/roll`, { playerId: MY_PLAYER_ID });
  }, [gameState, send]);

  const movePiece = useCallback((piece: FrontendPiece) => {
    const gs = gameState;
    if (!gs || !gs.diceRolled || gs.state !== 'IN_PROGRESS' || gs.currentPlayerId !== MY_PLAYER_ID) return;
    if (piece.player !== gs.players.findIndex(p => p.id === MY_PLAYER_ID)) return;

    const player = gs.players[piece.player];
    if (!player) return;

    const pieceIndexInPlayer = piece.id - piece.player * 4;
    const backendPiece = player.pieces[pieceIndexInPlayer];
    if (!backendPiece) return;

    setError(null);
    send(`/app/game/${gameIdRef.current}/move`, {
      playerId: MY_PLAYER_ID,
      pieceId: backendPiece.id,
      diceSelection: chooseDiceSelection(gs),
    });
  }, [gameState, send]);

  const skipTurn = useCallback(() => {
    const gs = gameState;
    if (!gs || !gs.diceRolled || gs.currentPlayerId !== MY_PLAYER_ID) return;
    setError(null);
    send(`/app/game/${gameIdRef.current}/pass`, { playerId: MY_PLAYER_ID });
  }, [gameState, send]);

  const resetGame = useCallback(() => {
    sessionStorage.removeItem(GAME_ID_KEY);
    prevStateRef.current = null;
    window.location.reload();
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const pieces = useMemo((): FrontendPiece[] => {
    if (!gameState) {
      return Array.from({ length: 16 }, (_, i) => ({
        id: i,
        player: Math.floor(i / 4),
        trackPos: -1,
      }));
    }
    return buildFrontendPieces(gameState);
  }, [gameState]);

  const currentPlayer = useMemo(() => {
    if (!gameState) return 0;
    const idx = gameState.players.findIndex(p => p.id === gameState.currentPlayerId);
    return idx >= 0 ? idx : 0;
  }, [gameState]);

  const myPlayerIndex = useMemo(() => {
    if (!gameState) return 0;
    const idx = gameState.players.findIndex(p => p.id === MY_PLAYER_ID);
    return idx >= 0 ? idx : 0;
  }, [gameState]);

  const winner = useMemo((): number | null => {
    if (!gameState?.winnerId) return null;
    const idx = gameState.players.findIndex(p => p.id === gameState.winnerId);
    return idx >= 0 ? idx : null;
  }, [gameState]);

  const playerNames = useMemo(
    () => gameState?.players.map(p => p.name) ?? ['Tú', 'Felipe', 'Sofía', 'Andrés'],
    [gameState]
  );

  const hasDiced = gameState?.diceRolled ?? false;
  const isMyTurn = gameState?.currentPlayerId === MY_PLAYER_ID && gameState?.state === 'IN_PROGRESS';
  const diceSum = dice[0] + dice[1];
  const isDouble = dice[0] === dice[1];
  const gameStatus = gameState?.state ?? 'WAITING_FOR_PLAYERS';

  return {
    pieces,
    currentPlayer,
    myPlayerIndex,
    dice,
    rolling,
    hasDiced,
    isDouble,
    diceSum,
    winner,
    log,
    error,
    isMyTurn,
    wsConnected,
    playerNames,
    gameStatus,
    rollDice,
    movePiece,
    skipTurn,
    resetGame,
  };
}
