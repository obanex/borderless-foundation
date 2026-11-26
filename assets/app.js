/*
 * Borderless Foundation — single-page app core and Foundation pages.
 * Hash routes: #/  #/growth[/id]  #/services  #/ecosystem  #/advertise  #/contact
 * The Borderless Opportunities section (#/opportunities/...) lives in opportunities.js,
 * the translation & notarization service (#/translation) in translation.js.
 */
(function () {
  "use strict";

  const CONFIG = window.CONFIG;
  const I18N = window.I18N;
  const DATA = window.DATA;
  const LANGS = ["en", "fr"];
  const STORAGE_KEY = "bf-lang";

  const state = {
    lang: initialLang(),
    oppFilters: { q: "", type: "", region: "", level: "" },
    growthCat: ""
  };

  const $header = document.getElementById("site-header");
  let $main = document.getElementById("main");
  const $footer = document.getElementById("site-footer");

  /* ---------- i18n helpers ---------- */

  function initialLang() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (LANGS.includes(saved)) return saved;
    } catch (e) { /* storage unavailable */ }
    return LANGS.includes(CONFIG.defaultLang) ? CONFIG.defaultLang : "en";
  }

  function t(key, vars) {
    let s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
    if (vars) for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  }

  // Pick the current language from a { fr, en } content object, falling back to English when a translation is missing.
  function L(obj) {
    if (!obj) return "";
    const v = obj[state.lang];
    const missing = v == null || v === "" || (Array.isArray(v) && !v.length);
    return missing ? (obj.en ?? (Array.isArray(v) ? [] : "")) : v;
  }

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function normalize(str) {
    return String(str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // True when every word of the query appears in one of the given texts.
  function matches(query, texts) {
    const q = normalize(query.trim());
    if (!q) return true;
    const hay = normalize(texts.join(" "));
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function fmtDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(state.lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  // A link from Settings; empty links lead to the Contact page.
  function link(key) {
    return CONFIG[key] || "#/contact";
  }

  // Opens links to other websites in a new tab; links inside the site stay in the same tab.
  function ext(href) {
    return /^https?:/i.test(href || "") ? ' target="_blank" rel="noopener"' : "";
  }

  /* ---------- Icons (line style, rounded) ---------- */

  const ICONS = {
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="3"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    menu: '<line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }

  const TYPE_ICON = { scholarship: "cap", internship: "briefcase", training: "monitor", call: "zap", conference: "mic" };
  const TYPES = Object.keys(TYPE_ICON);
  const REGIONS = ["canada", "europe", "asia", "caribbean", "global"];
  const LEVELS = ["bachelor", "master", "phd"];

  function brandMark() {
    return '<svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">' +
      '<ellipse cx="24" cy="24" rx="21" ry="9" transform="rotate(-20 24 24)" fill="none" stroke="#5fd4e6" stroke-width="1.6" opacity=".55"/>' +
      '<circle cx="24" cy="24" r="10" fill="#f2b84b"/>' +
      '<circle cx="21.2" cy="20.8" r="4.6" fill="#ffe6a8" opacity=".75"/>' +
      '<path d="M4.27 31.18 A21 9 -20 0 0 43.73 16.82" fill="none" stroke="#5fd4e6" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="43.73" cy="16.82" r="3" fill="#5fd4e6"/>' +
      "</svg>";
  }

  function brand() {
    return '<a class="brand" href="#/" aria-label="Borderless Foundation">' + brandMark() +
      '<span class="brand-text"><b>Borderless</b><span>' + t("brand.entity") + "</span></span></a>";
  }

  function entityName(name) {
    return '<span class="entity-name"><b>Borderless</b> <span>' + name + "</span></span>";
  }

  /* ---------- Deadlines ---------- */

  function daysUntil(iso) {
    const d = new Date(iso + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((d - today) / 86400000);
  }

  function deadlineBadge(iso) {
    const days = daysUntil(iso);
    if (days < 0) return '<span class="deadline deadline--closed">' + t("opp.closed") + "</span>";
    const soon = days <= 14 ? " deadline--soon" : "";
    const label = days === 0 ? t("opp.lastday") : t("opp.days", { n: days });
    return '<span class="deadline' + soon + '">' + icon("clock") + label + "</span>";
  }

  function byDeadline(a, b) {
    const ca = daysUntil(a.deadline) < 0, cb = daysUntil(b.deadline) < 0;
    if (ca !== cb) return ca ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  }

  /* ---------- Shared components ---------- */

  function callCard(o) {
    const levels = o.levels.map((l) => t("level." + l)).join(" · ");
    return '<a class="card opp-card type-' + o.type + '" href="#/opportunities/calls/' + o.id + '">' +
      '<div class="opp-top"><span class="type-tag">' + icon(TYPE_ICON[o.type]) + t("type." + o.type) + "</span>" +
      '<div class="opp-funding">' + L(o.funding) + "</div>" + deadlineBadge(o.deadline) + "</div>" +
      '<div class="opp-body"><div class="opp-org">' + L(o.org) + "</div><h3>" + L(o.title) + "</h3>" +
      '<div class="opp-meta"><span>' + icon("pin") + t("region." + o.region) + "</span><span>" + icon("layers") + levels + "</span></div>" +
      '<div class="card-foot"><span class="read-time">' + icon("calendar") + fmtDate(o.deadline) + "</span>" +
      '<span class="link-arrow">' + t("opp.details") + icon("arrow") + "</span></div></div></a>";
  }

  function articleCard(a) {
    return '<a class="card article-card" href="#/growth/' + a.id + '">' +
      '<div class="article-art art-' + a.category + '" aria-hidden="true"></div>' +
      '<div class="cat-label">' + t("growth.cat." + a.category) + "</div>" +
      "<h3>" + L(a.title) + "</h3><p>" + L(a.excerpt) + "</p>" +
      '<div class="card-foot"><span class="read-time">' + icon("clock") + t("growth.read", { n: a.minutes }) + "</span>" +
      '<span class="link-arrow">' + t("growth.readmore") + icon("arrow") + "</span></div></a>";
  }

  function adSlot() {
    return '<a class="card ad-slot" href="#/advertise">' +
      '<div class="ad-label">' + t("ad.label") + "</div>" +
      '<span class="icon-bubble icon-bubble--gold" style="margin-bottom:14px">' + icon("layout") + "</span>" +
      "<h3>" + t("ad.title") + "</h3><p>" + t("ad.text") + "</p>" +
      '<span class="link-arrow">' + t("ad.cta") + icon("arrow") + "</span></a>";
  }

  function pageHero(title, sub, extra) {
    return '<section class="page-hero"><div class="container fade-in">' + (extra || "") +
      "<h1>" + title + '</h1><p class="lead">' + sub + "</p></div></section>";
  }

  function whatsappButton(cls) {
    return '<a class="btn btn--gold ' + (cls || "") + '" href="' + esc(link("whatsappCommunity")) + '"' + ext(link("whatsappCommunity")) + ">" +
      icon("chat") + t("hero.cta.whatsapp") + "</a>";
  }

  // Big search bar that leads to the Borderless Opportunities search page.
  function searchBar(value) {
    return '<form class="search-bar" role="search" data-search>' +
      '<label class="visually-hidden" for="site-search">' + t("hub.search.label") + "</label>" +
      icon("search") +
      '<input id="site-search" name="q" type="search" placeholder="' + t("hub.search.ph") + '" value="' + esc(value || "") + '">' +
      '<button type="submit" class="btn btn--gold">' + t("hub.search.btn") + "</button></form>";
  }

  function levelOptions(selected) {
    return '<option value="">' + t("form.select") + "</option>" +
      LEVELS.map((l) => '<option value="' + l + '"' + (selected === l ? " selected" : "") + ">" + t("level." + l) + "</option>").join("") +
      '<option value="professional">' + t("form.level.other") + "</option>";
  }

  function field(name, label, type, required, full) {
    return '<div class="field' + (full ? " full" : "") + '"><label for="' + name + '">' + label + (required ? " *" : "") + "</label>" +
      '<input class="input" id="' + name + '" name="' + name + '" type="' + type + '"' + (required ? " required" : "") +
      (type === "email" ? ' autocomplete="email"' : name === "name" ? ' autocomplete="name"' : "") + "></div>";
  }

  function formFooter(submitLabel) {
    return '<div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="full" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">' +
      '<p class="form-note">' + t("form.required") + "</p>" +
      '<button type="submit" class="btn btn--gold">' + submitLabel + icon("arrow") + "</button></div>" +
      '<div class="full form-status" role="status"></div>';
  }

  /* ---------- Header & footer ---------- */

  const NAV = [
    ["home", "#/"],
    ["opportunities", "#/opportunities"],
    ["growth", "#/growth"],
    ["services", "#/services"],
    ["translation", "#/translation"],
    ["ecosystem", "#/ecosystem"],
    ["advertise", "#/advertise"],
    ["contact", "#/contact"]
  ];

  function renderHeader() {
    $header.innerHTML =
      '<div class="container header-inner">' + brand() +
      '<nav class="main-nav" id="main-nav" aria-label="Menu"><ul>' +
      NAV.map(([key, href]) => '<li><a href="' + href + '" data-nav="' + key + '">' + t("nav." + key) + "</a></li>").join("") +
      "</ul></nav>" +
      '<div class="header-actions">' +
      '<div class="lang-switch" role="group" aria-label="' + t("a11y.lang") + '">' +
      LANGS.map((l) => '<button type="button" data-lang="' + l + '" aria-pressed="' + (l === state.lang) + '" lang="' + l + '">' + l.toUpperCase() + "</button>").join("") +
      "</div>" +
      '<a class="btn btn--gold btn--sm header-cta" href="' + esc(link("whatsappCommunity")) + '"' + ext(link("whatsappCommunity")) + ">" + icon("chat") + t("header.cta") + "</a>" +
      '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="' + t("a11y.menu") + '">' + icon("menu") + "</button>" +
      "</div></div>";

    fitHeader();
    $header.querySelectorAll("[data-lang]").forEach((btn) => btn.addEventListener("click", () => setLang(btn.dataset.lang)));
    const toggle = $header.querySelector(".menu-toggle");
    const nav = $header.querySelector(".main-nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = icon(open ? "close" : "menu");
    });
  }

  // When the full menu doesn't fit on one line (whatever the language or label length),
  // first hide the header's WhatsApp button, then switch to the compact (☰) menu.
  function fitHeader() {
    const inner = $header.querySelector(".header-inner");
    const overflows = () => inner.scrollWidth > inner.clientWidth;
    $header.classList.remove("is-compact", "no-cta");
    if (!overflows()) { closeMenu(); return; }
    $header.classList.add("no-cta");
    if (!overflows()) { closeMenu(); return; }
    $header.classList.replace("no-cta", "is-compact");
  }

  function closeMenu() {
    const nav = $header.querySelector(".main-nav");
    const toggle = $header.querySelector(".menu-toggle");
    if (nav && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = icon("menu");
    }
  }

  function setActiveNav(page) {
    $header.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === page) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function socialLinks() {
    return [["linkedin", "LinkedIn"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"]]
      .filter(([k]) => CONFIG[k])
      .map(([k, label]) => '<a href="' + esc(CONFIG[k]) + '" target="_blank" rel="noopener" aria-label="' + label + '">' + icon(k) + "</a>")
      .join("");
  }

  function renderFooter() {
    const year = new Date().getFullYear();
    $footer.innerHTML =
      '<div class="container"><div class="footer-grid">' +
      '<div class="footer-brand">' + brand() + "<p>" + t("footer.about") + '</p><div class="socials">' + socialLinks() + "</div></div>" +
      "<div><h4>" + t("footer.opps") + "</h4><ul>" +
      '<li><a href="#/opportunities/scholarships">' + t("opp.nav.guides") + "</a></li>" +
      '<li><a href="#/opportunities/calls">' + t("opp.nav.calls") + "</a></li>" +
      '<li><a href="#/opportunities/toolkit">' + t("opp.nav.toolkit") + "</a></li>" +
      '<li><a href="#/opportunities/laureates">' + t("opp.nav.laureates") + "</a></li>" +
      '<li><a href="#/opportunities/insights">' + t("opp.nav.insights") + "</a></li></ul></div>" +
      "<div><h4>" + t("footer.foundation") + "</h4><ul>" +
      '<li><a href="#/ecosystem">' + t("nav.ecosystem") + "</a></li>" +
      '<li><a href="#/services">' + t("nav.services") + "</a></li>" +
      '<li><a href="#/translation">' + t("tr.footer") + "</a></li>" +
      '<li><a href="#/growth">' + t("nav.growth") + "</a></li>" +
      '<li><a href="#/ecosystem?section=ambassador">Borderless Ambassador</a></li>' +
      '<li><a href="#/advertise">' + t("nav.advertise") + "</a></li></ul></div>" +
      "<div><h4>" + t("footer.community") + "</h4><ul>" +
      (CONFIG.whatsappCommunity ? '<li><a href="' + esc(CONFIG.whatsappCommunity) + '" target="_blank" rel="noopener">' + t("contact.wa.community") + "</a></li>" : "") +
      (CONFIG.whatsappChannel ? '<li><a href="' + esc(CONFIG.whatsappChannel) + '" target="_blank" rel="noopener">' + t("footer.channel") + "</a></li>" : "") +
      '<li><a href="#/contact">' + t("nav.contact") + "</a></li></ul></div>" +
      "</div>" +
      '<div class="footer-bottom"><span>© ' + year + " Borderless Foundation. " + t("footer.rights") + "</span><span>" + t("footer.part") + "</span></div>" +
      "</div>";
  }

  /* ---------- Home (Foundation) ---------- */

  function pageHome() {
    const open = DATA.opportunities.filter((o) => daysUntil(o.deadline) >= 0);
    let featured = open.filter((o) => o.featured).sort(byDeadline);
    if (featured.length < 4) featured = featured.concat(open.filter((o) => !featured.includes(o)).sort(byDeadline));
    featured = featured.slice(0, 4);
    const articles = DATA.articles.slice().sort((a, b) => b.published.localeCompare(a.published)).slice(0, 3);
    const flagship = DATA.entities.find((e) => e.flagship);
    const others = DATA.entities.filter((e) => !e.flagship);
    const tiles = [
      ["guides", "#/opportunities/scholarships", "book", "opp.nav.guides"],
      ["calls", "#/opportunities/calls", "calendar", "opp.nav.calls"],
      ["toolkit", "#/opportunities/toolkit", "file", "opp.nav.toolkit"],
      ["laureates", "#/opportunities/laureates", "award", "opp.nav.laureates"]
    ];

    return (
      '<section class="hero"><div class="container hero-grid">' +
      '<div class="fade-in"><div class="eyebrow">' + t("hero.eyebrow") + "</div>" +
      "<h1>" + t("hero.title.a") + '<span class="accent">' + t("hero.title.b") + "</span>" + t("hero.title.c") + "</h1>" +
      '<p class="lead">' + t("hero.sub") + "</p>" +
      searchBar() +
      '<div class="hero-actions" style="margin-top:18px">' +
      '<a class="btn btn--ghost" href="#/opportunities">' + t("hero.cta.explore") + icon("arrow") + "</a>" +
      whatsappButton("btn--ghost-gold") + "</div></div>" +
      '<div class="hero-visual" aria-hidden="true"><div class="orbit-system"><div class="halo"></div>' +
      '<div class="ring r3"></div><div class="ring r2"></div><div class="ring r1"></div><div class="sun"></div>' +
      '<div class="orbit-caption">' + t("hero.caption") + "</div></div></div>" +
      "</div></section>" +

      '<section class="section--tight"><div class="container">' +
      '<div class="flagship-panel">' +
      '<div class="flagship-intro"><div class="eyebrow">' + t("home.flag.eyebrow") + "</div>" +
      "<h2>" + entityName("Opportunities") + '</h2><p class="flagship-motto">' + t("home.flag.motto") + "</p>" +
      "<p>" + t("home.flag.text") + "</p>" +
      '<a class="btn btn--gold" href="#/opportunities">' + t("home.flag.cta") + icon("arrow") + "</a></div>" +
      '<div class="flagship-tiles">' +
      tiles.map(([k, href, ic, label]) =>
        '<a class="tile" href="' + href + '"><span class="icon-bubble icon-bubble--gold">' + icon(ic) + "</span>" +
        "<span><strong>" + t(label) + "</strong><small>" + t("home.tile." + k + ".text") + "</small></span>" + icon("arrow", "tile-arrow") + "</a>"
      ).join("") +
      "</div></div></div></section>" +

      '<section class="section--tight"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("home.featured.title") + "</h2><p>" + t("home.featured.sub") + "</p></div>" +
      '<a class="link-arrow" href="#/opportunities/calls">' + t("home.featured.all") + icon("arrow") + "</a></div>" +
      '<div class="grid grid-4">' + featured.map(callCard).join("") + "</div>" +
      "</div></section>" +

      '<section class="section section--band"><div class="container">' +
      '<div class="section-head"><div><div class="eyebrow">' + t("home.eco.eyebrow") + "</div><h2>" + t("home.eco.title") + "</h2><p>" + t("home.eco.sub") + "</p></div>" +
      '<a class="link-arrow" href="#/ecosystem">' + t("home.eco.link") + icon("arrow") + "</a></div>" +
      '<div class="grid grid-4">' +
      others.map((e) =>
        '<a class="card entity-mini" href="#/ecosystem?entity=' + e.id + '" style="--planet:' + e.planet + '">' +
        '<span class="planet-dot"></span><h3 style="margin-top:14px">' + entityName(e.name) + "</h3>" +
        '<p class="mb-0">' + L(e.short) + "</p></a>"
      ).join("") +
      "</div>" +
      (flagship ? '<p class="form-note" style="margin-top:18px">' + entityName(flagship.name) + " → " + L(flagship.role) + "</p>" : "") +
      "</div></section>" +

      '<section class="section"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("home.growth.title") + "</h2></div>" +
      '<a class="link-arrow" href="#/growth">' + t("home.growth.link") + icon("arrow") + "</a></div>" +
      '<div class="grid grid-3">' + articles.map(articleCard).join("") + "</div>" +
      "</div></section>" +

      '<section class="section--tight" style="padding-bottom:clamp(56px,8vw,96px)"><div class="container">' +
      '<div class="cta-band"><div><div class="eyebrow">Borderless Ambassador</div><h2>' + t("home.amb.title") + "</h2><p>" + t("home.amb.text") + "</p></div>" +
      '<div class="cta-actions"><a class="btn btn--gold" href="#/contact?subject=ambassador">' + t("home.amb.cta") + "</a>" +
      '<a class="btn btn--ghost" href="#/ecosystem?section=ambassador">' + t("home.amb.more") + "</a></div></div>" +
      "</div></section>"
    );
  }

  /* ---------- Personal growth ---------- */

  function pageGrowth(query) {
    if (query.has("cat")) state.growthCat = query.get("cat");
    const cats = ["productivity", "career", "tools"];
    if (!cats.includes(state.growthCat)) state.growthCat = "";
    const list = DATA.articles.filter((a) => !state.growthCat || a.category === state.growthCat)
      .sort((a, b) => b.published.localeCompare(a.published));
    const catIcon = { productivity: "clock", career: "compass", tools: "file" };

    return pageHero(t("growth.title"), t("growth.sub")) +
      '<section class="section--tight" style="padding-top:0"><div class="container">' +
      '<div class="type-pills" role="group">' +
      '<button type="button" data-cat="" aria-pressed="' + !state.growthCat + '">' + icon("globe") + t("growth.cat.all") + "</button>" +
      cats.map((c) => '<button type="button" data-cat="' + c + '" aria-pressed="' + (state.growthCat === c) + '">' + icon(catIcon[c]) + t("growth.cat." + c) + "</button>").join("") +
      "</div>" +
      '<div class="grid grid-3">' + list.map(articleCard).join("") + "</div>" +
      "</div></section>" +
      '<section class="section section--band" id="tools"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("growth.tools.title") + "</h2><p>" + t("growth.tools.sub") + "</p></div>" +
      '<a class="link-arrow" href="#/opportunities/toolkit">' + t("opp.nav.toolkit") + icon("arrow") + "</a></div>" +
      '<div class="grid grid-3">' +
      DATA.downloads.map((d) =>
        '<div class="card"><span class="icon-bubble icon-bubble--gold" style="margin-bottom:16px">' + icon(d.icon) + "</span>" +
        "<h3>" + L(d.title) + "</h3><p>" + L(d.text) + '</p><div class="card-foot">' + downloadButton(d.file) + "</div></div>"
      ).join("") +
      "</div></div></section>";
  }

  function downloadButton(file) {
    return file
      ? '<a class="btn btn--teal btn--sm" href="' + esc(file) + '" download>' + icon("download") + t("growth.tools.download") + "</a>"
      : '<span class="btn btn--ghost btn--sm" aria-disabled="true">' + icon("clock") + t("growth.tools.soon") + "</span>";
  }

  function bindGrowth() {
    $main.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
      state.growthCat = b.dataset.cat;
      history.replaceState(null, "", "#/growth" + (state.growthCat ? "?cat=" + state.growthCat : ""));
      render({ keepScroll: true });
    }));
  }

  function pageArticle(id) {
    const a = DATA.articles.find((x) => x.id === id);
    const back = '<a class="breadcrumb" href="#/growth">' + icon("arrowLeft") + t("growth.back") + "</a>";
    if (!a) return pageHero(t("growth.title"), t("growth.notfound"), back);
    const more = DATA.articles.filter((x) => x.id !== a.id).sort((x, y) => (y.category === a.category) - (x.category === a.category)).slice(0, 3);

    return '<section class="page-hero"><div class="container fade-in">' + back +
      '<div class="cat-label">' + t("growth.cat." + a.category) + "</div>" +
      "<h1>" + L(a.title) + '</h1><p class="lead">' + L(a.excerpt) + "</p>" +
      '<span class="read-time">' + icon("clock") + t("growth.read", { n: a.minutes }) + " · " + fmtDate(a.published) + "</span></div></section>" +
      '<section class="section--tight" style="padding-top:0"><div class="container"><div class="prose">' +
      L(a.body).map((p) => "<p>" + p + "</p>").join("") + "</div></div></section>" +
      '<section class="section--tight"><div class="container"><div class="cta-band"><div><div class="eyebrow">Borderless Consulting</div>' +
      "<h2>" + t("growth.cta.title") + "</h2><p>" + t("growth.cta.text") + "</p></div>" +
      '<div class="cta-actions"><a class="btn btn--gold" href="#/services?service=unsure">' + t("growth.cta.btn") + icon("arrow") + "</a></div></div></div></section>" +
      '<section class="section"><div class="container"><div class="section-head"><h2>' + t("growth.more") + '</h2></div><div class="grid grid-3">' +
      more.map(articleCard).join("") + "</div></div></section>";
  }

  /* ---------- Services & coaching ---------- */

  const SERVICE_OPTIONS = [
    ["academic", "svc.tier1.i1"], ["cv", "svc.tier1.i2"], ["interview", "svc.tier1.i3"], ["gapyear", "svc.tier1.i4"],
    ["membership", "svc.tier2.name"], ["unsure", "svc.form.unsure"]
  ];

  function pageServices(query) {
    const pre = query.get("service") || "";
    const consulting = DATA.entities.find((e) => e.id === "consulting");
    const tier = (n, featured, choose) =>
      '<div class="card tier' + (featured ? " tier--featured" : "") + '">' +
      (featured ? '<span class="badge">' + t("svc.tier2.badge") + "</span>" : "") +
      '<span class="tier-label">' + t("svc.tier" + n + ".label") + "</span>" +
      "<h3>" + t("svc.tier" + n + ".name") + '</h3><span class="tier-tag">' + t("svc.tier" + n + ".tag") + "</span>" +
      "<p>" + t("svc.tier" + n + ".desc") + '</p><ul class="check-list' + (featured ? " check-list--gold" : "") + '">' +
      [1, 2, 3, 4].map((i) => "<li>" + t("svc.tier" + n + ".i" + i) + "</li>").join("") + "</ul>" +
      '<p class="price-note">' + t("svc.tier" + n + ".price") + "</p>" +
      '<a class="btn ' + (featured ? "btn--gold" : "btn--ghost") + ' btn--block" style="margin-top:auto" href="#/services?service=' + choose + '">' + t("svc.choose") + icon("arrow") + "</a></div>";

    return pageHero(t("svc.title"), t("svc.sub")) +
      '<section class="section--tight" style="padding-top:0"><div class="container"><div class="grid grid-2">' +
      tier(1, false, "academic") + tier(2, true, "membership") +
      "</div></div></section>" +
      '<section class="section section--band"><div class="container split">' +
      '<div><div class="eyebrow">' + t("svc.consulting.eyebrow") + "</div><h2>" + t("svc.consulting.title") + '</h2><p class="lead">' + t("svc.consulting.text") + "</p>" +
      (consulting ? '<ul class="check-list" style="margin-top:22px">' + L(consulting.focus).map((x) => "<li>" + x + "</li>").join("") + "</ul>" : "") + "</div>" +
      "<div><h3>" + t("svc.process.title") + '</h3><div class="grid" style="margin-top:16px">' +
      [1, 2, 3].map((i) => '<div class="card" style="flex-direction:row;gap:16px;align-items:center"><span class="icon-bubble' + (i === 3 ? " icon-bubble--gold" : "") + '"><b>' + i + '</b></span><p class="mb-0" style="color:var(--text)">' + t("svc.process." + i) + "</p></div>").join("") +
      "</div></div></div></section>" +
      '<section class="section--tight" style="padding-top:clamp(56px,8vw,96px)"><div class="container"><div class="cta-band"><div><div class="eyebrow">' + t("tr.eyebrow") + "</div>" +
      "<h2>" + t("tr.teaser.title") + "</h2><p>" + t("tr.teaser.text") + "</p></div>" +
      '<div class="cta-actions"><a class="btn btn--gold" href="#/translation">' + t("tr.teaser.cta") + icon("arrow") + "</a></div></div></div></section>" +
      '<section class="section" id="svc-form"><div class="container" style="max-width:860px">' +
      '<div class="card form-card"><h2>' + t("svc.form.title") + '</h2><p class="muted">' + t("svc.form.sub") + "</p>" +
      '<form data-form="services" novalidate><div class="form-grid">' +
      field("name", t("form.name"), "text", true) + field("email", t("form.email"), "email", true) +
      field("country", t("form.country"), "text", false) +
      '<div class="field"><label for="level">' + t("form.level") + '</label><select class="select" id="level" name="level">' + levelOptions() + "</select></div>" +
      '<div class="field full"><label for="service">' + t("svc.form.service") + ' *</label><select class="select" id="service" name="service" required><option value="">' + t("form.select") + "</option>" +
      SERVICE_OPTIONS.map(([v, k]) => '<option value="' + v + '"' + (pre === v ? " selected" : "") + ">" + t(k) + "</option>").join("") + "</select></div>" +
      '<div class="field full"><label for="message">' + t("svc.form.situation") + ' *</label><textarea class="textarea" id="message" name="message" required placeholder="' + t("svc.form.situation.ph") + '"></textarea></div>' +
      formFooter(t("svc.form.submit")) +
      "</div></form></div></div></section>";
  }

  /* ---------- Ecosystem ---------- */

  function pageEcosystem(query) {
    const selected = DATA.entities.find((e) => e.id === query.get("entity")) || DATA.entities[0] || null;
    const n = DATA.entities.length;
    const planets = DATA.entities.map((e, i) => {
      const angle = (-90 + (360 / n) * i) * Math.PI / 180;
      const x = 50 + 36 * Math.cos(angle), y = 50 + 36 * Math.sin(angle);
      return '<button type="button" class="eco-planet" data-entity="' + e.id + '" aria-pressed="' + (e === selected) + '" style="left:' + x.toFixed(2) + "%;top:" + y.toFixed(2) + "%;--planet:" + e.planet + '">' +
        '<span class="orb"></span><span>Borderless<br>' + e.name + "</span></button>";
    }).join("");

    return pageHero(t("eco.title"), t("eco.sub")) +
      '<section class="section--tight" style="padding-top:0"><div class="container split">' +
      '<div><p style="font-size:1.06rem">' + t("eco.intro.1") + '</p><p class="muted">' + t("eco.intro.2") + "</p></div>" +
      '<div class="card" style="border-color:rgba(242,184,75,.4)"><span class="icon-bubble icon-bubble--gold" style="margin-bottom:14px">' + icon("globe") + "</span>" +
      "<h3>" + t("eco.mission.title") + '</h3><p class="mb-0" style="color:var(--text)">' + t("eco.mission.text") + "</p></div>" +
      "</div></section>" +
      '<section class="section"><div class="container eco-layout">' +
      '<div><div class="eco-diagram"><div class="eco-ring eco-ring--outer"></div><div class="eco-ring"></div>' +
      '<div class="eco-core"><div><b>Borderless</b>Foundation</div></div>' + planets + "</div>" +
      '<p class="form-note center" style="margin-top:14px">' + t("eco.diagram.hint") + "</p></div>" +
      '<div id="eco-panel" aria-live="polite">' + (selected ? entityPanel(selected) : "") + "</div>" +
      "</div></section>" +
      '<section class="section section--band"><div class="container" style="max-width:860px">' +
      '<div class="section-head"><div><h2>' + t("eco.how.title") + "</h2><p>" + t("eco.how.sub") + "</p></div></div>" +
      '<ul class="flow-list">' +
      DATA.entities.map((e) => '<li style="--planet:' + e.planet + '"><span class="planet-dot"></span><span>' + entityName(e.name) + ' <span class="muted">→ ' + L(e.role) + "</span></span></li>").join("") +
      "</ul></div></section>" +
      '<section class="section" id="ambassador"><div class="container split">' +
      '<div><div class="eyebrow">' + t("eco.amb.eyebrow") + "</div><h2>" + t("eco.amb.title") + '</h2><p class="lead">' + t("eco.amb.text") + "</p>" +
      '<ul class="check-list check-list--gold" style="margin-top:20px">' + L(DATA.ambassadorBenefits).map((x) => "<li>" + x + "</li>").join("") + "</ul></div>" +
      '<div class="card" style="padding:clamp(22px,3vw,32px)"><h3>' + t("eco.amb.path") + '</h3><div class="pathway" style="margin:16px 0 20px">' +
      L(DATA.ambassadorPath).map((s) => '<span class="stage">' + s + "</span>").join(icon("arrow")) + "</div>" +
      '<p class="muted">' + t("eco.amb.reset") + "</p>" +
      '<a class="btn btn--gold" href="#/contact?subject=ambassador">' + t("eco.amb.cta") + icon("arrow") + "</a></div>" +
      "</div></section>";
  }

  function entityPanel(e) {
    const routeLabel = { opportunities: "home.flag.cta", services: "nav.services", ecosystem: "eco.amb.cta", advertise: "nav.advertise", contact: "nav.contact" }[e.route] || "nav.ecosystem";
    const href = e.id === "ambassador" ? "#/contact?subject=ambassador" : "#/" + e.route;
    return '<div class="card entity-card fade-in" style="--planet:' + e.planet + ';padding:clamp(22px,3vw,32px)">' +
      '<div class="entity-head"><span class="icon-bubble" style="color:' + e.planet + '">' + icon(e.icon) + "</span><div>" +
      (e.flagship ? '<div class="flag">' + t("eco.flagship") + "</div>" : "") +
      '<h2 style="font-size:1.5rem;margin:0">' + entityName(e.name) + "</h2></div></div>" +
      '<p style="color:var(--text)">' + L(e.text) + '</p><ul class="check-list">' + L(e.focus).map((x) => "<li>" + x + "</li>").join("") + "</ul>" +
      '<a class="link-arrow" style="margin-top:20px" href="' + href + '">' + t(routeLabel) + icon("arrow") + "</a></div>";
  }

  function bindEcosystem() {
    $main.querySelectorAll("[data-entity]").forEach((b) => b.addEventListener("click", () => {
      const e = DATA.entities.find((x) => x.id === b.dataset.entity);
      $main.querySelectorAll("[data-entity]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      document.getElementById("eco-panel").innerHTML = entityPanel(e);
      history.replaceState(null, "", "#/ecosystem?entity=" + e.id);
      if (window.innerWidth <= 920) document.getElementById("eco-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  /* ---------- Advertising & partnerships ---------- */

  function pageAdvertise() {
    const audIcons = ["cap", "briefcase", "globe", "chat"];
    const fmtIcons = ["layout", "file", "chat"];
    const pIcons = ["leaf", "cpu", "heart", "book", "rocket"];
    const formats = [["banner", "ads.fmt.1.title"], ["sponsored", "ads.fmt.2.title"], ["relay", "ads.fmt.3.title"], ["partnership", "ads.form.format.partner"]];
    const orgTypes = ["university", "training", "company", "ngo", "other"];

    return pageHero(t("ads.title"), t("ads.sub")) +
      '<section class="section--tight" style="padding-top:0"><div class="container">' +
      '<div class="eyebrow">' + t("ads.kit.eyebrow") + "</div><h2>" + t("ads.kit.title") + "</h2>" +
      '<div class="grid grid-4" style="margin-top:24px">' +
      audIcons.map((ic, i) => '<div class="card"><span class="icon-bubble" style="margin-bottom:14px">' + icon(ic) + "</span><h3>" + t("ads.aud." + (i + 1) + ".title") + '</h3><p class="mb-0">' + t("ads.aud." + (i + 1) + ".text") + "</p></div>").join("") +
      "</div></div></section>" +
      '<section class="section section--band"><div class="container">' +
      '<div class="section-head"><h2>' + t("ads.formats.title") + "</h2></div>" +
      '<div class="grid grid-3">' +
      fmtIcons.map((ic, i) => '<div class="card ad-slot" style="justify-content:flex-start"><span class="icon-bubble icon-bubble--gold" style="margin-bottom:14px">' + icon(ic) + "</span><h3>" + t("ads.fmt." + (i + 1) + ".title") + '</h3><p class="mb-0">' + t("ads.fmt." + (i + 1) + ".text") + "</p></div>").join("") +
      "</div></div></section>" +
      '<section class="section" id="partner-form"><div class="container split">' +
      '<div><div class="eyebrow">Borderless Partnership</div><h2>' + t("ads.partner.title") + '</h2><p class="lead">' + t("ads.partner.sub") + "</p>" +
      '<div class="quick-chips" style="margin-top:20px">' + pIcons.map((ic, i) => '<span class="chip">' + icon(ic) + t("ads.p." + (i + 1)) + "</span>").join("") + "</div></div>" +
      '<div class="card form-card"><h3>' + t("ads.form.title") + '</h3><p class="muted">' + t("ads.form.sub") + "</p>" +
      '<form data-form="partner" novalidate><div class="form-grid">' +
      field("org", t("ads.form.org"), "text", true) +
      '<div class="field"><label for="orgtype">' + t("ads.form.orgtype") + '</label><select class="select" id="orgtype" name="orgtype"><option value="">' + t("form.select") + "</option>" +
      orgTypes.map((o) => '<option value="' + o + '">' + t("ads.form.ot." + o) + "</option>").join("") + "</select></div>" +
      field("name", t("form.name"), "text", true) + field("email", t("form.email"), "email", true) +
      '<div class="field full"><label for="format">' + t("ads.form.format") + '</label><select class="select" id="format" name="format"><option value="">' + t("form.select") + "</option>" +
      formats.map(([v, k]) => '<option value="' + v + '">' + t(k) + "</option>").join("") + "</select></div>" +
      '<div class="field full"><label for="message">' + t("contact.message") + ' *</label><textarea class="textarea" id="message" name="message" required></textarea></div>' +
      formFooter(t("ads.form.submit")) +
      "</div></form></div></div></section>";
  }

  /* ---------- Contact ---------- */

  function pageContact(query) {
    const subjects = ["general", "services", "ambassador", "story", "partner", "support", "other"];
    const pre = subjects.includes(query.get("subject")) ? query.get("subject") : "";
    const row = (href, ic, title, sub, gold) =>
      '<li><a href="' + esc(href) + '"' + ext(href) + '><span class="icon-bubble' + (gold ? " icon-bubble--gold" : "") + '">' + icon(ic) + "</span>" +
      "<span>" + title + "<small>" + sub + "</small></span>" + icon("external", "arrow") + "</a></li>";
    const socials = [["linkedin", "LinkedIn"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"]].filter(([k]) => CONFIG[k]);

    const community = [["whatsappCommunity", "chat", "contact.wa.community", true], ["whatsappChannel", "zap", "contact.wa.channel", false]].filter(([k]) => CONFIG[k]);

    return pageHero(t("contact.title"), t("contact.sub")) +
      '<section class="section--tight" style="padding-top:0;padding-bottom:clamp(56px,8vw,96px)"><div class="container split">' +
      '<div class="card form-card"><h2 style="font-size:1.5rem">' + t("contact.form.title") + "</h2>" +
      '<form data-form="contact" novalidate><div class="form-grid">' +
      field("name", t("form.name"), "text", true) + field("email", t("form.email"), "email", true) +
      '<div class="field full"><label for="subject">' + t("contact.subject") + '</label><select class="select" id="subject" name="subject">' +
      subjects.map((s) => '<option value="' + s + '"' + (pre === s ? " selected" : "") + ">" + t("contact.s." + s) + "</option>").join("") + "</select></div>" +
      '<div class="field full"><label for="message">' + t("contact.message") + ' *</label><textarea class="textarea" id="message" name="message" required></textarea></div>' +
      formFooter(t("contact.submit")) +
      "</div></form></div>" +
      "<div>" +
      (community.length ? "<h3>" + t("contact.community") + '</h3><ul class="contact-links" style="margin:14px 0 28px">' +
        community.map(([k, ic, key, gold]) => row(CONFIG[k], ic, t(key), t(key + ".sub"), gold)).join("") + "</ul>" : "") +
      (socials.length ? "<h3>" + t("contact.social") + '</h3><ul class="contact-links" style="margin:14px 0 28px">' +
        socials.map(([k, label]) => row(CONFIG[k], k, label, "Borderless Foundation")).join("") + "</ul>" : "") +
      (CONFIG.email ? "<h3>" + t("contact.official") + '</h3><ul class="contact-links" style="margin-top:14px">' +
        '<li><a href="mailto:' + esc(CONFIG.email) + '"><span class="icon-bubble">' + icon("mail") + "</span><span>" + esc(CONFIG.email) + "<small>" + t("form.email") + "</small></span></a></li></ul>" : "") +
      "</div></div></section>";
  }

  /* ---------- Forms & search ---------- */

  function bindForms() {
    $main.querySelectorAll("form[data-search]").forEach((form) => form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = form.q.value.trim();
      location.hash = "#/opportunities/search" + (q ? "?q=" + encodeURIComponent(q) : "");
    }));

    $main.querySelectorAll("form[data-form]").forEach((form) => form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const show = formStatus(form);
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.website && form.website.value) return; // spam trap

      const fields = formFields(form);

      if (CONFIG.formEndpoint) {
        const btn = form.querySelector('[type="submit"]');
        btn.disabled = true;
        show("info", t("form.sending"));
        try {
          const payload = { form: form.dataset.form, lang: state.lang };
          fields.forEach((f) => { payload[f.name] = f.value; });
          const res = await fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(res.status);
          form.reset();
          show("ok", t("form.ok"));
        } catch (err) {
          show("error", t("form.error") + reachUs());
        } finally {
          btn.disabled = false;
        }
      } else if (CONFIG.email) {
        mailForm(form, fields);
        show("info", t("form.mailto"));
      } else {
        show("info", t("form.offline") + reachUs());
      }
    }));
  }

  // Shows a message under a form; returns show(kind, html) with kind "ok", "info" or "error".
  function formStatus(form) {
    const status = form.querySelector(".form-status");
    return (kind, html) => {
      status.className = "full form-status is-visible form-status--" + kind;
      status.innerHTML = html;
    };
  }

  // The filled-in fields of a form as [{ name, label, value }], using the visible text of choices.
  function formFields(form) {
    const fields = [];
    form.querySelectorAll("[name]").forEach((el) => {
      if (el.name === "website" || el.type === "file" || !el.value) return;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) return;
      const label = el.dataset.label || (form.querySelector('label[for="' + el.id + '"]') || {}).textContent || el.name;
      const value = el.tagName === "SELECT" ? el.options[el.selectedIndex].text : el.value;
      const same = fields.find((f) => f.name === el.name);
      if (same) same.value += ", " + value;
      else fields.push({ name: el.name, label: label.replace(" *", ""), value });
    });
    return fields;
  }

  // Opens the visitor's e-mail app with the form content ready to send.
  function mailForm(form, fields, extra) {
    const subject = "[Borderless Foundation] " + (form.closest(".card").querySelector("h2, h3") || {}).textContent;
    const body = fields.map((f) => f.label + " : " + f.value).join("\n\n") + (extra ? "\n\n" + extra : "");
    location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  // Other ways to reach the team when a form can't be sent.
  function reachUs() {
    const ways = [];
    if (CONFIG.whatsappCommunity) ways.push('<a href="' + esc(CONFIG.whatsappCommunity) + '" target="_blank" rel="noopener">WhatsApp</a>');
    if (CONFIG.email) ways.push('<a href="mailto:' + esc(CONFIG.email) + '">' + esc(CONFIG.email) + "</a>");
    return ways.length ? " " + ways.join(" · ") : "";
  }

  /* ---------- Router ---------- */

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, qs] = raw.split("?");
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
    return { page: parts[0] || "home", parts: parts.slice(1), id: parts[1] || "", query: new URLSearchParams(qs || "") };
  }

  // Each route: { title(r) -> i18n key, render(r) -> html, bind(r) }.
  const ROUTES = {
    home: { title: () => "meta.title", render: pageHome },
    growth: { title: () => "nav.growth", render: (r) => (r.id ? pageArticle(r.id) : pageGrowth(r.query)), bind: (r) => { if (!r.id) bindGrowth(); } },
    services: { title: () => "nav.services", render: (r) => pageServices(r.query) },
    ecosystem: { title: () => "nav.ecosystem", render: (r) => pageEcosystem(r.query), bind: bindEcosystem },
    advertise: { title: () => "nav.advertise", render: pageAdvertise },
    contact: { title: () => "nav.contact", render: (r) => pageContact(r.query) }
  };

  function render(opts) {
    opts = opts || {};
    const r = parseHash();
    const key = ROUTES[r.page] ? r.page : "home";
    const route = ROUTES[key];
    const scrollY = window.scrollY;

    // Replace the main node so listeners bound to the previous page are dropped.
    const fresh = $main.cloneNode(false);
    $main.replaceWith(fresh);
    $main = fresh;
    BF.main = $main;
    $main.innerHTML = route.render(r);
    if (route.bind) route.bind(r);
    bindForms();

    setActiveNav(key);
    closeMenu();
    document.title = key === "home" ? t("meta.title") : t(route.title(r)) + " · Borderless Foundation";

    if (opts.keepScroll) {
      window.scrollTo({ top: scrollY, behavior: "instant" });
    } else {
      const section = r.query.get("section") || (key === "services" && r.query.get("service") ? "svc-form" : "") || (key === "translation" && (r.query.has("sent") || r.query.get("service")) ? "tr-form" : "");
      const target = section && document.getElementById(section);
      if (target) {
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      if (!opts.initial) $main.focus({ preventScroll: true });
    }
  }

  function setLang(lang) {
    if (!LANGS.includes(lang) || lang === state.lang) return;
    state.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
    document.documentElement.lang = lang;
    document.querySelector(".skip-link").textContent = t("a11y.skip");
    renderHeader();
    renderFooter();
    render({ keepScroll: true });
    const btn = $header.querySelector('[data-lang="' + lang + '"]');
    if (btn) btn.focus();
  }

  function boot() {
    document.documentElement.lang = state.lang;
    document.querySelector(".skip-link").addEventListener("click", (e) => {
      e.preventDefault();
      $main.focus();
    });
    document.querySelector(".skip-link").textContent = t("a11y.skip");
    renderHeader();
    renderFooter();
    render({ initial: true });
    window.addEventListener("hashchange", () => render());
    // Re-check the menu when the window width changes and once the web font has loaded.
    let headerWidth = $header.offsetWidth;
    new ResizeObserver(() => {
      if ($header.offsetWidth === headerWidth) return;
      headerWidth = $header.offsetWidth;
      fitHeader();
    }).observe($header);
    if (document.fonts) document.fonts.ready.then(fitHeader);
  }

  // Shared toolkit for section modules (see opportunities.js).
  const BF = window.BF = {
    state, t, L, esc, normalize, matches, fmtDate, link, ext, icon,
    TYPE_ICON, TYPES, REGIONS, LEVELS,
    daysUntil, deadlineBadge, byDeadline,
    callCard, articleCard, adSlot, pageHero, searchBar, field, formFooter, entityName, downloadButton, whatsappButton,
    formStatus, formFields, mailForm, reachUs,
    routes: ROUTES, render, boot, main: $main
  };
})();
