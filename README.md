# xolar — Global IPA Library

A full English IPA library website built for **GitHub + Vercel + Firebase Realtime Database**.

Use it only for IPA files you own, created, or have permission to distribute.

## 1) Firebase setup

1. Go to Firebase Console.
2. Create a free Spark project.
3. Create **Realtime Database**.
4. Start in locked mode.
5. Go to Project Settings > Service accounts > Generate new private key.
6. Copy values into Vercel environment variables.

Recommended Realtime Database rules:

```json
{
  "rules": {
    ".read": true,
    ".write": false,
    "ipas": {
      ".indexOn": ["type", "updatedAt", "createdAt", "nameLower", "bundleId"]
    },
    "views": {
      ".indexOn": ["updatedAt"]
    }
  }
}
```

Writes happen only through the Vercel API using Firebase Admin.

## 2) Vercel environment variables

Add these in Vercel:

```txt
FIREBASE_DATABASE_URL
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
XOLAR_ADMIN_API_KEY
VITE_LOGO_URL
VITE_SITE_NAME
```

For `FIREBASE_PRIVATE_KEY`, paste the full private key. If Vercel stores `\n` as text, the code already converts it.

## 3) Deploy

```bash
npm install
npm run build
```

Push to GitHub, then import the GitHub repo in Vercel.

## 4) API

Every write request needs this header:

```txt
x-api-key: YOUR_XOLAR_ADMIN_API_KEY
```

### Create post

```bash
curl -X POST "https://YOUR-SITE.vercel.app/api/posts" \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY" \
  -d '{
    "name": "Example App",
    "type": "app",
    "bundleId": "com.example.app",
    "ipaVersion": "1.0.0",
    "appStoreVersion": "",
    "size": "168.11 MB",
    "downloadUrl": "https://www.mediafire.com/file/example/example.ipa/file",
    "iconUrl": "https://example.com/icon.png",
    "screenshots": ["https://example.com/screen1.png"],
    "supportedDevices": ["iPhone", "iPad"],
    "modFeatures": "Custom features / notes here.",
    "tags": ["social", "ipa"],
    "status": "published"
  }'
```

`type` must be `app` or `game`.

### Update post

```bash
curl -X PUT "https://YOUR-SITE.vercel.app/api/posts/POST_ID" \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY" \
  -d '{
    "ipaVersion": "1.0.1",
    "size": "170 MB",
    "downloadUrl": "https://www.mediafire.com/file/new/example.ipa/file"
  }'
```

### Delete post

```bash
curl -X DELETE "https://YOUR-SITE.vercel.app/api/posts/POST_ID" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY"
```

### List all posts with IDs

```bash
curl "https://YOUR-SITE.vercel.app/api/admin/list" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY"
```

### Public read endpoints

```txt
GET /api/posts
GET /api/posts?id=POST_ID
GET /api/posts?type=app
GET /api/posts?type=game
GET /api/posts?updated=true
GET /api/posts?search=spotify
GET /api/apple?bundleId=com.activision.callofduty.shooter
```
