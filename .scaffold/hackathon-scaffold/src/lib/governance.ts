// Role hierarchy and authorization engine
// This is the core of the hackathon demo: every agent action
// goes through authorization before executing.

export type Role = "operator" | "supervisor" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  operator: "Operator",
  supervisor: "Supervisor",
  admin: "Admin / Incident Commander",
};

// Tool authorization matrix
// Each tool maps to the minimum role required
const TOOL_AUTH: Record<string, Role> = {
  lookup_procedure: "operator",
  queue_notification: "supervisor",
  draft_procedure_update: "admin",
};

const ROLE_HIERARCHY: Record<Role, number> = {
  operator: 1,
  supervisor: 2,
  admin: 3,
};

export function isAuthorized(userRole: Role, toolName: string): boolean {
  const requiredRole = TOOL_AUTH[toolName];
  if (!requiredRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRequiredRole(toolName: string): Role | undefined {
  return TOOL_AUTH[toolName];
}

// Audit trail
export interface AuditEntry {
  id: string;
  timestamp: string;
  userRole: Role;
  toolName: string;
  authorized: boolean;
  requiredRole: Role | undefined;
  input: string;
  result: string;
}

let auditLog: AuditEntry[] = [];
let nextId = 1;

export function logAuditEntry(
  userRole: Role,
  toolName: string,
  authorized: boolean,
  input: string,
  result: string
): AuditEntry {
  const entry: AuditEntry = {
    id: `AUD-${String(nextId++).padStart(4, "0")}`,
    timestamp: new Date().toISOString(),
    userRole,
    toolName,
    authorized,
    requiredRole: getRequiredRole(toolName),
    input,
    result,
  };
  auditLog = [...auditLog, entry];
  return entry;
}

export function getAuditLog(): AuditEntry[] {
  return auditLog;
}

export function clearAuditLog(): void {
  auditLog = [];
  nextId = 1;
}
