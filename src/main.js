import "./style.css";

const CONFIG = {
  logoUrl: import.meta.env.VITE_LOGO_URL || "/favicon.svg",
  siteName: import.meta.env.VITE_SITE_NAME || "xolar"
};

const state = {
  posts: [],
  appleCache: new Map(),
  query: "",
  route: location.pathname
};

const $ = (selector, root = document) => root.querySelector(selector);

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}

function daysSince(value) {
  if (!value) return 999;
  return (Date.now() - new Date(value).getTime()) / 86400000;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function isRecentlyUpdated(post) {
  return daysSince(post.updatedAt) <= 5;
}

function getTypeLabel(type) {
  return type === "game" ? "Games" : "Apps";
}

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || "Request failed");
  return data;
}

async function loadPosts() {
  const data = await api("/api/posts");
  state.posts = data.posts || [];
}

async function getApple(bundleId) {
  if (!bundleId) return null;
  if (state.appleCache.has(bundleId)) return state.appleCache.get(bundleId);

  try {
    const data = await api(`/api/apple?bundleId=${encodeURIComponent(bundleId)}`);
    state.appleCache.set(bundleId, data.apple || null);
    return data.apple || null;
  } catch {
    state.appleCache.set(bundleId, null);
    return null;
  }
}

function navigate(path) {
  history.pushState({}, "", path);
  state.route = location.pathname;
  render();
  scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("popstate", () => {
  state.route = location.pathname;
  render();
});

function shell(content) {
  return `
    <div class="site-bg"></div>
    <header class="topbar">
      <button class="brand" data-nav="/">
        <img src="${escapeHtml(CONFIG.logoUrl)}" alt="${escapeHtml(CONFIG.siteName)} logo" />
      </button>

      <a class="ashier-promo" href="/ashierx7"><span>Ashierx7</span></a>

      <div class="top-actions">
        <button class="icon-btn" data-nav="/search" aria-label="Search">
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
        <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">
          <i class="fa-solid fa-moon"></i>
        </button>
        <button class="icon-btn" id="menuBtn" aria-label="Menu">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>
    </header>

    <nav class="drawer" id="drawer">
      <button data-nav="/">Home</button>
      <button data-nav="/updates/apps">Latest App Updates</button>
      <button data-nav="/apps">IPA Apps</button>
      <button data-nav="/updates/games">Latest Game Updates</button>
      <button data-nav="/games">IPA Games</button>
      <button data-nav="/search">Search</button>
    </nav>

    <main class="page">${content}</main>
    <footer class="footer">© ${new Date().getFullYear()} ${escapeHtml(CONFIG.siteName)} — Global IPA Library</footer>
  `;
}

function section(title, icon, posts, viewPath) {
  const limited = posts.slice(0, 6);
  return `
    <section class="glass-section">
      <div class="section-head">
        <div class="section-title">
          <span class="glow-icon"><i class="${icon}"></i></span>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <button class="view-all" data-nav="${viewPath}">View All</button>
      </div>
      <div class="cards-list">
        ${limited.length ? limited.map(card).join("") : emptyCard("No IPA found yet.")}
      </div>
    </section>
  `;
}

function emptyCard(text) {
  return `<div class="empty-card">${escapeHtml(text)}</div>`;
}

function badge(post) {
  if (!isRecentlyUpdated(post)) return "";
  return `<span class="status-badge">${daysSince(post.createdAt) <= 5 ? "NEW" : "UPDATE"}</span>`;
}

function card(post) {
  return `
    <article class="ipa-card" data-nav="/ipa/${escapeHtml(post.id)}">
      <div class="icon-wrap">
        <img src="${escapeHtml(post.iconUrl || "/favicon.svg")}" alt="${escapeHtml(post.name)} icon" />
        <span class="mod-pill">IPA</span>
        <span class="platform-dot"><i class="fa-brands fa-apple"></i></span>
      </div>
      <div class="card-main">
        <h3>${escapeHtml(post.name)}</h3>
        <div class="meta-line">
          <span>${escapeHtml(post.category || getTypeLabel(post.type))}</span>
          <span>${escapeHtml(post.size || "N/A")}</span>
        </div>
        <p>v${escapeHtml(post.ipaVersion || "N/A")}</p>
      </div>
      ${badge(post)}
    </article>
  `;
}

function homePage() {
  const apps = state.posts.filter(p => p.type === "app");
  const games = state.posts.filter(p => p.type === "game");

  const latestAppUpdates = [...apps].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const latestGameUpdates = [...games].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const appNewest = [...apps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const gameNewest = [...games].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return shell(`
    <section class="hero">
      <div>
        <p class="breadcrumb">Home</p>
        <h1>${escapeHtml(CONFIG.siteName)}</h1>
        <p class="hero-subtitle">Global IPA Library with fast search, live details, ratings, screenshots, and MediaFire download links.</p>
      </div>
      <div class="hero-card">
        <span>Total IPAs</span>
        <strong>${state.posts.length}</strong>
      </div>
    </section>

    ${section("Latest IPA Update", "fa-solid fa-bolt", latestAppUpdates, "/updates/apps")}
    ${section("IPA Apps", "fa-solid fa-layer-group", appNewest, "/apps")}
    ${section("Latest IPA Games", "fa-solid fa-gamepad", latestGameUpdates, "/updates/games")}
    ${section("IPA Games", "fa-solid fa-trophy", gameNewest, "/games")}
  `);
}

function listTitle(path) {
  if (path === "/apps") return ["Apps", state.posts.filter(p => p.type === "app").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))];
  if (path === "/games") return ["Games", state.posts.filter(p => p.type === "game").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))];
  if (path === "/updates/games") return ["Latest IPA Games Update", state.posts.filter(p => p.type === "game").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))];
  return ["Latest IPA Update", state.posts.filter(p => p.type === "app").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))];
}

