"use client";

import type { Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/governance";

const ROLE_COLORS: Record<Role, string> = {
  nurse: "bg-blue-600 text-white",
  doctor: "bg-amber-500 text-white",
  attending: "bg-purple-600 text-white",
};

export function RoleSwitcher({
  currentRole,
  onRoleChange,
}: {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}) {
  const roles: Role[] = ["nurse", "doctor", "attending"];
  return (
    <div className="flex items-center gap-1.5">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => onRoleChange(role)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            currentRole === role
              ? ROLE_COLORS[role]
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}
