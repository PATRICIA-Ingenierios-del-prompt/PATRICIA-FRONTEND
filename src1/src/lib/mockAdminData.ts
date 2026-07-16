/**
 * Simulated admin dashboard data — there's no backend endpoint yet for global
 * user/parche counts or breakdowns, so this stands in until one exists.
 */

export interface CarreraCount {
  carrera: string;
  count: number;
}

export const CARRERA_BREAKDOWN: CarreraCount[] = [
  { carrera: 'Ingeniería de Sistemas',             count: 214 },
  { carrera: 'Ingeniería Industrial',               count: 168 },
  { carrera: 'Ingeniería Civil',                    count: 143 },
  { carrera: 'Administración de Empresas',          count: 121 },
  { carrera: 'Ingeniería Electrónica',              count: 98  },
  { carrera: 'Ingeniería Eléctrica',                count: 76  },
  { carrera: 'Economía',                            count: 71  },
  { carrera: 'Ingeniería Mecánica',                 count: 64  },
  { carrera: 'Ingeniería Biomédica',                count: 58  },
  { carrera: 'Ingeniería de Inteligencia Artificial', count: 52 },
  { carrera: 'Matemáticas',                         count: 41  },
  { carrera: 'Ingeniería Ambiental',                count: 37  },
  { carrera: 'Ingeniería de Ciberseguridad',        count: 33  },
  { carrera: 'Ingeniería Estadística',              count: 24  },
  { carrera: 'Ingeniería en Biotecnología',         count: 19  },
  { carrera: 'Postgrado',                           count: 27  },
];

export const TOTAL_USERS_REGISTERED = CARRERA_BREAKDOWN.reduce((sum, c) => sum + c.count, 0);

// Kept mock, deliberately not mixed with parcheService's filtered/paginated
// counts — those only ever return totals for a specific category/visibility,
// not a true global count, and mixing a real-but-partial number with mock
// ones would mislabel it as "total".
export const TOTAL_PARCHES = 356;

export interface RecentSignup {
  id: string;
  name: string;
  carrera: string;
  date: string; // ISO string
}

export const RECENT_SIGNUPS: RecentSignup[] = [
  { id: 's1', name: 'Laura Jiménez',   carrera: 'Ingeniería de Sistemas',    date: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
  { id: 's2', name: 'Juan Pablo Rico', carrera: 'Ingeniería Industrial',     date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 's3', name: 'Camila Duarte',   carrera: 'Administración de Empresas', date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: 's4', name: 'Sebastián Rojas', carrera: 'Ingeniería Civil',          date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
  { id: 's5', name: 'Valeria Peña',    carrera: 'Economía',                  date: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString() },
  { id: 's6', name: 'Nicolás Vargas',  carrera: 'Ingeniería Electrónica',    date: new Date(Date.now() - 1000 * 60 * 60 * 45).toISOString() },
];