function viewAllPage() {
  const [title, posts] = listTitle(state.route);
  return shell(`
    <section class="list-hero">
      <p class="breadcrumb"><button data-nav="/">Home</button> <i class="fa-solid fa-chevron-right"></i> ${escapeHtml(title)}</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="filter-panel">
        <div class="tabs">
          <button class="active">All</button>
          <button>Art & Design</button>
          <button>Auto & Vehicles</button>
          <button>Utilities</button>
        </div>
        <select id="sortSelect">
          <option value="newest">Newest First</option>
          <option value="updated">Recently Updated</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
    </section>
    <section class="view-list">
      ${posts.map(card).join("") || emptyCard("No IPA found.")}
    </section>
  `);
}

function searchPage() {
  const q = state.query.toLowerCase();
  const results = state.posts
    .filter(post => !q || [post.name, post.bundleId, post.category, post.type, post.ipaVersion, ...(post.tags || [])].join(" ").toLowerCase().includes(q))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return shell(`
    <section class="list-hero">
      <p class="breadcrumb"><button data-nav="/">Home</button> <i class="fa-solid fa-chevron-right"></i> Search</p>
      <h1>Search</h1>
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="liveSearch" value="${escapeHtml(state.query)}" placeholder="Search IPAs, bundle IDs, versions, categories..." autofocus />
      </div>
    </section>
    <section class="view-list">
      ${results.map(card).join("") || emptyCard("No result found.")}
    </section>
  `);
}

function starSvg(fill) {
  const pct = Math.max(0, Math.min(100, fill * 100));
  const id = `star-${Math.random().toString(36).slice(2)}`;
  return `
    <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="${id}">
          <stop offset="${pct}%" stop-color="#ffc629"/>
          <stop offset="${pct}%" stop-color="#344052"/>
        </linearGradient>
      </defs>
      <path fill="url(#${id})" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  `;
}

function stars(value) {
  const rating = Number(value || 0);
  let out = "";
  for (let i = 1; i <= 5; i++) out += starSvg(Math.max(0, Math.min(1, rating - (i - 1))));
  return out;
}

