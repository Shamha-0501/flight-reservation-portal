export type AuthResult = { ok: true } | { ok: false; message?: string };

export class AuthorizationError extends Error {
  status = 403;
  code = "FORBIDDEN";

  constructor(message = "This action is unauthorized.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export type ActionNeedsResource =
  | "view"
  | "update"
  | "delete"
  | "forceDelete"
  | "restore";

export type ActionNoResource = "viewAny" | "create";

export type PolicyAction = ActionNeedsResource | ActionNoResource;

/**
 * Actor must be a model instance (has constructor) + must expose auth fields.
 * You can extend this later (permissions, teams, etc.).
 */
export interface AuthActor {
  id: number;
  tenant_id: number;
  role?: string;

  // optional but useful for PBAC subjects later:
  // getRoleKey?(): string | null;
}