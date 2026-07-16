export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string; // UUID
  color: string;
  width: number;
  points: Point[];
  createdAt?: string; // ISO 8601 string or similar
}

export interface CursorMessage {
  userId: string;
  x: number;
  y: number;
}

export interface CreateBoardResponse {
  boardId: string;
}

export interface BoardResponse {
  boardId: string;
  strokes: Stroke[];
}
