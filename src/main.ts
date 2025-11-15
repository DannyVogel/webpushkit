import { getOrCreateDeviceId, generateUUID as generateUUIDHelper } from "./deviceId";
import type {
  PushNotificationConfig,
  PushNotificationPayload,
  SubscriptionData,
  SubscribeResponse,
  UnsubscribeResponse,
} from "./types";

export class PushNotificationManager {
  private vapidPublicKey =
    "BGJZlj6wOKENtIi6pd1jLR_WWBSaOHL6N3Mk0hDbd8P3WXPEi7UHH16bkMsddxAMR1TQmovggzU82rpSkzxBsIc";
  private baseURL = "https://the-monolith.onrender.com/pushservice";
  private subscribeEndpoint = `${this.baseURL}/api/subscribe`;
  private notifyEndpoint = `${this.baseURL}/api/notify`;
  private unsubscribeEndpoint = `${this.baseURL}/api/unsubscribe`;
  private serviceWorkerPath: string;
  private apiKey?: string;
  private deviceId: string;

  constructor(config?: PushNotificationConfig) {
    this.serviceWorkerPath = config?.serviceWorkerPath || "/sw.js";
    this.apiKey = config?.apiKey;
    this.deviceId = getOrCreateDeviceId();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }
    return headers;
  }

  /**
   * Initialize push notifications by registering service worker and requesting permission
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("Push notifications are not supported");
      return false;
    }

    // Register service worker
    await this.registerServiceWorker();

    // Request permission
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return false;
    }

    return true;
  }

  /**
   * Check if push notifications are supported in the current browser
   */
  isSupported(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window;
  }

  /**
   * Register the service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    try {
      const registration = await navigator.serviceWorker.register(
        this.serviceWorkerPath
      );
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      console.warn("Notification permission has been denied");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  /**
   * Get or create a unique device ID
   */
  getOrCreateDeviceId(): string {
    return getOrCreateDeviceId();
  }

  /**
   * Generate a UUID
   */
  generateUUID(): string {
    return generateUUIDHelper();
  }

  /**
   * Convert base64 URL string to Uint8Array
   */
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<SubscribeResponse> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = this.urlBase64ToUint8Array(
        this.vapidPublicKey
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      const subscriptionJson = subscription.toJSON();

      if (!subscriptionJson.keys) {
        throw new Error("Subscription keys are missing");
      }

      const subscriptionData: SubscriptionData = {
        subscription: {
          endpoint: subscriptionJson.endpoint!,
          keys: {
            p256dh: subscriptionJson.keys.p256dh!,
            auth: subscriptionJson.keys.auth!,
          },
          expiration_time: subscriptionJson.expirationTime
            ? new Date(subscriptionJson.expirationTime).toISOString()
            : null,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        },
        device_id: this.deviceId,
      };

      const response = await fetch(this.subscribeEndpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error(`Subscription failed: ${response.statusText}`);
      }

      const result: SubscribeResponse = await response.json();
      console.log("Successfully subscribed:", result);
      return result;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(deviceIds?: string[]): Promise<UnsubscribeResponse> {
    try {
      const idsToUnsubscribe = deviceIds || [this.deviceId];

      const response = await fetch(this.unsubscribeEndpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          device_ids: idsToUnsubscribe,
        }),
      });

      if (!response.ok) {
        throw new Error(`Unsubscribe failed: ${response.statusText}`);
      }

      const result: UnsubscribeResponse = await response.json();
      console.log("Successfully unsubscribed:", result);

      // Also unsubscribe from the browser's PushManager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove device ID from localStorage if unsubscribing current device
      if (!deviceIds || deviceIds.includes(this.deviceId)) {
        localStorage.removeItem("push_device_id");
      }

      return result;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  /**
   * Check if currently subscribed to push notifications
   */
  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }

  /**
   * Send push notifications to one or more devices (typically called from backend)
   * This method is provided for convenience but should usually be called from your backend
   */
  async notify(
    deviceIds: string[],
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (deviceIds.length === 0) {
        throw new Error("No device IDs provided");
      }

      const response = await fetch(this.notifyEndpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          device_ids: deviceIds,
          payload: payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Notification failed: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
