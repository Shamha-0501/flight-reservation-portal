import {
  AuthorizationError,
  type AuthResult,
  type PolicyAction,
  type ActionNeedsResource,
  type ActionNoResource,
  AuthActor,
} from "./types";
import { BasePolicy } from "./basePolicy";

type PolicyCtor = new () => BasePolicy<any, any>;

export class Gate {
  private static policies = new Map<string, PolicyCtor>();

  static policy(resourceName: string, policy: PolicyCtor) {
    this.policies.set(resourceName, policy);
  }

  static allow(): AuthResult {
    return { ok: true };
  }

  static deny(message?: string): AuthResult {
    return { ok: false, message: message ?? "This action is unauthorized." };
  }

  // ---- Overloads for type-safety ----
  static authorize(
    user: AuthActor,
    action: ActionNoResource,
    resourceName: string
  ): Promise<void>;
  static authorize(
    user: AuthActor,
    action: ActionNeedsResource,
    resource: any
  ): Promise<void>;
  
  static authorize(user: AuthActor, action: PolicyAction, resourceOrName: any): Promise<void> {
    const resourceName = this.resolveResourceName(resourceOrName);
    const PolicyClass = this.policies.get(resourceName);

    if (!PolicyClass) {
      throw new AuthorizationError(`No policy registered for ${resourceName}`);
    }

    const policy = new PolicyClass();
    const handler = (policy as any)[action];

    if (typeof handler !== "function") {
      throw new AuthorizationError(
        `Policy ${PolicyClass.name} does not implement ${action}().`
      );
    }

    // IMPORTANT:
    // Your BasePolicy requires (user, resource) for ALL actions,
    // so we must always call handler(user, something).
    // For "viewAny/create", you pass resourceName string.
    // For "view/update/...", you pass actual resource object.
    return Promise.resolve(handler.call(policy, user, resourceOrName)).then(
      (result: AuthResult) => {
        if (!result?.ok) {
          throw new AuthorizationError(result?.message || "This action is unauthorized.");
        }
      }
    );
  }

  static async can(
    user: AuthActor,
    action: ActionNoResource,
    resourceName: string
  ): Promise<boolean>;
  
  static async can(
    user: AuthActor,
    action: ActionNeedsResource,
    resource: any
  ): Promise<boolean>;
  static async can(user: AuthActor, action: PolicyAction, resourceOrName: any) {
    try {
      await this.authorize(user, action as any, resourceOrName as any);
      return true;
    } catch {
      return false;
    }
  }

  private static resolveResourceName(resourceOrName: any): string {
    if (typeof resourceOrName === "string") return resourceOrName;
    if (resourceOrName && resourceOrName.constructor?.name) return resourceOrName.constructor.name;
    return "Unknown";
  }
}
