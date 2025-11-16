export interface PushNotificationConfig {
  serviceWorkerPath?: string;
  apiKey?: string;
  environment?: "dev" | "prod";
  baseURL?: string;
}

export interface PushNotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  renotify?: boolean;
  timestamp?: number;
  vibrate?: number | number[];
  lang?: string;
  dir?: "auto" | "ltr" | "rtl";
  data?: any;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface SubscriptionData {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
    expiration_time: string | null;
    metadata: {
      userAgent: string;
      timestamp: string;
    };
  };
  device_id: string;
}

export interface SubscribeResponse {
  status_code: number;
  message: string;
  data: {
    endpoint: string;
    device_id: string;
  };
}

export interface UnsubscribeResponse {
  status_code: number;
  message: string;
  data: {
    device_ids: string[];
    removed_count: number;
    removed_subscriptions: any[];
  };
}
