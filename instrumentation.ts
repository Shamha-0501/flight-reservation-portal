export async function register() {
  // Next sets this when running Node runtime code
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const mod = await import("./forge/runtime/register.node");
    await mod.registerNode();
  }
}
