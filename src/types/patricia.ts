/**
 * TypeScript mirrors of the Parches / Events / Location backend DTOs and enums,
 * exactly as the gateway serialises them. IDs are UUID strings; dates use the
 * backend JSON formats (eventDate "yyyy-MM-dd", start/endTime "HH:mm", Instants
 * as ISO-8601 strings).
 */

export type UUID = string;

/* ── Spring pagination ── */
export interface Pageable {
  page?: number;
  size?: number;
}
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

/* ── shared value objects ── */
export interface LocationDto {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  placeId: string | null;
}
export interface PictureUploadRequest {
  contentType: string;
  fileSize?: number | null;
}
export interface PictureUploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  publicUrl: string;
  objectKey: string;
}

/* ── Parches ── */
export type ParcheCategory =
  | 'SPORT' | 'ENTERTAINMENT' | 'MUSIC' | 'ART' | 'TECHNOLOGY' | 'STUDY' | 'VARIETY';
export type Visibility = 'PUBLIC' | 'PRIVATE';
export type ParcheStatus = 'PENDING_PROVISIONING' | 'READY';

export interface CreateParcheRequest {
  name: string;
  description: string;
  category: ParcheCategory;
  maxCapacity: number;
  visibility: Visibility;
  pictureUrl?: string;
}
export interface CreateParcheResponse {
  parcheId: UUID;
  name: string;
  description: string;
  visibility: Visibility;
  status: ParcheStatus;
  pictureUrl: string;
}
export interface ParcheResponse {
  name: string;
  description: string;
  category: ParcheCategory;
  visibility: Visibility;
  status: ParcheStatus;
  maxCapacity: number;
  memberCount: number;
  pictureUrl: string;
  communication: CommunicationChannels | null;
}
export interface ParcheSummaryResponse {
  parcheId: UUID;
  name: string;
  description: string;
  category: ParcheCategory;
  visibility: Visibility;
  status: ParcheStatus;
  maxCapacity: number;
  memberCount: number;
  pictureUrl: string;
}
export interface CreateInviteRequest { parcheId: UUID; }
export interface InviteTokenResponse { token: string; expiresInSeconds: number; }

/* ── Events ── */
export type EventCategory = ParcheCategory; // same enum on the Events MS
export type ReportType =
  | 'AGGRESSION' | 'BAD_BEHAVIOUR' | 'ACCIDENT' | 'MEDICAL_EMERGENCY'
  | 'HARASSMENT' | 'THEFT' | 'LOST_PERSON' | 'OTHER';

export interface CreateEventRequest {
  name: string;
  description: string;
  category: EventCategory;
  maxCapacity: number;
  eventDate: string;   // yyyy-MM-dd
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  meetingPoint?: LocationDto | null;
  destination?: LocationDto | null;
  pictureUrl?: string;
}
export interface CreateEventLinkedToParcheRequest extends CreateEventRequest {
  parcheId: UUID;
}
export interface CreateEventResponse {
  eventId: UUID;
  name: string;
  description: string;
  category: EventCategory;
  parcheId: UUID | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  pictureUrl: string;
}
export interface EventResponse {
  name: string;
  description: string;
  category: EventCategory;
  maxCapacity: number;
  participantCount: number;
  started: boolean;
  parcheId: UUID | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  meetingPoint: LocationDto | null;
  destination: LocationDto | null;
  pictureUrl: string;
}
export interface EventMapResponse {
  eventId: UUID;
  name: string;
  eventDate: string;
  startTime: string;
  destination: LocationDto | null;
  category: EventCategory;
  description: string;
  spotsLeft: number;
  maxCapacity: number;
}
export interface CreateReportRequest { reportType: ReportType; description: string; }
export interface CreateReportResponse {
  reportId: UUID;
  eventId: UUID;
  reporterId: UUID;
  reportType: ReportType;
  reportedAt: string;
}

/* ── Location ── */
export interface UpdateLocationRequest { latitude: number; longitude: number; }
export interface LiveLocationResponse {
  userId: UUID;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

/* ── geo socket frames ── */
export interface GeoBroadcastMessage {
  userId: UUID;
  latitude: number;
  longitude: number;
  recordedAt: string;
}
export interface GeoSnapshotMessage {
  eventId: UUID;
  positions: GeoBroadcastMessage[];
}

export interface CommunicationChannels {
  chatId: UUID | null;
  voiceId: UUID | null;
}

