# EL CHAPO Patch

This patch replaces Ashierx7 with EL CHAPO and fixes the developer page APIs.

## What to do

1. Copy the folder `api/el-chapo` into your project.
2. Keep your old `api/_firebase.js`, but add the EL CHAPO helper functions from `firebase-extra-functions.txt`.
3. In `src/main.js`, replace:
   - `Ashierx7` with `EL CHAPO`
   - `ashierx7` with `el-chapo`
   - `/api/ashier` with `/api/el-chapo`
   - `ashier/ipas` references are not used by frontend, APIs now use `elChapo/ipas`
4. Remove the AR language button and Arabic text from the page.
5. In `vercel.json`, add:
```json
{ "source": "/el-chapo", "destination": "/" },
{ "source": "/el-chapo/:path*", "destination": "/" }
```

## EL CHAPO API endpoints

```txt
GET    /api/el-chapo/posts
POST   /api/el-chapo/posts
GET    /api/el-chapo/posts/POST_ID
PUT    /api/el-chapo/posts/POST_ID
DELETE /api/el-chapo/posts/POST_ID
GET    /api/el-chapo/admin/list
POST   /api/el-chapo/views/POST_ID
```

Private POST/PUT/DELETE/list require:

```txt
x-api-key: YOUR_XOLAR_ADMIN_API_KEY
```
