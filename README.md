# webpushkit
# Client Setup Guide for Push Notifications

This guide explains how to integrate push notifications into your web application using the Push Notification Service.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [API Reference](#api-reference)
6. [Example Implementation](#example-implementation)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Overview

The Push Notification Service uses the Web Push Protocol (W3C Push API) to send notifications to users' browsers. The service requires:

- A **Service Worker** to handle incoming push notifications
- A unique **device_id** to identify each subscription

**Note:** VAPID keys and service endpoints are pre-configured in this package.

## Prerequisites

1. **HTTPS**: Push notifications require a secure context (HTTPS or localhost)
2. **Service Worker Support**: The browser must support Service Workers
3. **Push API Support**: The browser must support the Push API
4. **Whitelisted Origin**: Your origin must be whitelisted on the push notification service (if required)

## Getting Started

### 1. Install the Package

```bash
npm install webpushkit
```

### 2. Initialize the Service Worker

After installation, run the setup command to initialize the service worker:

```bash
npx webpushkit init
```

This will copy the service worker file (`sw.js`) to your project's `public` directory by default.

### 3. Configure API Key (Optional)

The package comes pre-configured with the push notification service. If your app is **whitelisted**, no API key is needed. If your app requires an API key, provide it in the config:

```javascript
const pushManager = new PushNotificationManager({
  apiKey: 'your-api-key-here' // optional, only needed if your app is not whitelisted
});
```

### 4. Check Browser Support (Optional)

The `PushNotificationManager` automatically checks browser support when you call `initialize()`. However, if you want to check support before initializing, you can use the `isSupported()` method:

```javascript
const pushManager = new PushNotificationManager();

if (pushManager.isSupported()) {
  // Push notifications are supported
  await pushManager.initialize();
} else {
  // Push notifications are not supported
  console.warn('Push notifications are not supported in this browser');
}
```

Note: The `initialize()` method will automatically return `false` if push notifications are not supported, so this check is optional.

## Step-by-Step Setup

### Step 1: Register a Service Worker

The service worker file (`sw.js`) is automatically copied to your `public` directory when you run `npx webpushkit init`. The service worker handles incoming push notifications and notification clicks.

### Step 2: Request Notification Permission

Request permission from the user to show notifications:

```javascript
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission === 'denied') {
    console.warn('Notification permission has been denied');
    return false;
  }
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
```

### Step 3: Subscribe to Push Notifications

Subscribe to push notifications using the PushNotificationManager:

```javascript
import { PushNotificationManager } from 'webpushkit';

// For whitelisted apps (no API key needed)
const pushManager = new PushNotificationManager();

// For apps that need an API key
// const pushManager = new PushNotificationManager({
//   apiKey: 'your-api-key-here'
// });

// Initialize and subscribe
await pushManager.initialize();
await pushManager.subscribe();
```

### Step 4: Generate a Unique Device ID

The `PushNotificationManager` automatically generates and stores a unique device ID in localStorage. You don't need to handle this manually.

### Step 5: Unsubscribe from Push Notifications

To unsubscribe, call the unsubscribe method:

```javascript
await pushManager.unsubscribe();
```

## API Reference

### PushNotificationManager

The main class for managing push notifications.

#### Constructor

```typescript
new PushNotificationManager(config?: PushNotificationConfig)
```

**Config Options:**

- `serviceWorkerPath` (string, optional): Path to service worker file (defaults to `/sw.js`)
- `apiKey` (string, optional): API key for authentication. Only required if your app is not whitelisted.

**Note:** VAPID public key and base URL are pre-configured. API key is optional - whitelisted apps don't need it.

#### Methods

##### `initialize(): Promise<boolean>`

Registers the service worker and requests notification permission. Returns `true` if successful, `false` otherwise.

##### `isSupported(): boolean`

Checks if push notifications are supported in the current browser.

##### `registerServiceWorker(): Promise<ServiceWorkerRegistration>`

Registers the service worker. Called automatically by `initialize()`.

##### `requestPermission(): Promise<boolean>`

Requests notification permission from the user. Returns `true` if granted, `false` otherwise.

##### `subscribe(): Promise<SubscribeResponse>`

Subscribes to push notifications and sends the subscription to the server.

**Returns:**

```typescript
{
  status_code: number;
  message: string;
  data: {
    endpoint: string;
    device_id: string;
  };
}
```

##### `unsubscribe(deviceIds?: string[]): Promise<UnsubscribeResponse>`

Unsubscribes from push notifications. If no device IDs are provided, unsubscribes the current device.

**Returns:**

```typescript
{
  status_code: number;
  message: string;
  data: {
    device_ids: string[];
    removed_count: number;
    removed_subscriptions: any[];
  };
}
```

##### `isSubscribed(): Promise<boolean>`

Checks if currently subscribed to push notifications.

##### `notify(deviceIds: string[], payload: PushNotificationPayload): Promise<{success: boolean; error?: string}>`

Sends push notifications to one or more devices. Typically called from your backend, but provided for convenience.

### Subscribe Endpoint

**POST** `/pushservice/api/subscribe`

Subscribe a device to push notifications.

**Headers:**

- `Content-Type: application/json`
- `X-API-Key: <your-api-key>` (optional, only if app is not whitelisted)

**Request Body:**

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-key"
    },
    "expiration_time": "2024-12-31T23:59:59.000Z",
    "metadata": {
      "userAgent": "...",
      "timestamp": "..."
    }
  },
  "device_id": "unique-device-id"
}
```

**Response:**

```json
{
  "status_code": 201,
  "message": "Subscribed successfully",
  "data": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "device_id": "unique-device-id"
  }
}
```

### Unsubscribe Endpoint

**POST** `/pushservice/api/unsubscribe`

Unsubscribe one or more devices from push notifications.

**Headers:**

- `Content-Type: application/json`
- `X-API-Key: <your-api-key>` (optional, only if app is not whitelisted)

**Request Body:**

```json
{
  "device_ids": ["device-id-1", "device-id-2"]
}
```

**Response:**

```json
{
  "status_code": 200,
  "message": "Successfully unsubscribed 2 devices",
  "data": {
    "device_ids": ["device-id-1", "device-id-2"],
    "removed_count": 2,
    "removed_subscriptions": [...]
  }
}
```

### Notify Endpoint

**POST** `/pushservice/api/notify`

Send push notifications to one or more devices (typically called from your backend).

**Headers:**

- `Content-Type: application/json`
- `X-API-Key: <your-api-key>` (optional, only if app is not whitelisted)

**Request Body:**

```json
{
  "device_ids": ["device-id-1", "device-id-2"],
  "payload": {
    "title": "Notification Title",
    "body": "Notification body text",
    "icon": "/icon-192x192.png",
    "badge": "/badge-72x72.png",
    "image": "/large-image.png",
    "tag": "notification-tag",
    "requireInteraction": false,
    "silent": false,
    "renotify": false,
    "timestamp": 1234567890,
    "vibrate": [200, 100, 200],
    "lang": "en",
    "dir": "auto",
    "data": {
      "url": "/path/to/open",
      "spaceId": "space-123"
    },
    "actions": [
      {
        "action": "view",
        "title": "View",
        "icon": "/view-icon.png"
      }
    ]
  }
}
```

## Example Implementation

Here's a complete example of integrating push notifications:

```javascript
import { PushNotificationManager } from 'webpushkit';

