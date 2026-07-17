export const ADMIN_EMAILS = ['karol.estupinan-v@mail.escuelaing.edu.co'];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function isAdmin(roles: string[]): boolean {
  return roles.some(r => r.toUpperCase() === 'ADMIN');
}
