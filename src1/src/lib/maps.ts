/**
 * Shared Google Maps config for the Events map and the live Location map.
 * The API key is public by design (baked into the bundle) — restrict it by HTTP
 * referrer + API in the Google Cloud console.
 */
import type { EventCategory } from '../types/patricia';

export const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ?? '';

/** Single loader id so useJsApiLoader dedupes across components. */
export const GMAPS_LOADER_ID = 'patricia-gmaps';

/** Escuela Colombiana de Ingeniería campus centre. */
export const ECI_CENTER = { lat: 4.783, lng: -74.0441 };

export const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
];

/** Backend category enum → Spanish label + brand colour + emoji. */
export const CATEGORY_META: Record<EventCategory, { label: string; color: string; emoji: string }> = {
  SPORT: { label: 'Deporte', color: '#FFB347', emoji: '⚽' },
  ENTERTAINMENT: { label: 'Entretenimiento', color: '#FF6B9D', emoji: '🎉' },
  MUSIC: { label: 'Música', color: '#A78BFA', emoji: '🎵' },
  ART: { label: 'Arte', color: '#5BC8FF', emoji: '🎨' },
  TECHNOLOGY: { label: 'Tecnología', color: '#6C63FF', emoji: '💻' },
  STUDY: { label: 'Estudio', color: '#7FE7C4', emoji: '📚' },
  VARIETY: { label: 'Variedad', color: '#FF9F45', emoji: '✨' },
};
export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as EventCategory[];

/** Teardrop pin marker as an inline SVG data-URI. */
export function pinSvg(color: string, selected = false): string {
  const c = color.replace('#', '%23');
  const w = selected ? 36 : 28;
  const h = selected ? 46 : 36;
  const r = selected ? 6 : 5.5;
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 28 36'><path fill='${c}' stroke='white' stroke-width='${selected ? 2.5 : 2}' d='M14 1C7.4 1 2 6.4 2 14c0 9 12 21 12 21S26 23 26 14C26 6.4 20.6 1 14 1z'/><circle cx='14' cy='14' r='${r}' fill='white' opacity='0.9'/></svg>`;
}

/** Pulsing dot marker for a live user position. */
export function userDotSvg(color: string): string {
  const c = color.replace('#', '%23');
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='13' cy='13' r='11' fill='${c}' opacity='0.22'/><circle cx='13' cy='13' r='6' fill='${c}' stroke='white' stroke-width='2'/></svg>`;
}

/** Deterministic colour per user id so a dot keeps its hue across renders. */
const USER_COLORS = ['#6C63FF', '#FF6B9D', '#7FE7C4', '#FFB347', '#5BC8FF', '#A78BFA', '#FF9F45', '#4ADE80'];
export function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return USER_COLORS[hash % USER_COLORS.length];
}
