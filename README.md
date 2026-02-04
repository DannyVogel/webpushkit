# webpushkit

A lightweight client library for Web Push Notifications. Simplifies service worker registration, permission handling, and subscription management.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Test App](#test-app)
5. [Configuration](#configuration)
6. [API Reference](#api-reference)
7. [Example Implementation](#example-implementation)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Backend Setup](#backend-setup)

## Overview

webpushkit handles the client-side complexity of Web Push Notifications:

- Service Worker registration and lifecycle management
- Browser permission requests
- Push subscription creation and management
- Device ID persistence
- Communication with your push notification backend

**Looking for a backend?** [BackStack](https://github.com/DannyVogel/backstack) is a companion backend template with built-in push notification support that works seamlessly with webpushkit.

## Prerequisites

1. **HTTPS**: Push notifications require a secure context (HTTPS or localhost)
2. **Service Worker Support**: Browser must support Service Workers
3. **Push API Support**: Browser must support the Push API
4. **Backend Server**: A server implementing the Web Push Protocol (see [Backend Setup](#backend-setup))

## Getting Started

### 1. Install the Package

```bash
npm install webpushkit
```

### 2. Initialize the Service Worker

```bash
npx webpushkit init
```

This copies `sw.js` to your `public` directory.

### 3. Configure and Use

```typescript
import { PushNotificationManager } from 'webpushkit';

const pushManager = new PushNotificationManager({
  vapidPublicKey: 'your-vapid-public-key',  // Required: from your backend
  baseURL: 'https://your-backend.com/pusher', // Required: your push server URL
  apiKey: 'your-api-key', // Optional: if your backend requires authentication
});

// Initialize (registers SW + requests permission)
const initialized = await pushManager.initialize();

if (initialized) {
  // Subscribe to push notifications
  const result = await pushManager.subscribe();
  console.log('Subscribed with device ID:', result.data.device_id);
}
```

## Test App

Want to try webpushkit before integrating it? The repository includes a test app with a browser-based UI for testing push notifications.

```bash
git clone https://github.com/DannyVogel/webpushkit.git
cd webpushkit
npm install
npm run dev
```

Then open `http://localhost:5173/test-app/` in your browser.

See [test-app/README.md](test-app/README.md) for detailed usage instructions.

## Configuration

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `vapidPublicKey` | string | Your VAPID public key from your backend server |
| `baseURL` | string | Base URL of your push notification server |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serviceWorkerPath` | string | `/sw.js` | Path to your service worker file |
| `apiKey` | string | - | API key for backend authentication |

### Example Configurations

```typescript
// Production
const pushManager = new PushNotificationManager({
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  baseURL: 'https://api.yourapp.com/pusher',
});

// Development
const pushManager = new PushNotificationManager({
  vapidPublicKey: 'your-dev-vapid-key',
  baseURL: 'http://localhost:3000/pusher',
});

// With API key authentication
const pushManager = new PushNotificationManager({
  vapidPublicKey: 'your-vapid-key',
  baseURL: 'https://api.yourapp.com/pusher',
  apiKey: 'your-api-key',
});
```

## API Reference

### PushNotificationManager

#### Constructor

```typescript
new PushNotificationManager(config: PushNotificationConfig)
```

#### Methods

##### `initialize(): Promise<boolean>`

Registers the service worker and requests notification permission.

```typescript
const success = await pushManager.initialize();
```

##### `isSupported(): boolean`

Checks if push notifications are supported in the current browser.

```typescript
if (pushManager.isSupported()) {
  // Proceed with setup
}
```

##### `subscribe(): Promise<SubscribeResponse>`

Subscribes to push notifications and registers with your backend.

```typescript
const result = await pushManager.subscribe();
// result.data.device_id - unique device identifier
// result.data.endpoint - push endpoint
```

##### `unsubscribe(deviceIds?: string[]): Promise<UnsubscribeResponse>`

Unsubscribes from push notifications. If no device IDs provided, unsubscribes current device.

```typescript
// Unsubscribe current device
await pushManager.unsubscribe();

// Unsubscribe specific devices
await pushManager.unsubscribe(['device-1', 'device-2']);
```

##### `isSubscribed(): Promise<boolean>`

Checks if currently subscribed to push notifications.

```typescript
const subscribed = await pushManager.isSubscribed();
```

##### `notify(deviceIds: string[], payload: PushNotificationPayload): Promise<NotifyResponse>`

Sends push notifications to devices. Returns detailed results including partial failures.

```typescript
const result = await pushManager.notify(['device-1', 'device-2'], {
  title: 'Hello!',
  body: 'You have a new message',
  icon: '/icon.png',
  data: { url: '/messages' }
});

// Handle results
console.log(`Sent: ${result.data.summary.successful}/${result.data.summary.total}`);

// Check individual results
result.data.results.forEach(r => {
  if (!r.success) {
    console.log(`Failed for ${r.device_id}: ${r.error}`);
  }
});
```

##### `getOrCreateDeviceId(): string`

Gets or creates a persistent device ID (stored in localStorage).

##### `generateUUID(): string`

Generates a UUID v4 string.

### Exported Utility Functions

```typescript
import { getOrCreateDeviceId, generateUUID } from 'webpushkit';

const deviceId = getOrCreateDeviceId();
const uuid = generateUUID();
```

### Types

```typescript
import type {
  PushNotificationConfig,
  PushNotificationPayload,
  NotificationAction,
  SubscriptionData,
  SubscribeResponse,
  UnsubscribeResponse,
  NotifyResult,
  NotifyResponse,
} from 'webpushkit';
```

#### PushNotificationPayload

```typescript
interface PushNotificationPayload {
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
  dir?: 'auto' | 'ltr' | 'rtl';
  data?: any;
  actions?: NotificationAction[];
}
```

#### NotifyResponse

```typescript
interface NotifyResponse {
  status_code: number;  // 200 = all success, 207 = partial success
  message: string;
  data: {
    results: Array<{
      device_id: string;
      success: boolean;
      error?: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}
```

## Example Implementation

```typescript
import { PushNotificationManager } from 'webpushkit';

class NotificationService {
  private pushManager: PushNotificationManager;

  constructor() {
    this.pushManager = new PushNotificationManager({
      vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      baseURL: import.meta.env.VITE_PUSH_SERVER_URL,
      apiKey: import.meta.env.VITE_PUSH_API_KEY,
    });
  }

  async setup(): Promise<boolean> {
    if (!this.pushManager.isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    const initialized = await this.pushManager.initialize();
    if (!initialized) {
      console.warn('Failed to initialize push notifications');
      return false;
    }

    const isSubscribed = await this.pushManager.isSubscribed();
    if (!isSubscribed) {
      await this.pushManager.subscribe();
    }

    return true;
  }

  async unsubscribe(): Promise<void> {
    await this.pushManager.unsubscribe();
  }

  getDeviceId(): string {
    return this.pushManager.getOrCreateDeviceId();
  }
}

export const notificationService = new NotificationService();
```

## Error Handling

```typescript
try {
  await pushManager.subscribe();
} catch (error) {
  if (error.message.includes('vapidPublicKey is required')) {
    console.error('Missing VAPID key configuration');
  } else if (error.message.includes('baseURL is required')) {
    console.error('Missing server URL configuration');
  } else if (error.message.includes('403')) {
    console.error('Access denied - check API key or CORS configuration');
  } else if (error.message.includes('400')) {
    console.error('Invalid subscription data');
  } else {
    console.error('Subscription failed:', error);
  }
}
```

## Best Practices

1. **Request Permission Thoughtfully**: Don't request on page load. Wait for user interaction.
2. **Handle All States**: Check `Notification.permission` before requesting.
3. **Provide Feedback**: Show users their subscription status and allow easy unsubscribe.
4. **Test on HTTPS**: Push requires HTTPS (localhost is exempt for development).
5. **Handle Failures Gracefully**: The `notify()` method returns partial failure info - use it.

## Backend Setup

webpushkit expects a backend with three endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `{baseURL}/subscribe` | POST | Register device subscription |
| `{baseURL}/unsubscribe` | POST | Remove device subscription(s) |
| `{baseURL}/notify` | POST | Send notifications to devices |

### Recommended: BackStack

[BackStack](https://github.com/DannyVogel/backstack) is a production-ready backend template that implements all required endpoints with additional features:

- Automatic cleanup of expired/invalid subscriptions
- Parallel notification delivery
- Structured logging
- Rate limiting
- SQLite storage

```bash
git clone https://github.com/DannyVogel/backstack.git
cd backstack
npm install
cp .env.example .env
# Generate VAPID keys: npx web-push generate-vapid-keys
# Add keys to .env
npm run dev
```

Then configure webpushkit:

```typescript
const pushManager = new PushNotificationManager({
  vapidPublicKey: 'your-vapid-public-key-from-env',
  baseURL: 'http://localhost:3000/pusher', // or your deployed BackStack URL
});
```

### Custom Backend

If building your own backend, implement these endpoints:

#### POST `/subscribe`

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-key"
    },
    "expiration_time": "2024-12-31T23:59:59.000Z",
    "metadata": { "userAgent": "...", "timestamp": "..." }
  },
  "device_id": "unique-device-id"
}
```

**Response (201):**
```json
{
  "status_code": 201,
  "message": "Subscribed successfully",
  "data": {
    "endpoint": "...",
    "device_id": "unique-device-id"
  }
}
```

#### POST `/unsubscribe`

**Request:**
```json
{
  "device_ids": ["device-id-1", "device-id-2"]
}
```

**Response (200):**
```json
{
  "status_code": 200,
  "message": "Successfully unsubscribed 2 devices",
  "data": {
    "device_ids": ["device-id-1", "device-id-2"],
    "removed_count": 2
  }
}
```

#### POST `/notify`

**Request:**
```json
{
  "device_ids": ["device-id-1", "device-id-2"],
  "payload": {
    "title": "Notification Title",
    "body": "Notification body",
    "icon": "/icon.png",
    "data": { "url": "/path" }
  }
}
```

**Response (200 or 207):**
```json
{
  "status_code": 207,
  "message": "1 notifications sent, 1 failed",
  "data": {
    "results": [
      { "device_id": "device-id-1", "success": true },
      { "device_id": "device-id-2", "success": false, "error": "Subscription expired" }
    ],
    "summary": { "total": 2, "successful": 1, "failed": 1 }
  }
}
```

## PWA and Netlify Considerations

When using with PWA plugins (e.g., `vite-plugin-pwa`) and Netlify:

1. **Use `injectManifest` strategy** to preserve push notification code in your service worker
2. **Add Netlify redirect** in `public/_redirects`:
   ```
   /sw.js  /sw.js  200
   ```

## Additional Resources

- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/Push_API)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/Service_Worker_API)
- [BackStack - Companion Backend](https://github.com/DannyVogel/backstack)
