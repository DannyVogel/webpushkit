/**
 * Generates or retrieves a persistent device ID using localStorage
 * @returns A UUID string representing the device ID
 */
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem("push_device_id");

    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem("push_device_id", deviceId);
    }

    return deviceId;
  } catch (error) {
    console.warn(
      "Failed to get/set deviceId from localStorage, using session-only UUID:",
      error
    );
    return generateUUID();
  }
}

/**
 * Generates a UUID v4 string
 * Uses crypto.randomUUID() if available, otherwise falls back to a polyfill
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c: string) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
}
