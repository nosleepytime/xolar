# Copy-paste blocks for the EL CHAPO page

## Header button on the main xolar site

Replace the old Ashierx7 promo button with:

```html
<button class="ashier-promo" data-nav="/el-chapo">
  <span>EL CHAPO</span>
</button>
```

## EL CHAPO page shell

Replace the old Ashier shell/header with this English-only version:

```js
function elChapoShell(content) {
  return `
    <div class="site-bg ashier-bg"></div>

    <header class="topbar ashier-header">
      <button class="brand ashier-brand" data-nav="/el-chapo">
        <img src="${escapeHtml(CONFIG.elChapoLogoUrl)}" alt="EL CHAPO logo" />
      </button>

      <div class="ashier-nav">
        <button data-nav="/el-chapo">Store</button>
        <button data-nav="/el-chapo/cart">
          Cart ${state.cart.length ? `<b>${state.cart.length}</b>` : ""}
        </button>
        <button data-nav="/el-chapo/purchases">My Purchases</button>
      </div>

      <div class="top-actions">
        <button class="icon-btn" id="menuBtn" aria-label="Menu">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>
    </header>

    <nav class="drawer" id="drawer">
      <button data-nav="/">xolar Home</button>
      <button data-nav="/el-chapo">EL CHAPO Store</button>
      <button data-nav="/el-chapo/cart">Cart</button>
      <button data-nav="/el-chapo/purchases">My Purchases</button>
      <button data-nav="/el-chapo/auth">
        ${state.user ? "Account" : "Sign In / Sign Up"}
      </button>
    </nav>

    <main class="page ashier-page">${content}</main>

    <footer class="footer">
      EL CHAPO developer page · Support:
      <a href="mailto:${CONFIG.supportEmail}">${CONFIG.supportEmail}</a>
    </footer>
  `;
}
```

## Config block

Use this config at the top of `src/main.js`:

```js
const CONFIG = {
  siteName: import.meta.env.VITE_SITE_NAME || "xolar",
  logoUrl: import.meta.env.VITE_LOGO_URL || "/favicon.svg",
  elChapoLogoUrl: "https://github.com/nosleepytime/xolar/raw/refs/heads/main/IMG_4517.jpeg",
  supportEmail: "app.celeste.isp@protonmail.com",
  telegramContact: "https://t.me/ashierx7",
  telegramChannel: "https://t.me/vnxgangs"
};
```

## EL CHAPO page hero

Replace the old Ashier hero content with:

```html
<section class="ashier-hero">
  <div class="ashier-logo-orb">
    <img src="${escapeHtml(CONFIG.elChapoLogoUrl)}" alt="EL CHAPO" />
  </div>

  <p class="breadcrumb">Developer Store</p>
  <h1>EL CHAPO</h1>

  <p class="hero-subtitle">
    A separate developer page for EL CHAPO IPA releases, premium drops, free content,
    announcements, and support. This page uses its own API and database path,
    isolated from the main xolar library.
  </p>

  <div class="ashier-links">
    <a href="${CONFIG.telegramContact}" target="_blank" rel="noopener">
      <i class="fa-brands fa-telegram"></i>
      Contact EL CHAPO
    </a>

    <a href="${CONFIG.telegramChannel}" target="_blank" rel="noopener">
      <i class="fa-brands fa-telegram"></i>
      Join Telegram Channel
    </a>

    <a href="mailto:${CONFIG.supportEmail}">
      <i class="fa-solid fa-headset"></i>
      Customer Support
    </a>
  </div>
</section>
```
