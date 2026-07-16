import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import { BackendGameState, BackendPiece } from '../types/game';
import { gameApi } from '../services/gameApi';

// ─── Constants ──────────────────────────────────────────────────────────────

// Native WebSocket against the SockJS endpoint's raw-WS transport. The gateway
// routes /parques-ws/** with a ws:// URI, which only proxies Upgrade requests —
// SockJS's initial HTTP GET /info dies there with a 400, so we skip SockJS
// entirely (same pattern as the board/chat sockets).
function parquesWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/parques-ws/websocket`;
}
// Absolute exit positions indexed by player order (AMARILLO, AZUL, VERDE, ROJO)
const BACKEND_EXIT_POSITIONS = [4, 21, 55, 38] as const;
const LADDER_THRESHOLD = 63; // relative positions >= 63 are on the home ladder
const MAX_REMATCH_PROBES = 10;

// ─── Frontend piece interface (matches the existing board component) ──────────

export interface FrontendPiece {
  id: number;       // 0–15
  player: number;   // 0–3
  trackPos: number; // -1=jail, 0-67=track, -2=ladder(hidden), 100=done
}

export interface ParquesGameOptions {
  /**
   * Shared game id (the parche's collabs.parquesId). When set, the hook JOINS
   * that game (multiplayer lobby: parche members + optional bots). When null/
   * undefined, it runs solo mode: a private game vs 3 bots, auto-started.
   */
  gameId?: string | null;
  userId: string;
  userName: string;
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

/**
 * Shared games reuse the parche's fixed parquesId, but a FINISHED game can't
 * be re-created on the backend (create only runs on not-found). Rematches use
 * deterministic suffixes — base, base-r1, base-r2… — so every member probes
 * the same sequence and lands on the same active (or first missing) id.
 */
async function resolveSharedGameId(baseId: string): Promise<string> {
  for (let n = 0; n < MAX_REMATCH_PROBES; n++) {
    const id = n === 0 ? baseId : `${baseId}-r${n}`;
    try {
      const state = await gameApi.getGame(id);
      if (state.state !== 'FINISHED') return id; // joinable (lobby or live)
    } catch {
      return id; // not found → this is the next game to create
    }
  }
  return `${baseId}-r${MAX_REMATCH_PROBES}`;
}

// ─── Log helpers ─────────────────────────────────────────────────────────────

function makeLogEntry(prev: BackendGameState | null, curr: BackendGameState): string | null {
  const currentName = curr.players.find(p => p.id === curr.currentPlayerId)?.name ?? '?';

  if (!prev) {
    return curr.state === 'WAITING_FOR_PLAYERS'
      ? 'Sala abierta — esperando jugadores'
      : `Turno de ${currentName} — tira los dados`;
  }

  if (curr.winnerId && !prev.winnerId) {
    const winnerName = curr.players.find(p => p.id === curr.winnerId)?.name ?? '?';
    return `¡${winnerName} GANÓ!`;
  }

  if (curr.players.length > prev.players.length) {
    const joined = curr.players[curr.players.length - 1];
    return `${joined?.name ?? 'Alguien'} se unió a la partida`;
  }

  if (curr.state === 'IN_PROGRESS' && prev.state === 'WAITING_FOR_PLAYERS') {
    return `Partida iniciada — turno de ${currentName}`;
  }

  if (curr.diceRolled && !prev.diceRolled && curr.currentPlayerId === prev.currentPlayerId) {
    const { die1, die2 } = curr;
    const isDouble = die1 === die2;
    return `${currentName} sacó ${die1}+${die2}=${die1 + die2}${isDouble ? ' ¡Doble!' : ''}`;
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

type InitPhase = 'init' | 'creating' | 'adding_bots' | 'starting' | 'lobby' | 'ready';

export function useParquesGame({ gameId: sharedBaseId, userId, userName }: ParquesGameOptions) {
  const isShared = !!sharedBaseId;
  const myId = userId || 'player-you';
  const myName = userName || 'Tú';
  const soloStorageKey = `parques-game-id:${myId}`;

  const [gameState, setGameState] = useState<BackendGameState | null>(null);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);
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
    // Ignore broadcasts for a game we already left (rematch swaps the id)
    if (newState.gameId && gameIdRef.current && newState.gameId !== gameIdRef.current) return;

    const prev = prevStateRef.current;
    prevStateRef.current = newState;
    setGameState(newState);

    // ── Init state machine (solo mode auto-fills bots and starts) ──────────
    const phase = initPhaseRef.current;
    const gameId = gameIdRef.current!;

    if (!isShared) {
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
    }

    if (newState.state === 'IN_PROGRESS') initPhaseRef.current = 'ready';

    // ── Dice update & rolling animation ────────────────────────────────────
    const isMyRoll =
      newState.diceRolled &&
      newState.currentPlayerId === myId &&
      (!prev || !prev.diceRolled || prev.currentPlayerId !== myId);

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
  }, [send, addLog, isShared, myId]);

  // ── Subscription / game bootstrap helpers ─────────────────────────────────

  const subscribeToGame = useCallback((gameId: string) => {
    const client = clientRef.current;
    if (!client) return;
    subsRef.current.forEach(s => { try { s.unsubscribe(); } catch { /* already gone */ } });
    subsRef.current = [
      client.subscribe(`/exchange/amq.topic/game.${gameId}`, msg => {
        if (msg.body) handleGameState(JSON.parse(msg.body) as BackendGameState);
      }),
      client.subscribe('/exchange/amq.topic/errors', msg => {
        if (msg.body) {
          try { setError((JSON.parse(msg.body) as { error: string }).error); }
          catch { /* ignore */ }
        }
      }),
    ];
  }, [handleGameState]);

  /** Shared mode: resolve the active id for the parche and join it. */
  const joinSharedGame = useCallback(async () => {
    if (!sharedBaseId) return;
    const id = await resolveSharedGameId(sharedBaseId);
    gameIdRef.current = id;
    prevStateRef.current = null;
    setGameState(null);
    subscribeToGame(id);
    initPhaseRef.current = 'lobby';
    // join creates the game if it doesn't exist yet (backend handles both)
    send(`/app/game/${id}/join`, { playerId: myId, playerName: myName });
  }, [sharedBaseId, subscribeToGame, send, myId, myName]);

  /** Solo mode: fresh private game (this player + 3 bots, auto-start). */
  const createSoloGame = useCallback(() => {
    const newId = crypto.randomUUID();
    gameIdRef.current = newId;
    sessionStorage.setItem(soloStorageKey, newId);
    prevStateRef.current = null;
    setGameState(null);
    subscribeToGame(newId);
    initPhaseRef.current = 'creating';
    send('/app/game/create', {
      gameId: newId,
      players: [{ id: myId, name: myName }],
    });
  }, [soloStorageKey, subscribeToGame, send, myId, myName]);

  // ── WebSocket + init ──────────────────────────────────────────────────────

  useEffect(() => {
    const client = new Client({
      brokerURL: parquesWsUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    clientRef.current = client;

    client.onConnect = async () => {
      setWsConnected(true);

      if (isShared) {
        await joinSharedGame();
        return;
      }

      // Solo: resume the stored game if it's still alive and we're in it
      const storedId = sessionStorage.getItem(soloStorageKey);
      if (storedId) {
        try {
          const state = await gameApi.getGame(storedId);
          const iAmIn = state.players.some(p => p.id === myId);
          if (iAmIn && (state.state === 'IN_PROGRESS' || state.state === 'WAITING_FOR_PLAYERS')) {
            gameIdRef.current = storedId;
            subscribeToGame(storedId);
            // WAITING resume re-enters 'creating' so missing bots get re-added
            // (addBot is idempotent-ish: the backend ignores it when full).
            initPhaseRef.current = state.state === 'IN_PROGRESS' ? 'ready' : 'creating';
            handleGameState(state);
            return;
          }
        } catch {
          sessionStorage.removeItem(soloStorageKey);
        }
      }
      createSoloGame();
    };

    client.onDisconnect = () => setWsConnected(false);

    client.onStompError = frame => {
      console.error('[ParquesWS] STOMP error:', frame.headers['message']);
    };

    client.activate();

    return () => {
      if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current);
      subsRef.current = [];
      client.deactivate();
    };
  // Reconnect from scratch when the game target or identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBaseId, myId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const rollDice = useCallback(() => {
    const gs = gameState;
    if (!gs || rollingRef.current || gs.diceRolled || gs.state !== 'IN_PROGRESS' || gs.currentPlayerId !== myId) return;

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

    send(`/app/game/${gameIdRef.current}/roll`, { playerId: myId });
  }, [gameState, send, myId]);

  const movePiece = useCallback((piece: FrontendPiece) => {
    const gs = gameState;
    if (!gs || !gs.diceRolled || gs.state !== 'IN_PROGRESS' || gs.currentPlayerId !== myId) return;
    if (piece.player !== gs.players.findIndex(p => p.id === myId)) return;

    const player = gs.players[piece.player];
    if (!player) return;

    const pieceIndexInPlayer = piece.id - piece.player * 4;
    const backendPiece = player.pieces[pieceIndexInPlayer];
    if (!backendPiece) return;

    setError(null);
    send(`/app/game/${gameIdRef.current}/move`, {
      playerId: myId,
      pieceId: backendPiece.id,
      diceSelection: chooseDiceSelection(gs),
    });
  }, [gameState, send, myId]);

  const skipTurn = useCallback(() => {
    const gs = gameState;
    if (!gs || !gs.diceRolled || gs.currentPlayerId !== myId) return;
    setError(null);
    send(`/app/game/${gameIdRef.current}/pass`, { playerId: myId });
  }, [gameState, send, myId]);

  /** Release pieces from jail with the rolled 5 / pair (consumes both dice). */
  const exitJail = useCallback(() => {
    const gs = gameState;
    if (!gs || !gs.jailExitAvailable || gs.die1Used || gs.die2Used || gs.currentPlayerId !== myId) return;
    setError(null);
    send(`/app/game/${gameIdRef.current}/exitJail`, { playerId: myId });
  }, [gameState, send, myId]);

  /** Lobby (shared mode): add an AI opponent before starting. */
  const addBot = useCallback((difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM') => {
    if (!gameIdRef.current) return;
    send(`/app/game/${gameIdRef.current}/addBot`, { difficulty });
  }, [send]);

  /** Lobby (shared mode): start the match (needs ≥2 players). */
  const startGame = useCallback(() => {
    const gs = gameState;
    if (!gs || gs.state !== 'WAITING_FOR_PLAYERS' || gs.players.length < 2) return;
    send(`/app/game/${gameIdRef.current}/start`, {});
  }, [gameState, send]);

  /** New match without reloading the app: rematch (shared) or fresh solo game. */
  const resetGame = useCallback(() => {
    setError(null);
    setLog([]);
    setDice([1, 1]);
    if (isShared) {
      void joinSharedGame();
    } else {
      sessionStorage.removeItem(soloStorageKey);
      createSoloGame();
    }
  }, [isShared, joinSharedGame, createSoloGame, soloStorageKey]);

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
    const idx = gameState.players.findIndex(p => p.id === myId);
    return idx >= 0 ? idx : 0;
  }, [gameState, myId]);

  const winner = useMemo((): number | null => {
    if (!gameState?.winnerId) return null;
    const idx = gameState.players.findIndex(p => p.id === gameState.winnerId);
    return idx >= 0 ? idx : null;
  }, [gameState]);

  const playerNames = useMemo(
    () => gameState?.players.map(p => p.name) ?? (isShared ? [] : ['Tú', 'Jugador 2', 'Jugador 3', 'Jugador 4']),
    [gameState, isShared]
  );

  const hasDiced = gameState?.diceRolled ?? false;
  const isMyTurn = gameState?.currentPlayerId === myId && gameState?.state === 'IN_PROGRESS';
  const canExitJail = !!gameState && isMyTurn && gameState.jailExitAvailable && !gameState.die1Used && !gameState.die2Used;
  const diceSum = dice[0] + dice[1];
  const isDouble = dice[0] === dice[1];
  const gameStatus = gameState?.state ?? 'WAITING_FOR_PLAYERS';
  const playerCount = gameState?.players.length ?? 0;

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
    canExitJail,
    wsConnected,
    playerNames,
    playerCount,
    gameStatus,
    isShared,
    rollDice,
    movePiece,
    skipTurn,
    exitJail,
    addBot,
    startGame,
    resetGame,
  };
}
