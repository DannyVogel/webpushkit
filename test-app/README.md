# WebPushKit Test App

A browser-based testing UI for the WebPushKit library. Use this to test push notification subscription, delivery, and management.

## Prerequisites

1. **Node.js** (v16+)
2. **A running backend** with the push notification endpoints (default: `http://localhost:8000/pusher`)
3. **VAPID keys** - You'll need your VAPID public key to configure the test app

## Running the Test App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173/test-app/` (or the URL shown in the terminal)

## Usage

### 1. Configure

- **VAPID Public Key**: Paste your VAPID public key (the same one your backend uses)
- **Backend URL**: The URL to your push notification backend (e.g., `http://localhost:8000/pusher`)
- **API Key**: Optional - only needed if your backend requires authentication

### 2. Initialize

Click **Initialize** to:
- Register the service worker
- Request notification permission from the browser
- Set up the push manager

### 3. Subscribe

Click **Subscribe** to:
- Create a push subscription with the browser
- Register the subscription with your backend
- The device ID will be displayed in the status section

### 4. Test Notifications

Once subscribed, use the **Send Test Notification** section to:
- Enter a custom title and body
- Click **Send Notification** to trigger a push notification via your backend

### 5. Unsubscribe

Click **Unsubscribe** to remove the push subscription from both the browser and backend.

## Status Indicators

- **Push Support**: Shows if your browser supports push notifications
- **Subscription**: Shows current subscription state (Subscribed/Not Subscribed)
- **Device ID**: Unique identifier for this browser/device

## Log

The log panel shows all actions and their results. Useful for debugging issues with:
- Service worker registration
- Permission requests
- Subscription/unsubscription
- Notification delivery

## Notes

- Push notifications require HTTPS in production (localhost is exempt for development)
- Make sure your backend is running before testing
- Browser notification permissions must be granted for push to work
