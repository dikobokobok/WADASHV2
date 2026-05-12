export async function register() {
    const { assertRequiredProductionEnv } = await import("./lib/env-require");
    assertRequiredProductionEnv();
}
