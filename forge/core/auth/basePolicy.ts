import type { AuthActor, AuthResult } from "./types";

export abstract class BasePolicy<TUser extends AuthActor = AuthActor, TResource = any> {
  view(user: TUser, resource: TResource): AuthResult {
    return { ok: false, message: "Not allowed." };
  }

  viewAny(user: TUser, resource: TResource): AuthResult {
    return { ok: false, message: "Not allowed." };
  }

  create(user: TUser, resource: TResource): AuthResult {
    return { ok: false, message: "Not allowed." };
  }

  update(user: TUser, resource: TResource): AuthResult {
    return { ok: false, message: "Not allowed." };
  }

  delete(user: TUser, resource: TResource): AuthResult {
    return { ok: false, message: "Not allowed." };
  }

  forceDelete(user: TUser, resource: TResource): AuthResult {
    return { ok: false, message: "Not allowed." };
  }

  restore(user: TUser, resource: TResource): AuthResult {
    return { ok: false, message: "Not allowed." };
  }
}
