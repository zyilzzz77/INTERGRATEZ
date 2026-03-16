/**
 * Capacitor platform detection utilities.
 * Use these to conditionally change behavior between web and native app.
 */

/**
 * Returns true if the app is running inside a Capacitor native shell.
 */
export function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).Capacitor;
}

/**
 * Returns true if running as an Android Capacitor app.
 */
export function isAndroid(): boolean {
  if (!isCapacitor()) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Capacitor?.getPlatform?.() === "android";
}

/**
 * Returns "android" | "ios" | "web"
 */
export function getPlatform(): "android" | "ios" | "web" {
  if (!isCapacitor()) return "web";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platform = (window as any).Capacitor?.getPlatform?.();
  return platform || "web";
}
