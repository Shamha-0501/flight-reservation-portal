import { AuthActor } from "@/forge/core/auth/types";
import { Model } from "@/forge/database/model";
import { UserRole } from "./UserRole";
import { Policy } from "./Policy";
import { PolicySubject } from "./PolicySubject";
import { Resource } from "./Resource";
import { Action } from "./Action";

export interface UserAttr {
  id: number;
  email: string;
  password: string;
  role: string;
  remember_token: string | null | undefined;
  verified: boolean;
  subscribe_news_letter: boolean;
  tenant_id: number;
}

type PermissionEffect = "allow" | "deny";

interface ResolvedPermission {
  effect: PermissionEffect;
  priority: number;
  condition: string | null;
  resource_key: string;
  action_key: string;
}

type PermissionMap = Record<string, ResolvedPermission>;

export class User extends Model<UserAttr> implements UserAttr, AuthActor {
  declare id: number;
  declare email: string;
  declare password: string;
  declare role: string;
  declare remember_token: string;
  declare verified: boolean;
  declare subscribe_news_letter: boolean;
  declare tenant_id: number;

  protected static table = "users";
  protected static fillable = [
    "id",
    "email",
    "password",
    "role",
    "remember_token",
    "verified",
    "subscribe_news_letter",
    "tenant_id",
  ];
  protected static hidden = ['password', 'remember_token', 'verified', 'subscribe_news_letter'];

  /* ---------------- Relations / helpers ---------------- */

  // Pivot user_roles (not strictly needed for PBAC, but kept if you want it)
  async getUserRoles(): Promise<any[]> {
    const rows = await (UserRole as any)
      .query()
      .where("user_id = ?", [this.id])
      .get();

    return rows;
  }

  /* -------- PBAC core: subjects, policies, permissions -------- */

  /**
   * All "subjects" that represent this user in PBAC.
   * Using:
   *   - user:id
   *   - role:user.role (from users table)
   */
  async getSubjects(): Promise<Array<{ type: string; value: string }>> {
    return [
      { type: "user", value: String(this.id) },
      { type: "role", value: this.role }, // e.g. "admin", "user", "service_man"
    ];
  }

  /**
   * Fetch policies that apply to this user by matching policy_subjects,
   * then attach resource_key + action_key from their tables.
   */
  async getPolicies(): Promise<Array<any>> {
    const subjects = await this.getSubjects();

    // 1) all PolicySubject rows for our subjects
    const allPolicySubjects: any[] = [];

    for (const s of subjects) {
      const rows = await (PolicySubject as any)
        .query()
        .where("subject_type = ? AND subject_value = ?", [s.type, s.value])
        .get();

      allPolicySubjects.push(...rows);
    }

    const policyIds = Array.from(
      new Set(allPolicySubjects.map((ps: any) => ps.policy_id))
    );
    if (!policyIds.length) return [];

    // 2) load all policies / resources / actions (simple queries)
    const allPolicies: any[] = await (Policy as any).query().get();
    const allResources: any[] = await (Resource as any).query().get();
    const allActions: any[] = await (Action as any).query().get();

    const resourceById = new Map(allResources.map((r: any) => [r.id, r]));
    const actionById = new Map(allActions.map((a: any) => [a.id, a]));

    const result: any[] = [];

    for (const p of allPolicies) {
      if (!policyIds.includes(p.id)) continue;

      const res = resourceById.get(p.resource_id);
      const act = actionById.get(p.action_id);
      if (!res || !act) continue;

      result.push({
        ...p,
        resource_key: res.key,
        action_key: act.key,
      });
    }

    return result;
  }

  /**
   * Build a permission map with priority / effect.
   * Key: `${resource_key}:${action_key}`
   */
  async resolvePermissions(): Promise<PermissionMap> {
    const policies: any[] = await this.getPolicies();
    const map: PermissionMap = {};

    for (const p of policies) {
      if (!p.enabled) continue;

      const key = `${p.resource_key}:${p.action_key}`;
      const existing = map[key];

      if (!existing || p.priority > existing.priority) {
        map[key] = {
          effect: p.effect as PermissionEffect,
          priority: p.priority,
          condition: p.condition ?? null,
          resource_key: p.resource_key,
          action_key: p.action_key,
        };
      }
    }

    return map;
  }

  /* ---------------- Public API ---------------- */

  async hasPermission(
    resource: string,
    action: string,
    ctx: any = {}
  ): Promise<boolean> {
    return this.can(resource, action, ctx);
  }

  async can(
    resource: string,
    action: string,
    ctx: any = {}
  ): Promise<boolean> {
    const perms = await this.resolvePermissions();
    const key = `${resource}:${action}`;

    const perm = perms[key];
    if (!perm) return false;
    if (perm.effect === "deny") return false;

    if (perm.condition) {
      return evaluateCondition(perm.condition, { user: this, ...ctx });
    }

    return true;
  }

  async authorize(
    resource: string,
    action: string,
    ctx: any = {}
  ): Promise<void> {
    const ok = await this.can(resource, action, ctx);
    if (!ok) {
      throw new Error("Forbidden");
    }
  }

  owns(model: { user_id?: number | null }): boolean {
    return !!model && model.user_id === this.id;
  }
}

/* ---- Dumb condition evaluator for now ---- */
function evaluateCondition(
  condition: string | null | undefined,
  ctx: any
): boolean {
  if (!condition) return true;
  // TODO: parse JSON / DSL later
  return true;
}
