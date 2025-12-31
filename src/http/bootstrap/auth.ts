import { Gate } from "@/forge/core/auth/gate";
import { UserPolicy } from "@/src/http/policies/UserPolicy";

let booted = false;

export function bootAuth() {
  if (booted) return;
  booted = true;

  Gate.policy("User", UserPolicy);
}
