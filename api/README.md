# xolar — Global IPA Library

A full English black-theme IPA library website built for **GitHub + Vercel + Firebase Realtime Database**.

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

## Ashierx7 separated developer store

Public page:

```txt
/ashierx7
```

The Ashier page is separate from the main xolar SPA and uses a dedicated static page with its own store UI, demo login, cart, demo purchases, English/Arabic auto language detection, Telegram links, and support email.

Ashier logo:

```txt
https://github.com/nosleepytime/xolar/raw/refs/heads/main/IMG_4517.jpeg
```

Customer support email:

```txt
app.celeste.isp@protonmail.com
```

### Ashier Firebase paths

```txt
/ashier/ipas
/ashier/views
```

### Ashier API endpoints

Same secret header as the main API:

```txt
x-api-key: YOUR_XOLAR_ADMIN_API_KEY
```

Create Ashier IPA:

```bash
curl -X POST "https://YOUR-SITE.vercel.app/api/ashier/posts" \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY" \
  -d '{
    "name": "Ashier Premium IPA",
    "bundleId": "com.example.app",
    "ipaVersion": "1.0.0",
    "size": "300 MB",
    "downloadUrl": "https://www.mediafire.com/file/example/file.ipa/file",
    "iconUrl": "https://example.com/icon.png",
    "screenshots": [],
    "supportedDevices": ["iPhone", "iPad", "iOS 15+"],
    "category": "Utilities",
    "modFeatures": "Premium drop by Ashier.",
    "tags": ["ashier", "premium", "ipa"],
    "priceMode": "paid",
    "price": 9.99,
    "currency": "USD",
    "stripePriceId": "",
    "demoCheckoutEnabled": true,
    "status": "published"
  }'
```

Free Ashier IPA:

```json
{
  "name": "Ashier Free IPA",
  "bundleId": "com.example.free",
  "ipaVersion": "1.0.0",
  "size": "120 MB",
  "downloadUrl": "https://www.mediafire.com/file/example/free.ipa/file",
  "iconUrl": "https://example.com/icon.png",
  "priceMode": "free",
  "price": 0,
  "currency": "USD",
  "status": "published"
}
```

Update Ashier IPA:

```bash
curl -X PUT "https://YOUR-SITE.vercel.app/api/ashier/posts/POST_ID" \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY" \
  -d '{
    "ipaVersion": "1.0.1",
    "size": "305 MB",
    "downloadUrl": "https://www.mediafire.com/file/new/file.ipa/file"
  }'
```

Delete Ashier IPA:

```bash
curl -X DELETE "https://YOUR-SITE.vercel.app/api/ashier/posts/POST_ID" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY"
```

List Ashier post IDs:

```bash
curl "https://YOUR-SITE.vercel.app/api/ashier/admin/list" \
  -H "x-api-key: YOUR_XOLAR_ADMIN_API_KEY"
```

Public reads:

```txt
GET /api/ashier/posts
GET /api/ashier/posts?id=POST_ID
GET /api/ashier/posts?priceMode=paid
GET /api/ashier/posts?priceMode=free
GET /api/ashier/posts?search=term
```

### Firebase Realtime Database rules update

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
    },
    "ashier": {
      "ipas": {
        ".indexOn": ["priceMode", "updatedAt", "createdAt", "nameLower", "bundleId"]
      },
      "views": {
        ".indexOn": ["updatedAt"]
      }
    }
  }
}
```

### Stripe note

This version includes demo login, demo cart, and demo purchases using localStorage. It does not charge real money yet. Paid IPA real downloads stay locked until Stripe Checkout + Firebase Auth are connected later.


## Stripe + paid IPAs + subscriptions added

This version includes:
- Global `/paid` page
- Global `/cart`
- Global `/subscriptions`
- Global `/purchases`
- Global `/payments`
- Stripe Checkout API
- Stripe Webhook API
- Stripe Customer Portal API
- EL CHAPO store still separate
- EL CHAPO Stripe checkout through the same Stripe API
- AdSense-ready placeholders in `index.html`

### Stripe environment variables

Add these in Vercel:

```txt
PUBLIC_SITE_URL=https://your-site.vercel.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_GLOBAL_SUB_MONTHLY_PRICE_ID=price_...
STRIPE_GLOBAL_SUB_YEARLY_PRICE_ID=price_...
```

### Stripe webhook

Create this webhook endpoint in Stripe:

```txt
https://your-site.vercel.app/api/stripe/webhook
```

Events:
```txt
checkout.session.completed
customer.subscription.updated
customer.subscription.deleted
```

### Global paid IPA fields

```json
{
  "priceMode": "paid",
  "price": 9.99,
  "currency": "USD",
  "stripePriceId": "price_...",
  "includedInSubscription": true
}
```

### AdSense

In `index.html`, replace:

```txt
ca-pub-REPLACE_ME
REPLACE_HOME_SLOT
REPLACE_DETAIL_SLOT
```

with your real Google AdSense values after approval.
