import type { UserRole } from '@/lib/api';

export const NAV_ITEMS: Array<{ href: string; label: string; roles: UserRole[] }> = [
  { href: '/dashboard', label: 'Dashboard', roles: ['admin', 'warden', 'student'] },
  { href: '/gate-pass', label: 'Gate Pass', roles: ['admin', 'warden', 'student'] },
  { href: '/complaints', label: 'Complaints', roles: ['admin', 'warden', 'student'] },
  { href: '/rooms', label: 'Rooms', roles: ['admin', 'warden', 'student'] },
  { href: '/visitors', label: 'Visitors', roles: ['admin', 'warden', 'student'] },
  { href: '/notifications', label: 'Notifications', roles: ['admin', 'warden', 'student'] },
  { href: '/mess', label: 'Mess Feedback', roles: ['admin', 'warden', 'student'] },
];

export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'warden', 'student'],
  '/gate-pass': ['admin', 'warden', 'student'],
  '/complaints': ['admin', 'warden', 'student'],
  '/rooms': ['admin', 'warden', 'student'],
  '/visitors': ['admin', 'warden', 'student'],
  '/notifications': ['admin', 'warden', 'student'],
  '/mess': ['admin', 'warden', 'student'],
};

export function canCreateRoom(role: UserRole | ''): boolean {
  return role === 'admin';
}

export function canAllocateRoom(role: UserRole | ''): boolean {
  return role === 'admin';
}

export function canManageRoom(role: UserRole | ''): boolean {
  return role === 'admin';
}

export function canViewAllRooms(role: UserRole | ''): boolean {
  return role === 'admin' || role === 'warden';
}

export function canViewAssignedStudents(role: UserRole | ''): boolean {
  return role === 'admin' || role === 'warden';
}

export function isRouteAllowed(pathname: string, role: UserRole | ''): boolean {
  const matched = Object.entries(ROUTE_ACCESS).find(([route]) => pathname.startsWith(route));
  if (!matched) return true;
  return matched[1].includes(role as UserRole);
}
