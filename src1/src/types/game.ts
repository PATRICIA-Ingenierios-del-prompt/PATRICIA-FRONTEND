export interface BackendPiece {
  id: string;
  absolutePosition: number;
  relativePosition: number;
  inJail: boolean;
  atHome: boolean;
}

export interface BackendPlayer {
  id: string;
  name: string;
  color: 'AMARILLO' | 'AZUL' | 'VERDE' | 'ROJO';
  jailAttemptsRemaining: number;
  consecutivePairs: number;
  pieces: BackendPiece[];
}

export interface BackendGameState {
  gameId: string;
  currentPlayerId: string;
  die1: number;
  die2: number;
  moveValue: number;
  diceRolled: boolean;
  die1Used: boolean;
  die2Used: boolean;
  jailExitAvailable: boolean;
  state: 'WAITING_FOR_PLAYERS' | 'IN_PROGRESS' | 'FINISHED';
  winnerId: string | null;
  players: BackendPlayer[];
}