const pushManager = new PushNotificationManager();

// Initialize and subscribe
pushManager.initialize()
  .then(async (initialized) => {
    if (initialized) {
      const isSubscribed = await pushManager.isSubscribed();
      if (!isSubscribed) {
        await pushManager.subscribe();
      }
    }
  })
  .catch(error => {
    console.error('Failed to initialize push notifications:', error);
  });

// Export for use in other modules
export default pushManager;
```

## Error Handling

### Common Errors

1. **403 Forbidden**: Origin not allowed
   - Solution: Ensure your origin is whitelisted on the push notification service

2. **400 Bad Request**: Invalid subscription data
   - Solution: Ensure subscription object contains valid `endpoint` and `keys`

3. **404 Not Found**: Device ID not found (for unsubscribe)
   - Solution: Verify the device ID exists

4. **500 Internal Server Error**: Server-side error
   - Solution: Check server logs and contact support

### Handling Subscription Errors

```javascript
try {
  await pushManager.subscribe();
} catch (error) {
  if (error.message.includes('403')) {
    console.error('Access denied. Check if your origin is whitelisted.');
  } else if (error.message.includes('400')) {
    console.error('Invalid subscription data.');
  } else {
    console.error('Subscription failed:', error);
  }
}
```

## Best Practices

1. **Request Permission at the Right Time**: Don't request notification permission immediately on page load. Wait for user interaction or a meaningful moment.

2. **Handle Permission States**: Check `Notification.permission` before requesting permission.

3. **Persist Device ID**: The library automatically stores the device ID in localStorage to maintain consistency across sessions.

4. **Handle Service Worker Updates**: Listen for service worker updates and handle them appropriately.

5. **Test on HTTPS**: Always test push notifications over HTTPS (or localhost for development).

6. **Handle Subscription Expiration**: Monitor subscription expiration and re-subscribe when needed.

7. **Error Recovery**: Implement retry logic for failed subscription attempts.

8. **User Experience**: Provide clear UI feedback about subscription status and allow users to easily unsubscribe.

9. **Privacy**: Only request push notification permission when it adds value to the user experience.

10. **Cross-Browser Testing**: Test your implementation across different browsers as push notification support varies.

## Troubleshooting

### Service Worker Not Registering

- Ensure the service worker file is accessible at the root path
- Check browser console for errors
- Verify HTTPS is enabled (or using localhost)

### Subscription Fails

- Ensure request body matches expected format
- Check network tab for detailed error messages
- Verify your origin is whitelisted on the push notification service

### Notifications Not Appearing

- Verify service worker is active
- Check browser notification settings
- Ensure notification permission is granted
- Verify payload format matches expected structure

### Subscription Expired

- Monitor `expirationTime` in subscription object
- Re-subscribe before expiration
- Handle expiration gracefully in your UI

## Additional Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
