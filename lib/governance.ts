import type { Role, GovernedAction } from './types';

export const ROLE_LABELS: Record<Role, string> = {
  nurse: 'Nurse',
  doctor: 'Doctor',
  attending: 'Attending',
};

export const ACTION_PERMISSIONS: Record<GovernedAction, Role[]> = {
  render_protocol: ['nurse', 'doctor', 'attending'],
  order_antibiotics: ['doctor', 'attending'],
  order_tpa: ['attending'],
  activate_mtp: ['doctor', 'attending'],
  escalate_to_doctor: ['nurse', 'doctor', 'attending'],
};

export function isAuthorized(role: Role, action: GovernedAction): boolean {
  return ACTION_PERMISSIONS[action].includes(role);
}

export type AuditEntry = {
  id: string;
  timestamp: number;
  role: Role;
  action: GovernedAction;
  outcome: 'AUTHORIZED' | 'BLOCKED' | 'ROUTED';
  detail: string;
};

let auditLog: AuditEntry[] = [];

export function logAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const fullEntry: AuditEntry = {
    ...entry,
    id: `AUD-${String(auditLog.length + 1).padStart(4, '0')}`,
    timestamp: Date.now(),
  };
  auditLog = [...auditLog, fullEntry];
  return fullEntry;
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog];
}

export function clearAuditLog(): void {
  auditLog = [];
}
