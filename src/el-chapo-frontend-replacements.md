# EL CHAPO Frontend Replacements

Do these replacements in `src/main.js`:

```txt
Ashierx7 -> EL CHAPO
ashierx7 -> el-chapo
/api/ashier -> /api/el-chapo
ashierPosts -> elChapoPosts
loadAshierPosts -> loadElChapoPosts
ashierShell -> elChapoShell
ashierHomePage -> elChapoHomePage
ashierDetailPage -> elChapoDetailPage
ashier_brand / ashier text can stay as CSS class names, but visible text must be EL CHAPO.
```

Remove these language features completely:

```txt
detectLang()
t()
saveLang()
state.lang
localStorage key xolar_ashier_lang
all data-lang buttons
AR / EN button
all Arabic strings
dir="rtl"
ashier-page[dir="rtl"] CSS behavior if you want to clean CSS too
```

The official page must be:

```txt
/el-chapo
/el-chapo/ipa/POST_ID
/el-chapo/cart
/el-chapo/purchases
/el-chapo/auth
```

The API calls inside the frontend must be:

```txt
GET /api/el-chapo/posts
POST /api/el-chapo/views/POST_ID
```

Not:

```txt
/api/ashier/posts
/api/ashier/views/POST_ID
```