async function detailPage(id) {
  const post = state.posts.find(p => p.id === id);
  if (!post) return notFound();

  fetch(`/api/views/${encodeURIComponent(id)}`, { method: "POST" }).catch(() => {});
  const apple = await getApple(post.bundleId);

  const appName = apple?.trackName || post.name;
  const category = apple?.primaryGenreName || post.category || getTypeLabel(post.type);
  const appStoreVersion = apple?.version || post.appStoreVersion || "N/A";
  const rating = apple?.averageUserRating ?? 0;
  const ratingCount = apple?.userRatingCount ?? 0;
  const supportedDevices = post.supportedDevices?.length ? post.supportedDevices : (apple?.supportedDevices || []);
  const screenshots = post.screenshots?.length ? post.screenshots : (apple?.screenshotUrls || []);

  return shell(`
    <section class="detail-panel">
      <p class="breadcrumb"><button data-nav="/">Home</button> <i class="fa-solid fa-chevron-right"></i> ${escapeHtml(appName)}</p>

      <div class="detail-icon">
        <img src="${escapeHtml(post.iconUrl || apple?.artworkUrl512 || "/favicon.svg")}" alt="${escapeHtml(appName)} icon" />
      </div>

      <h1 class="detail-title">${escapeHtml(appName)} IPA v${escapeHtml(post.ipaVersion || "N/A")}</h1>

      <div class="chips">
        <span>v${escapeHtml(post.ipaVersion || "N/A")}</span>
        <span>${escapeHtml(category)}</span>
        <span>iOS</span>
      </div>

      <div class="rating-box">
        <div class="stars">${stars(rating)}</div>
        <strong>${escapeHtml(rating)}</strong>
        <span>(${escapeHtml(ratingCount)})</span>
      </div>

      <a class="download-btn" href="${escapeHtml(post.downloadUrl || "#")}" target="_blank" rel="noopener">
        <i class="fa-solid fa-download"></i> Download IPA
      </a>

      <div class="info-grid">
        ${info("App Name", appName, "fa-solid fa-circle-info")}
        ${info("IPA Version", post.ipaVersion || "N/A", "fa-solid fa-hashtag")}
        ${info("App Store Version", appStoreVersion, "fa-brands fa-app-store-ios")}
        ${info("Updated", formatDate(post.updatedAt), "fa-solid fa-calendar-days")}
        ${info("Size", post.size || "N/A", "fa-solid fa-box-archive")}
        ${info("Category", category, "fa-solid fa-folder")}
        ${info("Post Views", post.views ?? "0", "fa-solid fa-eye")}
        ${info("Bundle ID", post.bundleId || "N/A", "fa-solid fa-code")}
      </div>

      <details class="collapse-box">
        <summary>Supported Devices <i class="fa-solid fa-chevron-down"></i></summary>
        <div class="device-list">
          ${supportedDevices.length ? supportedDevices.map(d => `<span>${escapeHtml(d)}</span>`).join("") : "<span>N/A</span>"}
        </div>
      </details>

      <section class="features">
        <h2>Mod Features</h2>
        <p>${escapeHtml(post.modFeatures || "No features added yet.")}</p>
      </section>

      <section class="screenshots">
        <h2>Screenshots</h2>
        <div class="shot-row">
          ${screenshots.length ? screenshots.map(url => `<img src="${escapeHtml(url)}" alt="Screenshot" loading="lazy" />`).join("") : emptyCard("No screenshots.")}
        </div>
      </section>
    </section>
  `);
}

function info(label, value, icon) {
  return `
    <div class="info-card">
      <span><i class="${icon}"></i></span>
      <div>
        <p>${escapeHtml(label)}</p>
        <strong>${escapeHtml(value)}</strong>
      </div>
    </div>
  `;
}

function notFound() {
  return shell(`
    <section class="not-found">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
      <button class="download-btn" data-nav="/">Back Home</button>
    </section>
  `);
}

async function render() {
  const path = state.route;
  const app = $("#app");

  if (!state.posts.length) {
    app.innerHTML = shell(`<section class="loading"><div class="spinner"></div><p>Loading Global IPA Library...</p></section>`);
    try {
      await loadPosts();
    } catch (error) {
      app.innerHTML = shell(`<section class="not-found"><h1>Error</h1><p>${escapeHtml(error.message)}</p></section>`);
      bindEvents();
      return;
    }
  }

  if (path === "/") app.innerHTML = homePage();
  else if (["/apps", "/games", "/updates/apps", "/updates/games"].includes(path)) app.innerHTML = viewAllPage();
  else if (path === "/search") app.innerHTML = searchPage();
  else if (path.startsWith("/ipa/")) app.innerHTML = await detailPage(decodeURIComponent(path.split("/").pop()));
  else app.innerHTML = notFound();

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.addEventListener("click", event => {
      event.preventDefault();
      navigate(el.getAttribute("data-nav"));
    });
  });

  const drawer = $("#drawer");
  const menuBtn = $("#menuBtn");
  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => drawer.classList.toggle("open"));
  }

  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => document.body.classList.toggle("light"));
  }

  const liveSearch = $("#liveSearch");
  if (liveSearch) {
    liveSearch.addEventListener("input", event => {
      state.query = event.target.value;
      render();
    });
  }

  const sortSelect = $("#sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", event => {
      const list = $(".view-list");
      const cards = [...list.querySelectorAll(".ipa-card")];
      if (event.target.value === "name") {
        cards.sort((a, b) => a.innerText.localeCompare(b.innerText));
      } else {
        cards.reverse();
      }
      list.innerHTML = "";
      cards.forEach(card => list.appendChild(card));
      bindEvents();
    });
  }
}

render();
