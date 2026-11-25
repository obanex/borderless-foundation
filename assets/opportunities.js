/*
 * Borderless Opportunities — the Foundation's flagship section.
 * Routes (all under #/opportunities):
 *   ""                    hub
 *   scholarships[/id]     scholarship guide directory and guide pages
 *   calls[/id]            open calls with deadlines
 *   toolkit[/id]          application documents
 *   laureates[/id]        laureate portraits
 *   insights              figures computed from the listings
 *   search?q=             search across the whole section
 */
(function () {
  "use strict";

  const BF = window.BF;
  const { t, L, esc, icon, matches, fmtDate, link } = BF;
  const DATA = window.DATA;
  const GUIDES = window.DATA_SCHOLARSHIPS;
  const TOOLKIT = window.DATA_TOOLKIT;
  const LAUREATES = window.DATA_LAUREATES;
  const DESTS = ["europe", "north-america", "asia", "multi"];
  const GUIDES_PER_PAGE = 6;
  const LAUREATES_PER_PAGE = 8;

  const guideById = (id) => GUIDES.find((g) => g.id === id);
  const openCalls = () => DATA.opportunities.filter((o) => BF.daysUntil(o.deadline) >= 0).sort(BF.byDeadline);
  const main = () => BF.main;

  /* ---------- Shared pieces ---------- */

  const SUBNAV = [
    ["", "opp.nav.overview"],
    ["scholarships", "opp.nav.guides"],
    ["calls", "opp.nav.calls"],
    ["toolkit", "opp.nav.toolkit"],
    ["laureates", "opp.nav.laureates"],
    ["insights", "opp.nav.insights"]
  ];

  function subnav(active) {
    return '<nav class="subnav" aria-label="' + t("opp.nav.label") + '"><div class="container subnav-inner">' +
      '<span class="subnav-brand">' + BF.entityName("Opportunities") + "</span><ul>" +
      SUBNAV.map(([path, key]) =>
        '<li><a href="#/opportunities' + (path ? "/" + path : "") + '"' + (path === active ? ' aria-current="page"' : "") + ">" + t(key) + "</a></li>"
      ).join("") + "</ul></div></nav>";
  }

  function levelsText(levels) {
    return levels.map((l) => t("level." + l)).join(" · ");
  }

  function coverageTag(c) {
    return '<span class="coverage-tag coverage-' + c + '">' + t("coverage." + c) + "</span>";
  }

  function guideCard(g) {
    return '<a class="card guide-card" href="#/opportunities/scholarships/' + g.id + '">' +
      '<div class="guide-top"><span class="guide-country">' + icon("pin") + L(g.country) + "</span>" + coverageTag(g.coverage) + "</div>" +
      "<h3>" + g.name + "</h3><p>" + L(g.tagline) + "</p>" +
      '<div class="card-foot"><span class="read-time">' + icon("layers") + levelsText(g.levels) + "</span>" +
      '<span class="link-arrow">' + t("dir.read") + icon("arrow") + "</span></div></a>";
  }

  function initials(name) {
    return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function avatar(p, big) {
    const hues = ["var(--gold)", "var(--cyan)", "var(--teal-600)", "var(--soft-blue)"];
    const hue = hues[[...p.id].reduce((s, c) => s + c.charCodeAt(0), 0) % hues.length];
    return '<span class="avatar' + (big ? " avatar--big" : "") + '" style="--av:' + hue + '" aria-hidden="true">' + initials(p.name) + "</span>";
  }

  function sampleTag(p) {
    return p.sample ? '<span class="sample-tag">' + icon("info") + t("lau.sample") + "</span>" : "";
  }

  function laureateCard(p) {
    const g = guideById(p.scholarship);
    return '<a class="card laureate-card" href="#/opportunities/laureates/' + p.id + '">' +
      '<div class="laureate-head">' + avatar(p) + "<div><h3>" + esc(p.name) + '</h3><span class="muted">' + L(p.country) + "</span></div></div>" +
      '<div class="laureate-scholarship">' + (g ? g.name : "") + " · " + p.year + "</div>" +
      "<p>" + L(p.programme) + "</p>" +
      '<div class="card-foot">' + sampleTag(p) + '<span class="link-arrow">' + t("lau.read") + icon("arrow") + "</span></div></a>";
  }

  function stats() {
    const countries = new Set(GUIDES.flatMap((g) => g.countries));
    return [
      [GUIDES.length, "stats.guides"],
      [openCalls().length, "stats.calls"],
      [countries.size + "+", "stats.countries"],
      [BF.LEVELS.length, "stats.levels"]
    ];
  }

  function statsBand(withLink) {
    return '<section class="stats-band"><div class="container"><div class="stats-grid">' +
      stats().map(([n, k]) => '<div class="stat"><strong>' + n + "</strong><span>" + t(k) + "</span></div>").join("") +
      "</div>" + (withLink ? '<a class="link-arrow stats-link" href="#/opportunities/insights">' + t("hub.stats.link") + icon("arrow") + "</a>" : "") +
      "</div></section>";
  }

  function levelPicker() {
    return '<div class="level-picker"><h2>' + t("hub.level.title") + "</h2><ul>" +
      BF.LEVELS.map((l) => '<li><a href="#/opportunities/scholarships?level=' + l + '">' + icon("arrow") + "<span>" + t("level." + l) + "</span></a></li>").join("") +
      '</ul><p class="form-note">' + t("hub.level.hint") + "</p></div>";
  }

  function channelBand() {
    return '<div class="cta-band"><div><div class="eyebrow">' + t("hub.channel.eyebrow") + "</div><h2>" + t("hub.channel.title") + "</h2><p>" + t("hub.channel.text") + "</p></div>" +
      '<div class="cta-actions"><a class="btn btn--gold" href="' + esc(link("whatsappChannel")) + '" target="_blank" rel="noopener">' + icon("chat") + t("hub.channel.cta") + "</a></div></div>";
  }

  function freeBlock() {
    return '<div class="free-block"><span class="icon-bubble icon-bubble--gold">' + icon("heart") + "</span><div>" +
      '<div class="eyebrow">' + t("free.eyebrow") + "</div><h2>" + t("free.title") + "</h2><p>" + t("free.text") + "</p>" +
      '<a class="btn btn--ghost" href="#/contact?subject=support">' + t("free.cta") + icon("arrow") + "</a></div></div>";
  }

  function pager(page, pages) {
    if (pages <= 1) return "";
    let html = '<nav class="pager" aria-label="Pagination">' +
      '<button type="button" class="btn btn--ghost btn--sm" data-page="' + (page - 1) + '"' + (page === 1 ? " disabled" : "") + ">" + icon("arrowLeft") + t("dir.prev") + "</button>";
    for (let i = 1; i <= pages; i++) {
      html += '<button type="button" class="pager-num" data-page="' + i + '" aria-label="' + t("dir.page", { n: i }) + '"' + (i === page ? ' aria-current="page"' : "") + ">" + i + "</button>";
    }
    return html + '<button type="button" class="btn btn--ghost btn--sm" data-page="' + (page + 1) + '"' + (page === pages ? " disabled" : "") + ">" + t("dir.next") + icon("arrow") + "</button></nav>";
  }

  function bars(rows) {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return '<div class="bars">' + rows.map(([label, n]) =>
      '<div class="bar-row"><span class="bar-label">' + label + '</span><span class="bar-track"><span class="bar-fill" style="width:' + (n / max * 100).toFixed(1) + '%"></span></span><span class="bar-value">' + n + "</span></div>"
    ).join("") + "</div>";
  }

  function hero(titleA, titleB, sub, side, extra) {
    return '<section class="page-hero"><div class="container hero-grid hero-grid--opp">' +
      '<div class="fade-in"><div class="eyebrow">' + t("hub.eyebrow") + "</div>" +
      "<h1>" + titleA + (titleB ? '<span class="accent">' + titleB + "</span>" : "") + '</h1><p class="lead">' + sub + "</p>" + (extra || "") + "</div>" +
      (side ? '<div class="fade-in">' + side + "</div>" : "") + "</div></section>";
  }

  /* ---------- Hub ---------- */

  function pageHub() {
    const soon = openCalls().slice(0, 3);
    const feature = GUIDES.find((g) => g.featured) || GUIDES[0];
    const tiles = [
      ["europe", "#/opportunities/scholarships?dest=europe"],
      ["asia", "#/opportunities/scholarships?dest=asia"],
      ["bachelor", "#/opportunities/scholarships?level=bachelor"]
    ];
    const steps = [
      ["#/opportunities/scholarships", "compass"],
      ["#/opportunities/toolkit/record", "trending"],
      ["#/opportunities/toolkit", "file"]
    ];

    const side = '<div class="card soon-card"><h3>' + icon("clock") + t("hub.soon.title") + '</h3><ul class="soon-list">' +
      soon.map((o) => '<li><a href="#/opportunities/calls/' + o.id + '"><span>' + L(o.title) + "<small>" + t("type." + o.type) + " · " + t("region." + o.region) + "</small></span>" + BF.deadlineBadge(o.deadline) + "</a></li>").join("") +
      '</ul><a class="link-arrow" href="#/opportunities/calls">' + t("hub.soon.all") + icon("arrow") + "</a></div>";

    return subnav("") +
      hero(t("hub.title.a"), t("hub.title.b"), t("hub.sub"), side,
        BF.searchBar() +
        '<div class="text-links"><a href="#/opportunities/scholarships">' + t("hub.link.guides") + '</a><a href="#/opportunities/toolkit">' + t("hub.link.prepare") + "</a></div>") +
      statsBand(true) +

      '<section class="section"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("hub.which.title") + "</h2><p>" + t("hub.which.sub") + "</p></div></div>" +
      '<div class="guide-mosaic">' +
      (feature ? '<a class="card guide-feature" href="#/opportunities/scholarships/' + feature.id + '">' +
      '<div class="eyebrow">' + t("hub.feature.eyebrow") + " · " + feature.name + "</div>" +
      "<h3>" + L(feature.tagline) + "</h3><p>" + L(feature.overview) + "</p>" +
      '<div class="card-foot"><span class="read-time">' + icon("layers") + levelsText(feature.levels) + '</span><span class="btn btn--gold btn--sm">' + t("hub.feature.cta") + icon("arrow") + "</span></div></a>" : "") +
      tiles.map(([k, href]) =>
        '<a class="card dest-tile" href="' + href + '"><div class="cat-label">' + t("hub.dest." + k + ".eyebrow") + "</div><h3>" + t("hub.dest." + k + ".title") + '</h3><span class="link-arrow">' + t("hub.dest." + k + ".cta") + icon("arrow") + "</span></a>"
      ).join("") +
      "</div></div></section>" +

      '<section class="section--tight"><div class="container split">' +
      "<div>" + levelPicker() + "</div>" +
      "<div><h2>" + t("hub.steps.title") + '</h2><p class="muted">' + t("hub.steps.sub") + "</p>" +
      '<ol class="step-list">' +
      steps.map(([href, ic], i) =>
        '<li><span class="step-index">0' + (i + 1) + "</span><div><h3>" + t("hub.step." + (i + 1) + ".title") + "</h3><p>" + t("hub.step." + (i + 1) + ".text") + "</p>" +
        '<a class="link-arrow" href="' + href + '">' + t("hub.step." + (i + 1) + ".cta") + icon("arrow") + "</a></div></li>"
      ).join("") + "</ol></div>" +
      "</div></section>" +

      '<section class="section section--band"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("hub.calls.title") + "</h2><p>" + t("hub.calls.sub") + "</p></div>" +
      '<a class="link-arrow" href="#/opportunities/calls">' + t("hub.soon.all") + icon("arrow") + "</a></div>" +
      '<div class="grid grid-3">' + openCalls().slice(0, 3).map(BF.callCard).join("") + "</div>" +
      "</div></section>" +

      '<section class="section"><div class="container">' +
      '<div class="section-head"><div><div class="eyebrow">' + t("hub.laureates.eyebrow") + "</div><h2>" + t("hub.laureates.title") + "</h2><p>" + t("hub.laureates.sub") + "</p></div>" +
      '<a class="link-arrow" href="#/opportunities/laureates">' + t("hub.laureates.cta") + icon("arrow") + "</a></div>" +
      '<div class="grid grid-4">' + LAUREATES.slice(0, 4).map(laureateCard).join("") + "</div>" +
      '<div class="grid grid-2" style="margin-top:20px">' + LAUREATES.slice(0, 2).map(quoteCard).join("") + "</div>" +
      "</div></section>" +

      '<section class="section section--band"><div class="container split" style="align-items:center">' +
      '<div><div class="eyebrow">' + t("hub.insights.eyebrow") + "</div><h2>" + t("hub.insights.title") + '</h2><p class="lead">' + t("hub.insights.sub") + "</p>" +
      '<a class="btn btn--ghost" href="#/opportunities/insights">' + t("hub.insights.cta") + icon("arrow") + "</a></div>" +
      '<div class="card"><h3 class="chart-title">' + t("ins.chart.level") + "</h3>" + levelBars() +
      '<p class="form-note">' + t("ins.base", { n: GUIDES.length, what: t("ins.what.guides") }) + "</p></div>" +
      "</div></section>" +

      '<section class="section--tight"><div class="container">' + channelBand() + "</div></section>" +

      '<section class="section"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("hub.partners.title") + "</h2><p>" + t("hub.partners.text") + "</p></div></div>" +
      '<div class="partner-slots">' + [1, 2, 3, 4].map(() => '<a class="partner-slot" href="#/advertise?section=partner-form"><span>' + icon("globe") + t("hub.partners.slot") + "</span></a>").join("") + "</div>" +
      '<div class="hero-actions" style="margin-top:24px"><a class="btn btn--gold" href="#/advertise?section=partner-form">' + t("hub.partners.cta1") + '</a><a class="btn btn--ghost" href="#/contact?subject=support">' + t("hub.partners.cta2") + "</a></div>" +
      "</div></section>" +

      '<section class="section--tight" style="padding-bottom:clamp(56px,8vw,96px)"><div class="container">' + freeBlock() + "</div></section>";
  }

  function quoteCard(p) {
    if (!p) return "";
    const g = guideById(p.scholarship);
    return '<figure class="card quote-card">' + icon("quote", "quote-mark") +
      "<blockquote>" + L(p.quote) + "</blockquote>" +
      '<figcaption>' + avatar(p) + "<span><strong>" + esc(p.name) + "</strong>" + L(p.country) + " · " + (g ? g.name : "") + "</span>" + sampleTag(p) + "</figcaption></figure>";
  }

  /* ---------- Scholarship guide directory ---------- */

  const dir = { q: "", dest: "", level: "", coverage: "", sort: "featured", page: 1 };

  function readDir(query) {
    dir.q = query.get("q") || "";
    dir.dest = DESTS.includes(query.get("dest")) ? query.get("dest") : "";
    dir.level = BF.LEVELS.includes(query.get("level")) ? query.get("level") : "";
    dir.coverage = ["full", "partial"].includes(query.get("coverage")) ? query.get("coverage") : "";
    dir.sort = ["featured", "az", "dest"].includes(query.get("sort")) ? query.get("sort") : "featured";
    dir.page = Math.max(1, parseInt(query.get("page"), 10) || 1);
  }

  function filteredGuides() {
    const list = GUIDES.filter((g) =>
      (!dir.dest || g.dest === dir.dest) &&
      (!dir.level || g.levels.includes(dir.level)) &&
      (!dir.coverage || g.coverage === dir.coverage) &&
      matches(dir.q, [g.name, g.country.fr, g.country.en, g.tagline.fr, g.tagline.en, g.funder.fr, g.funder.en, t("dest." + g.dest)])
    );
    if (dir.sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (dir.sort === "dest") list.sort((a, b) => DESTS.indexOf(a.dest) - DESTS.indexOf(b.dest) || a.name.localeCompare(b.name));
    else list.sort((a, b) => (b.featured === true) - (a.featured === true));
    return list;
  }

  function dirResultsHtml() {
    const list = filteredGuides();
    const pages = Math.max(1, Math.ceil(list.length / GUIDES_PER_PAGE));
    dir.page = Math.min(dir.page, pages);
    const slice = list.slice((dir.page - 1) * GUIDES_PER_PAGE, dir.page * GUIDES_PER_PAGE);
    const count = t(list.length === 1 ? "dir.count.one" : "dir.count.many", { n: list.length });
    return '<div class="results-bar"><strong style="color:var(--white)">' + count + "</strong></div>" +
      (slice.length ? '<div class="grid grid-3">' + slice.map(guideCard).join("") + "</div>" + pager(dir.page, pages)
        : '<div class="empty-state"><span class="icon-bubble">' + icon("search") + "</span><h3>" + t("dir.empty") + '</h3><button type="button" class="btn btn--ghost btn--sm" data-reset>' + t("opp.filter.reset") + "</button></div>");
  }

  function pageDirectory(query) {
    readDir(query);
    const opt = (name, values, prefix) =>
      '<select class="select" id="d-' + name + '" name="' + name + '"><option value="">' + t("opp.filter.all") + "</option>" +
      values.map((v) => '<option value="' + v + '"' + (dir[name] === v ? " selected" : "") + ">" + t(prefix + v) + "</option>").join("") + "</select>";
    const filtersOpen = !!(dir.dest || dir.level || dir.coverage || dir.sort !== "featured");
    const docs = TOOLKIT.docs.slice(0, 4);

    return subnav("scholarships") +
      hero(t("dir.title"), "", t("dir.sub"), levelPicker(),
        '<div class="hero-actions"><a class="btn btn--gold" href="#/opportunities/scholarships?section=explore">' + t("dir.explore") + '</a><a class="btn btn--ghost" href="#/opportunities/toolkit">' + t("hub.link.prepare") + "</a></div>") +

      '<section class="section--tight" id="explore"><div class="container">' +
      '<div class="section-head"><h2>' + t("dir.explore") + "</h2><p>" + t("dir.explore.sub") + "</p></div>" +
      '<form class="dir-search" role="search" onsubmit="return false">' +
      '<div class="search-bar search-bar--flat">' + icon("search") +
      '<label class="visually-hidden" for="d-q">' + t("hub.search.label") + "</label>" +
      '<input id="d-q" name="q" type="search" placeholder="' + t("dir.search.ph") + '" value="' + esc(dir.q) + '">' +
      '<button type="button" class="btn btn--ghost filter-toggle" aria-expanded="' + filtersOpen + '" aria-controls="dir-filters">' + icon("sliders") + '<span class="filter-toggle-label">' + t("dir.filters") + "</span></button></div>" +
      '<div class="filters filters--panel" id="dir-filters"' + (filtersOpen ? "" : " hidden") + ">" +
      '<div class="field"><label for="d-dest">' + t("dir.f.dest") + "</label>" + opt("dest", DESTS, "dest.") + "</div>" +
      '<div class="field"><label for="d-level">' + t("dir.f.level") + "</label>" + opt("level", BF.LEVELS, "level.") + "</div>" +
      '<div class="field"><label for="d-coverage">' + t("dir.f.coverage") + "</label>" + opt("coverage", ["full", "partial"], "coverage.") + "</div>" +
      '<div class="field"><label for="d-sort">' + t("dir.sort") + '</label><select class="select" id="d-sort" name="sort">' +
      ["featured", "az", "dest"].map((s) => '<option value="' + s + '"' + (dir.sort === s ? " selected" : "") + ">" + t("dir.sort." + s) + "</option>").join("") + "</select></div>" +
      '<button type="button" class="btn btn--ghost" data-reset>' + t("opp.filter.reset") + "</button>" +
      "</div></form>" +
      '<div id="dir-results" aria-live="polite">' + dirResultsHtml() + "</div>" +
      "</div></section>" +

      '<section class="section section--band"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("dir.choose.title") + "</h2><p>" + t("dir.choose.sub") + "</p></div></div>" +
      '<div class="grid grid-2">' +
      ["record", "project"].map((id) => {
        const d = TOOLKIT.docs.find((x) => x.id === id);
        return '<a class="card dest-tile" href="#/opportunities/toolkit/' + d.id + '"><div class="cat-label">' + L(d.role) + "</div><h3>" + L(d.title) + "</h3><p>" + L(d.intro) + '</p><span class="link-arrow">' + t("tk.open") + icon("arrow") + "</span></a>";
      }).join("") +
      "</div></div></section>" +

      '<section class="section"><div class="container split" style="align-items:center">' +
      "<div><h2>" + t("dir.after.title") + '</h2><p class="lead">' + t("dir.after.text") + '</p><a class="btn btn--gold" href="#/opportunities/toolkit">' + t("dir.after.cta") + icon("arrow") + "</a></div>" +
      '<ul class="doc-list">' + docs.map((d) => '<li><a href="#/opportunities/toolkit/' + d.id + '">' + icon(d.icon) + L(d.title) + icon("arrow", "doc-arrow") + "</a></li>").join("") + "</ul>" +
      "</div></section>" +
      '<section class="section--tight" style="padding-bottom:clamp(56px,8vw,96px)"><div class="container">' + channelBand() + "</div></section>";
  }

  function bindDirectory() {
    const $m = main();
    const panel = document.getElementById("dir-filters");
    const toggle = $m.querySelector(".filter-toggle");
    const refresh = (scroll) => {
      document.getElementById("dir-results").innerHTML = dirResultsHtml();
      const qs = new URLSearchParams();
      ["q", "dest", "level", "coverage"].forEach((k) => { if (dir[k]) qs.set(k, dir[k]); });
      if (dir.sort !== "featured") qs.set("sort", dir.sort);
      if (dir.page > 1) qs.set("page", dir.page);
      history.replaceState(null, "", "#/opportunities/scholarships" + (qs.toString() ? "?" + qs : ""));
      if (scroll) document.getElementById("explore").scrollIntoView({ block: "start" });
    };
    toggle.addEventListener("click", () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.getElementById("d-q").addEventListener("input", (e) => { dir.q = e.target.value; dir.page = 1; refresh(); });
    ["dest", "level", "coverage", "sort"].forEach((k) =>
      document.getElementById("d-" + k).addEventListener("change", (e) => { dir[k] = e.target.value || (k === "sort" ? "featured" : ""); dir.page = 1; refresh(); }));
    $m.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("[data-page]");
      if (pageBtn && !pageBtn.disabled) { dir.page = parseInt(pageBtn.dataset.page, 10); refresh(true); return; }
      if (!e.target.closest("[data-reset]")) return;
      Object.assign(dir, { q: "", dest: "", level: "", coverage: "", sort: "featured", page: 1 });
      ["q", "dest", "level", "coverage"].forEach((k) => { document.getElementById("d-" + k).value = ""; });
      document.getElementById("d-sort").value = "featured";
      refresh();
    });
  }

  /* ---------- Scholarship guide page ---------- */

  function pageGuide(id) {
    const g = guideById(id);
    const back = '<a class="breadcrumb" href="#/opportunities/scholarships">' + icon("arrowLeft") + t("guide.back") + "</a>";
    if (!g) return subnav("scholarships") + BF.pageHero(t("opp.nav.guides"), t("guide.notfound"), back);

    const sections = [
      ["g-overview", "guide.overview", "<p>" + L(g.overview) + "</p>"],
      ["g-benefits", "guide.benefits", '<ul class="check-list check-list--gold">' + L(g.benefits).map((x) => "<li>" + x + "</li>").join("") + "</ul>"],
      ["g-eligibility", "guide.eligibility", '<ul class="check-list">' + L(g.eligibility).map((x) => "<li>" + x + "</li>").join("") + "</ul>"],
      ["g-calendar", "guide.calendar", '<ol class="timeline">' + g.timeline.map((s) => '<li><span class="timeline-when">' + L(s.when) + "</span><span>" + L(s.what) + "</span></li>").join("") + "</ol>"],
      ["g-steps", "guide.steps", '<ol class="numbered-steps">' + L(g.steps).map((s, i) => '<li><span class="step-index">' + (i + 1) + "</span><span>" + s + "</span></li>").join("") + "</ol>"]
    ];
    if (g.faq.length) {
      sections.push(["g-faq", "guide.faq", '<div class="faq">' + g.faq.map((f) => "<details><summary>" + L(f.q) + icon("chevronDown") + "</summary><p>" + L(f.a) + "</p></details>").join("") + "</div>"]);
    }
    const fact = (ic, label, value) => '<li><span class="icon-bubble">' + icon(ic) + "</span><div><small>" + label + "</small><strong>" + value + "</strong></div></li>";
    const laureates = LAUREATES.filter((p) => p.scholarship === g.id);
    const related = GUIDES.filter((x) => x.id !== g.id && (x.dest === g.dest || x.levels.some((l) => g.levels.includes(l))))
      .sort((a, b) => (b.dest === g.dest) - (a.dest === g.dest)).slice(0, 3);

    return subnav("scholarships") +
      '<section class="page-hero"><div class="container fade-in">' + back +
      '<div class="tag-row"><span class="type-tag">' + icon("pin") + L(g.country) + "</span>" + coverageTag(g.coverage) + '<span class="type-tag">' + icon("layers") + levelsText(g.levels) + "</span></div>" +
      "<h1>" + g.name + '</h1><p class="lead">' + L(g.tagline) + "</p></div></section>" +

      '<section class="section--tight" style="padding-top:0"><div class="container detail-grid">' +
      '<div class="prose guide-body">' +
      '<div class="glance card"><h2>' + t("guide.glance") + '</h2><ul class="detail-facts glance-facts">' +
      fact("award", t("guide.f.funder"), L(g.funder)) +
      fact("pin", t("guide.f.country"), L(g.country)) +
      fact("layers", t("guide.f.levels"), levelsText(g.levels)) +
      fact("cap", t("guide.f.coverage"), t("coverage." + g.coverage)) +
      fact("compass", t("guide.f.route"), L(g.route)) +
      fact("calendar", t("guide.f.window"), L(g.window)) +
      "</ul></div>" +
      sections.map(([sid, key, body]) => '<section id="' + sid + '" class="guide-section"><h2>' + t(key) + "</h2>" + body + "</section>").join("") +
      '<p class="notice">' + icon("info") + t("guide.verify") + "</p>" +
      "</div>" +
      '<aside class="sticky-side">' +
      '<div class="card"><h3>' + t("guide.toc") + '</h3><ul class="toc">' +
      sections.map(([sid, key]) => '<li><button type="button" data-goto="' + sid + '">' + t(key) + "</button></li>").join("") + "</ul>" +
      '<a class="btn btn--gold btn--block" style="margin-top:18px" href="' + esc(g.link) + '" target="_blank" rel="noopener">' + t("guide.official") + icon("external") + "</a></div>" +
      '<div class="card"><span class="icon-bubble icon-bubble--gold" style="margin-bottom:14px">' + icon("compass") + "</span>" +
      "<h3>" + t("opp.help.title") + "</h3><p>" + t("opp.help.text") + '</p><a class="link-arrow" href="#/services?service=cv">' + t("guide.next.help") + icon("arrow") + "</a></div>" +
      "</aside></div></section>" +

      '<section class="section--tight"><div class="container"><div class="cta-band"><div><div class="eyebrow">' + t("guide.next.eyebrow") + "</div><h2>" + t("guide.next.title") + "</h2><p>" + t("guide.next.text") + "</p></div>" +
      '<div class="cta-actions"><a class="btn btn--gold" href="#/opportunities/toolkit">' + t("guide.next.cta") + '</a><a class="btn btn--ghost" href="#/services?service=cv">' + t("guide.next.help") + "</a></div></div></div></section>" +

      (laureates.length ? '<section class="section--tight"><div class="container"><div class="section-head"><h2>' + t("guide.laureates") + '</h2></div><div class="grid grid-4">' + laureates.map(laureateCard).join("") + "</div></div></section>" : "") +
      '<section class="section"><div class="container"><div class="section-head"><h2>' + t("guide.related") + '</h2><a class="link-arrow" href="#/opportunities/scholarships">' + t("guide.back") + icon("arrow") + '</a></div><div class="grid grid-3">' +
      related.map(guideCard).join("") + "</div></div></section>";
  }

  function bindGuide() {
    main().querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => {
      const target = document.getElementById(b.dataset.goto);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  /* ---------- Open calls ---------- */

  const calls = BF.state.oppFilters;

  function filteredCalls() {
    return DATA.opportunities.filter((o) =>
      (!calls.type || o.type === calls.type) &&
      (!calls.region || o.region === calls.region) &&
      (!calls.level || o.levels.includes(calls.level)) &&
      matches(calls.q, [o.title.fr, o.title.en, o.org.fr, o.org.en, o.summary.fr, o.summary.en,
        window.I18N.fr["region." + o.region], window.I18N.en["region." + o.region], window.I18N.fr["type." + o.type], window.I18N.en["type." + o.type]])
    ).sort(BF.byDeadline);
  }

  function callResultsHtml() {
    const list = filteredCalls();
    const count = t(list.length === 1 ? "opp.count.one" : "opp.count.many", { n: list.length });
    const body = list.length
      ? '<div class="grid grid-3">' + list.map(BF.callCard).join("") + "</div>"
      : '<div class="empty-state"><span class="icon-bubble">' + icon("search") + "</span><h3>" + t("opp.empty.title") + "</h3><p>" + t("opp.empty.text") + "</p>" +
        '<button type="button" class="btn btn--ghost btn--sm" data-reset>' + t("opp.filter.reset") + "</button></div>";
    return '<div class="results-bar"><strong style="color:var(--white)">' + count + "</strong><span>" + t("opp.sort") + "</span></div>" + body;
  }

  function pageCalls(query) {
    calls.q = query.get("q") || "";
    calls.type = BF.TYPES.includes(query.get("type")) ? query.get("type") : "";
    calls.region = BF.REGIONS.includes(query.get("region")) ? query.get("region") : "";
    calls.level = BF.LEVELS.includes(query.get("level")) ? query.get("level") : "";

    const select = (name, values, prefix) =>
      '<select class="select" id="f-' + name + '" name="' + name + '"><option value="">' + t("opp.filter.all") + "</option>" +
      values.map((v) => '<option value="' + v + '"' + (calls[name] === v ? " selected" : "") + ">" + t(prefix + v) + "</option>").join("") + "</select>";

    return subnav("calls") + BF.pageHero(t("calls.title"), t("calls.sub")) +
      '<section class="section--tight" style="padding-top:0"><div class="container">' +
      '<div class="type-pills" role="group" aria-label="' + t("opp.filter.type") + '">' +
      '<button type="button" data-type="" aria-pressed="' + !calls.type + '">' + icon("globe") + t("opp.filter.all") + "</button>" +
      BF.TYPES.map((ty) => '<button type="button" data-type="' + ty + '" aria-pressed="' + (calls.type === ty) + '">' + icon(BF.TYPE_ICON[ty]) + t("types." + ty) + "</button>").join("") +
      "</div>" +
      '<form class="filters" role="search" onsubmit="return false">' +
      '<div class="field field--search"><label for="f-q">' + t("opp.search") + '</label><div class="input-icon">' + icon("search") +
      '<input class="input" id="f-q" name="q" type="search" placeholder="' + t("opp.search.ph") + '" value="' + esc(calls.q) + '"></div></div>' +
      '<div class="field"><label for="f-region">' + t("opp.filter.region") + "</label>" + select("region", BF.REGIONS, "region.") + "</div>" +
      '<div class="field"><label for="f-level">' + t("opp.filter.level") + "</label>" + select("level", BF.LEVELS, "level.") + "</div>" +
      '<button type="button" class="btn btn--ghost" data-reset>' + t("opp.filter.reset") + "</button>" +
      "</form>" +
      '<div id="opp-results" aria-live="polite">' + callResultsHtml() + "</div>" +
      "</div></section>" +
      '<section class="section--tight" style="padding-bottom:clamp(56px,8vw,96px)"><div class="container">' + channelBand() + "</div></section>";
  }

  function bindCalls() {
    const $m = main();
    const refresh = () => {
      document.getElementById("opp-results").innerHTML = callResultsHtml();
      $m.querySelectorAll("[data-type]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === calls.type)));
      const qs = new URLSearchParams();
      ["type", "region", "level", "q"].forEach((k) => { if (calls[k]) qs.set(k, calls[k]); });
      history.replaceState(null, "", "#/opportunities/calls" + (qs.toString() ? "?" + qs : ""));
    };
    $m.querySelectorAll("[data-type]").forEach((b) => b.addEventListener("click", () => { calls.type = b.dataset.type; refresh(); }));
    document.getElementById("f-q").addEventListener("input", (e) => { calls.q = e.target.value; refresh(); });
    ["region", "level"].forEach((k) => document.getElementById("f-" + k).addEventListener("change", (e) => { calls[k] = e.target.value; refresh(); }));
    $m.addEventListener("click", (e) => {
      if (!e.target.closest("[data-reset]")) return;
      Object.assign(calls, { q: "", type: "", region: "", level: "" });
      ["q", "region", "level"].forEach((k) => { document.getElementById("f-" + k).value = ""; });
      refresh();
    });
  }

  function pageCall(id) {
    const o = DATA.opportunities.find((x) => x.id === id);
    const back = '<a class="breadcrumb" href="#/opportunities/calls">' + icon("arrowLeft") + t("opp.back") + "</a>";
    if (!o) return subnav("calls") + BF.pageHero(t("calls.title"), t("opp.notfound"), back);

    const related = DATA.opportunities.filter((x) => x.id !== o.id && (x.type === o.type || x.region === o.region)).sort(BF.byDeadline).slice(0, 3);
    const fact = (ic, label, value) => '<li><span class="icon-bubble">' + icon(ic) + "</span><div><small>" + label + "</small><strong>" + value + "</strong></div></li>";
    const closed = BF.daysUntil(o.deadline) < 0;

    return subnav("calls") +
      '<section class="page-hero type-' + o.type + '"><div class="container fade-in">' + back +
      '<div class="tag-row"><span class="type-tag">' + icon(BF.TYPE_ICON[o.type]) + t("type." + o.type) + "</span>" + BF.deadlineBadge(o.deadline) + "</div>" +
      "<h1>" + L(o.title) + '</h1><p class="lead">' + L(o.org) + "</p></div></section>" +
      '<section class="section--tight" style="padding-top:0"><div class="container detail-grid">' +
      '<div class="prose"><h2>' + t("opp.about") + "</h2><p>" + L(o.summary) + "</p>" +
      "<h2>" + t("opp.eligibility") + '</h2><ul class="check-list">' + L(o.eligibility).map((x) => "<li>" + x + "</li>").join("") + "</ul>" +
      "<h2>" + t("opp.benefits") + '</h2><ul class="check-list check-list--gold">' + L(o.benefits).map((x) => "<li>" + x + "</li>").join("") + "</ul></div>" +
      '<aside class="sticky-side"><div class="card"><ul class="detail-facts">' +
      fact("calendar", t("opp.fact.deadline"), fmtDate(o.deadline)) +
      fact("award", t("opp.fact.funding"), L(o.funding)) +
      fact("pin", t("opp.fact.region"), t("region." + o.region)) +
      fact("layers", t("opp.fact.level"), o.levels.map((l) => t("level." + l)).join(", ")) +
      "</ul>" +
      '<a class="btn btn--gold btn--block" style="margin-top:22px" href="' + esc(o.link || window.CONFIG.linktree) + '" target="_blank" rel="noopener"' + (closed ? ' aria-disabled="true"' : "") + ">" +
      t("opp.apply") + icon("external") + "</a>" +
      '<p class="form-note center" style="margin-top:10px">' + t("opp.apply.note") + "</p></div>" +
      '<div class="card"><span class="icon-bubble icon-bubble--gold" style="margin-bottom:14px">' + icon("compass") + "</span>" +
      "<h3>" + t("opp.help.title") + "</h3><p>" + t("opp.help.text") + "</p>" +
      '<a class="link-arrow" href="#/services">' + t("opp.help.cta") + icon("arrow") + "</a></div></aside>" +
      "</div></section>" +
      (related.length ? '<section class="section"><div class="container"><div class="section-head"><h2>' + t("opp.related") + '</h2></div><div class="grid grid-3">' + related.map(BF.callCard).join("") + "</div></div></section>" : "");
  }

  /* ---------- Application toolkit ---------- */

  function pageToolkit() {
    return subnav("toolkit") +
      hero(t("tk.title"), "", t("tk.sub"), "",
        '<div class="hero-actions"><a class="btn btn--gold" href="#/opportunities/toolkit?section=docs">' + t("tk.choose") + '</a><a class="btn btn--ghost" href="#/opportunities/toolkit?section=collection">' + t("tk.collection.link") + "</a></div>") +

      '<section class="section--tight" style="padding-top:0"><div class="container">' +
      "<h2>" + t("tk.angles") + "</h2>" +
      '<div class="angles">' + TOOLKIT.docs.map((d, i) =>
        '<a class="angle" href="#/opportunities/toolkit/' + d.id + '"><span class="step-index">0' + (i + 1) + "</span><strong>" + L(d.title) + "</strong><small>" + L(d.role) + "</small></a>"
      ).join("") + "</div>" +
      '<p class="form-note" style="margin-top:14px">' + t("tk.adapt") + "</p></div></section>" +

      '<section class="section section--band" id="docs"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("tk.roles.title") + "</h2><p>" + t("tk.roles.sub") + "</p></div></div>" +
      '<div class="grid grid-2">' + TOOLKIT.docs.map((d) =>
        '<div class="card doc-card"><div class="entity-head"><span class="icon-bubble icon-bubble--gold">' + icon(d.icon) + "</span><div><h3 class=\"mb-0\">" + L(d.title) + '</h3><span class="muted">' + L(d.role) + "</span></div></div>" +
        "<p>" + L(d.intro) + '</p><div class="parts">' + L(d.parts).map((p, i) => '<span class="part"><b>' + (i + 1) + "</b>" + p + "</span>").join("") + "</div>" +
        '<div class="card-foot"><a class="btn btn--teal btn--sm" href="#/opportunities/toolkit/' + d.id + '">' + t("tk.open") + icon("arrow") + "</a></div></div>"
      ).join("") + "</div></div></section>" +

      '<section class="section" id="collection"><div class="container split">' +
      '<div><div class="eyebrow">' + t("tk.collection.eyebrow") + "</div><h2>" + t("tk.collection.title") + '</h2><p class="lead">' + t("tk.collection.sub") + "</p></div>" +
      '<div><ol class="collection">' + TOOLKIT.collection.map((c, i) =>
        '<li><span class="step-index">0' + (i + 1) + "</span><div><strong>" + L(c.title) + "</strong><small>" + L(c.text) + "</small></div>" +
        (c.route ? '<a class="btn btn--ghost btn--sm" href="' + c.route + '">' + t("dir.read") + "</a>" : BF.downloadButton(c.file)) + "</li>"
      ).join("") + '</ol><p class="form-note" style="margin-top:12px">' + t("tk.collection.more") + "</p></div>" +
      "</div></section>" +

      '<section class="section--tight"><div class="container"><div class="section-head"><div><div class="eyebrow">' + t("hub.laureates.eyebrow") + "</div><h2>" + t("hub.laureates.title") + '</h2></div><a class="link-arrow" href="#/opportunities/laureates">' + t("hub.laureates.cta") + icon("arrow") + "</a></div>" +
      '<div class="grid grid-3">' + LAUREATES.slice(2, 5).map(quoteCard).join("") + "</div></div></section>" +

      '<section class="section--tight" style="padding-bottom:clamp(56px,8vw,96px)"><div class="container">' + freeBlock() + "</div></section>";
  }

  function pageDoc(id) {
    const d = TOOLKIT.docs.find((x) => x.id === id);
    const back = '<a class="breadcrumb" href="#/opportunities/toolkit">' + icon("arrowLeft") + t("tk.back") + "</a>";
    if (!d) return subnav("toolkit") + BF.pageHero(t("opp.nav.toolkit"), t("tk.notfound"), back);
    const index = TOOLKIT.docs.indexOf(d);
    const others = TOOLKIT.docs.filter((x) => x !== d);

    return subnav("toolkit") +
      '<section class="page-hero"><div class="container fade-in">' + back +
      '<div class="cat-label">0' + (index + 1) + " · " + L(d.role) + "</div>" +
      "<h1>" + L(d.title) + '</h1><p class="lead">' + L(d.intro) + "</p>" +
      '<div class="parts">' + L(d.parts).map((p, i) => '<span class="part"><b>' + (i + 1) + "</b>" + p + "</span>").join("") + "</div></div></section>" +
      '<section class="section--tight" style="padding-top:0"><div class="container detail-grid">' +
      '<div class="prose"><h2>' + t("tk.include") + '</h2><ul class="check-list">' + L(d.include).map((x) => "<li>" + x + "</li>").join("") + "</ul>" +
      "<h2>" + t("tk.tips") + '</h2><ul class="check-list check-list--gold">' + L(d.tips).map((x) => "<li>" + x + "</li>").join("") + "</ul>" +
      "<h2>" + t("tk.mistakes") + '</h2><ul class="cross-list">' + L(d.mistakes).map((x) => "<li>" + x + "</li>").join("") + "</ul></div>" +
      '<aside class="sticky-side"><div class="card"><span class="icon-bubble icon-bubble--gold" style="margin-bottom:14px">' + icon("pen") + "</span>" +
      "<h3>" + t("tk.review.title") + "</h3><p>" + t("tk.review.text") + '</p><a class="btn btn--gold btn--block" href="#/services?service=cv">' + t("tk.review.cta") + icon("arrow") + "</a></div>" +
      '<div class="card"><h3>' + t("tk.other") + '</h3><ul class="doc-list doc-list--compact">' +
      others.map((x) => '<li><a href="#/opportunities/toolkit/' + x.id + '">' + icon(x.icon) + L(x.title) + icon("arrow", "doc-arrow") + "</a></li>").join("") +
      "</ul></div></aside></div></section>" +
      '<section class="section--tight" style="padding-bottom:clamp(56px,8vw,96px)"><div class="container">' + channelBand() + "</div></section>";
  }

  /* ---------- Laureates ---------- */

  const lau = { q: "", scholarship: "", country: "", year: "", page: 1 };

  function readLau(query) {
    lau.q = query.get("q") || "";
    lau.scholarship = query.get("scholarship") || "";
    lau.country = query.get("country") || "";
    lau.year = query.get("year") || "";
    lau.page = Math.max(1, parseInt(query.get("page"), 10) || 1);
  }

  function filteredLaureates() {
    return LAUREATES.filter((p) => {
      const g = guideById(p.scholarship);
      return (!lau.scholarship || p.scholarship === lau.scholarship) &&
        (!lau.country || p.country.en === lau.country) &&
        (!lau.year || String(p.year) === lau.year) &&
        matches(lau.q, [p.name, p.country.fr, p.country.en, p.programme.fr, p.programme.en, g ? g.name : ""]);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  function lauResultsHtml() {
    const list = filteredLaureates();
    const pages = Math.max(1, Math.ceil(list.length / LAUREATES_PER_PAGE));
    lau.page = Math.min(lau.page, pages);
    const slice = list.slice((lau.page - 1) * LAUREATES_PER_PAGE, lau.page * LAUREATES_PER_PAGE);
    const count = t(list.length === 1 ? "lau.count.one" : "lau.count.many", { n: list.length });
    return '<div class="results-bar"><strong style="color:var(--white)">' + count + "</strong></div>" +
      (slice.length ? '<div class="grid grid-4">' + slice.map(laureateCard).join("") + "</div>" + pager(lau.page, pages)
        : '<div class="empty-state"><span class="icon-bubble">' + icon("search") + "</span><h3>" + t("lau.empty") + '</h3><button type="button" class="btn btn--ghost btn--sm" data-reset>' + t("opp.filter.reset") + "</button></div>");
  }

  function pageLaureates(query) {
    readLau(query);
    const uniq = (arr) => [...new Set(arr)];
    const schol = uniq(LAUREATES.map((p) => p.scholarship)).map(guideById).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    const countries = uniq(LAUREATES.map((p) => p.country.en)).sort();
    const years = uniq(LAUREATES.map((p) => String(p.year))).sort().reverse();
    const countryLabel = (en) => L((LAUREATES.find((p) => p.country.en === en) || {}).country) || en;
    const sel = (name, options) =>
      '<select class="select" id="l-' + name + '" name="' + name + '"><option value="">' + t("opp.filter.all") + "</option>" +
      options.map(([v, label]) => '<option value="' + esc(v) + '"' + (lau[name] === v ? " selected" : "") + ">" + esc(label) + "</option>").join("") + "</select>";

    return subnav("laureates") +
      hero(t("lau.title"), "", t("lau.sub"), '<div class="grid">' + LAUREATES.slice(0, 1).map(quoteCard).join("") + "</div>") +
      '<section class="section--tight" style="padding-top:0"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("lau.find.title") + "</h2><p>" + t("lau.find.sub") + "</p></div></div>" +
      '<form class="filters" role="search" onsubmit="return false" style="--cols:3">' +
      '<div class="field field--search"><label for="l-q">' + t("opp.search") + '</label><div class="input-icon">' + icon("search") +
      '<input class="input" id="l-q" name="q" type="search" placeholder="' + t("lau.search.ph") + '" value="' + esc(lau.q) + '"></div></div>' +
      '<div class="field"><label for="l-scholarship">' + t("lau.f.scholarship") + "</label>" + sel("scholarship", schol.map((g) => [g.id, g.name])) + "</div>" +
      '<div class="field"><label for="l-country">' + t("lau.f.country") + "</label>" + sel("country", countries.map((c) => [c, countryLabel(c)])) + "</div>" +
      '<div class="field"><label for="l-year">' + t("lau.f.year") + "</label>" + sel("year", years.map((y) => [y, y])) + "</div>" +
      '<button type="button" class="btn btn--ghost" data-reset>' + t("opp.filter.reset") + "</button>" +
      "</form>" +
      '<div id="lau-results" aria-live="polite">' + lauResultsHtml() + "</div>" +
      "</div></section>" +
      '<section class="section section--band"><div class="container split" style="align-items:center">' +
      '<div><div class="eyebrow">' + t("lau.community.eyebrow") + "</div><h2>" + t("lau.community.title") + '</h2><p class="lead">' + t("lau.community.text") + "</p></div>" +
      '<div class="card"><span class="icon-bubble icon-bubble--gold" style="margin-bottom:14px">' + icon("award") + "</span><h3>" + t("lau.share.title") + "</h3><p>" + t("lau.share.text") + "</p>" +
      '<a class="btn btn--gold" href="#/contact?subject=story">' + t("lau.share.cta") + icon("arrow") + "</a></div>" +
      "</div></section>";
  }

  function bindLaureates() {
    const $m = main();
    const fields = ["scholarship", "country", "year"];
    const refresh = (scroll) => {
      document.getElementById("lau-results").innerHTML = lauResultsHtml();
      const qs = new URLSearchParams();
      ["q"].concat(fields).forEach((k) => { if (lau[k]) qs.set(k, lau[k]); });
      if (lau.page > 1) qs.set("page", lau.page);
      history.replaceState(null, "", "#/opportunities/laureates" + (qs.toString() ? "?" + qs : ""));
      if (scroll) document.getElementById("lau-results").scrollIntoView({ block: "start" });
    };
    document.getElementById("l-q").addEventListener("input", (e) => { lau.q = e.target.value; lau.page = 1; refresh(); });
    fields.forEach((k) => document.getElementById("l-" + k).addEventListener("change", (e) => { lau[k] = e.target.value; lau.page = 1; refresh(); }));
    $m.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("[data-page]");
      if (pageBtn && !pageBtn.disabled) { lau.page = parseInt(pageBtn.dataset.page, 10); refresh(true); return; }
      if (!e.target.closest("[data-reset]")) return;
      Object.assign(lau, { q: "", scholarship: "", country: "", year: "", page: 1 });
      ["q"].concat(fields).forEach((k) => { document.getElementById("l-" + k).value = ""; });
      refresh();
    });
  }

  function pageLaureate(id) {
    const p = LAUREATES.find((x) => x.id === id);
    const back = '<a class="breadcrumb" href="#/opportunities/laureates">' + icon("arrowLeft") + t("lau.back") + "</a>";
    if (!p) return subnav("laureates") + BF.pageHero(t("lau.title"), t("lau.notfound"), back);
    const g = guideById(p.scholarship);
    const fact = (ic, label, value) => '<li><span class="icon-bubble">' + icon(ic) + "</span><div><small>" + label + "</small><strong>" + value + "</strong></div></li>";
    const more = LAUREATES.filter((x) => x.id !== p.id).slice(0, 4);

    return subnav("laureates") +
      '<section class="page-hero"><div class="container fade-in">' + back +
      '<div class="portrait-head">' + avatar(p, true) + "<div>" + sampleTag(p) +
      "<h1>" + esc(p.name) + '</h1><p class="lead mb-0">' + (g ? g.name : "") + " · " + L(p.country) + "</p></div></div></div></section>" +
      '<section class="section--tight" style="padding-top:0"><div class="container detail-grid">' +
      '<div class="prose"><figure class="pull-quote">' + icon("quote", "quote-mark") + "<blockquote>" + L(p.quote) + "</blockquote></figure>" +
      "<h2>" + t("lau.interview") + "</h2>" +
      L(p.answers).map((a, i) => '<div class="qa"><h3>' + t("lau.q" + (i + 1)) + "</h3><p>" + a + "</p></div>").join("") +
      "</div>" +
      '<aside class="sticky-side"><div class="card"><ul class="detail-facts">' +
      (g ? fact("award", t("lau.f.scholarship"), g.name) : "") +
      fact("cap", t("lau.programme"), L(p.programme)) +
      fact("pin", t("lau.f.country"), L(p.country)) +
      fact("calendar", t("lau.year"), p.year) +
      "</ul>" +
      (g ? '<a class="btn btn--gold btn--block" style="margin-top:20px" href="#/opportunities/scholarships/' + g.id + '">' + t("lau.guide") + icon("arrow") + "</a>" : "") +
      "</div></aside></div></section>" +
      '<section class="section"><div class="container"><div class="section-head"><h2>' + t("lau.more") + '</h2></div><div class="grid grid-4">' +
      more.map(laureateCard).join("") + "</div></div></section>";
  }

  /* ---------- Insights ---------- */

  function levelBars() {
    return bars(BF.LEVELS.map((l) => [t("level." + l), GUIDES.filter((g) => g.levels.includes(l)).length]));
  }

  function pageInsights() {
    const open = openCalls();
    const full = GUIDES.filter((g) => g.coverage === "full").length;
    const pct = GUIDES.length ? Math.round(full / GUIDES.length * 100) : 0;
    const months = {};
    open.forEach((o) => { const k = o.deadline.slice(0, 7); months[k] = (months[k] || 0) + 1; });
    const monthRows = Object.keys(months).sort().map((k) => [
      new Date(k + "-01T00:00:00").toLocaleDateString(BF.state.lang === "fr" ? "fr-FR" : "en-GB", { month: "short", year: "numeric" }), months[k]
    ]);
    const chart = (title, body, base) => '<div class="card chart-card"><h3 class="chart-title">' + title + "</h3>" + body + '<p class="form-note">' + base + "</p></div>";
    const guidesBase = t("ins.base", { n: GUIDES.length, what: t("ins.what.guides") });
    const callsBase = t("ins.base.simple", { n: open.length, what: t("ins.what.calls") });

    return subnav("insights") +
      hero(t("ins.title"), "", t("ins.sub"), "") +
      statsBand(false) +
      '<section class="section"><div class="container">' +
      '<div class="eyebrow">' + t("ins.sec.guides") + "</div>" +
      '<div class="insight-lead"><strong>' + pct + " %</strong><span>" + t("ins.full") + "</span></div>" +
      '<div class="grid grid-3">' +
      chart(t("ins.chart.level"), levelBars(), guidesBase) +
      chart(t("ins.chart.dest"), bars(DESTS.map((d) => [t("dest." + d), GUIDES.filter((g) => g.dest === d).length])), t("ins.base.simple", { n: GUIDES.length, what: t("ins.what.guides") })) +
      chart(t("ins.chart.coverage"), bars(["full", "partial"].map((c) => [t("coverage." + c), GUIDES.filter((g) => g.coverage === c).length])), t("ins.base.simple", { n: GUIDES.length, what: t("ins.what.guides") })) +
      "</div></div></section>" +
      '<section class="section section--band"><div class="container">' +
      '<div class="eyebrow">' + t("ins.sec.calls") + "</div>" +
      '<div class="grid grid-2" style="margin-top:14px">' +
      chart(t("ins.chart.type"), bars(BF.TYPES.map((ty) => [t("types." + ty), open.filter((o) => o.type === ty).length])), callsBase) +
      chart(t("ins.chart.months"), bars(monthRows), callsBase) +
      "</div></div></section>" +
      '<section class="section"><div class="container"><div class="cta-band"><div><div class="eyebrow">' + t("ins.laureate.eyebrow") + "</div><h2>" + t("ins.laureate.title") + "</h2><p>" + t("ins.laureate.text") + "</p></div>" +
      '<div class="cta-actions"><a class="btn btn--gold" href="#/contact?subject=story">' + t("ins.laureate.cta") + icon("arrow") + "</a></div></div></div></section>";
  }

  /* ---------- Search ---------- */

  function pageSearch(query) {
    const q = (query.get("q") || "").trim();
    const row = (href, ic, title, sub) => '<li><a class="result-row" href="' + href + '"><span class="icon-bubble">' + icon(ic) + "</span><span><strong>" + title + "</strong><small>" + sub + "</small></span>" + icon("arrow", "doc-arrow") + "</a></li>";
    let body;

    if (!q) {
      body = '<p class="muted">' + t("search.prompt") + "</p>";
    } else {
      const groups = [
        ["search.group.guides", GUIDES.filter((g) => matches(q, [g.name, g.country.fr, g.country.en, g.tagline.fr, g.tagline.en, g.funder.fr, g.funder.en, g.overview.fr, g.overview.en, t("dest." + g.dest)]))
          .map((g) => row("#/opportunities/scholarships/" + g.id, "book", g.name, L(g.country) + " · " + levelsText(g.levels)))],
        ["search.group.calls", DATA.opportunities.filter((o) => matches(q, [o.title.fr, o.title.en, o.org.fr, o.org.en, o.summary.fr, o.summary.en, t("region." + o.region), t("type." + o.type)]))
          .sort(BF.byDeadline).map((o) => row("#/opportunities/calls/" + o.id, BF.TYPE_ICON[o.type], L(o.title), t("type." + o.type) + " · " + fmtDate(o.deadline)))],
        ["search.group.toolkit", TOOLKIT.docs.filter((d) => matches(q, [d.title.fr, d.title.en, d.role.fr, d.role.en, d.intro.fr, d.intro.en]))
          .map((d) => row("#/opportunities/toolkit/" + d.id, d.icon, L(d.title), L(d.role)))],
        ["search.group.laureates", LAUREATES.filter((p) => matches(q, [p.name, p.country.fr, p.country.en, p.programme.fr, p.programme.en, (guideById(p.scholarship) || {}).name || ""]))
          .map((p) => row("#/opportunities/laureates/" + p.id, "award", esc(p.name), L(p.programme) + " · " + L(p.country)))],
        ["search.group.articles", DATA.articles.filter((a) => matches(q, [a.title.fr, a.title.en, a.excerpt.fr, a.excerpt.en]))
          .map((a) => row("#/growth/" + a.id, "book", L(a.title), t("growth.cat." + a.category)))]
      ].filter(([, items]) => items.length);
      const total = groups.reduce((s, [, items]) => s + items.length, 0);
      body = '<p class="results-bar"><strong style="color:var(--white)">' + t(total === 1 ? "search.results.one" : "search.results.many", { n: total, q: esc(q) }) + "</strong></p>" +
        (total
          ? groups.map(([key, items]) => '<div class="result-group"><h2>' + t(key) + ' <span class="muted">(' + items.length + ')</span></h2><ul class="result-list">' + items.join("") + "</ul></div>").join("")
          : '<div class="empty-state"><span class="icon-bubble">' + icon("search") + "</span><h3>" + t("search.empty") + '</h3><a class="btn btn--ghost btn--sm" href="#/opportunities/scholarships">' + t("hub.link.guides") + "</a></div>");
    }

    return subnav("") +
      '<section class="page-hero"><div class="container fade-in"><h1>' + t("search.title") + "</h1>" + BF.searchBar(q) + "</div></section>" +
      '<section class="section--tight" style="padding-top:0;padding-bottom:clamp(56px,8vw,96px)"><div class="container" style="max-width:900px">' + body + "</div></section>";
  }

  /* ---------- Route registration ---------- */

  const SUB = {
    "": { title: "nav.opportunities", render: pageHub },
    scholarships: { title: "opp.nav.guides", render: (r, id) => (id ? pageGuide(id) : pageDirectory(r.query)), bind: (r, id) => (id ? bindGuide() : bindDirectory()) },
    calls: { title: "opp.nav.calls", render: (r, id) => (id ? pageCall(id) : pageCalls(r.query)), bind: (r, id) => { if (!id) bindCalls(); } },
    toolkit: { title: "opp.nav.toolkit", render: (r, id) => (id ? pageDoc(id) : pageToolkit()) },
    laureates: { title: "opp.nav.laureates", render: (r, id) => (id ? pageLaureate(id) : pageLaureates(r.query)), bind: (r, id) => { if (!id) bindLaureates(); } },
    insights: { title: "opp.nav.insights", render: pageInsights },
    search: { title: "search.title", render: (r) => pageSearch(r.query) }
  };

  const sub = (r) => SUB[r.parts[0] || ""] || SUB[""];

  BF.routes.opportunities = {
    title: (r) => sub(r).title,
    render: (r) => sub(r).render(r, r.parts[1]),
    bind: (r) => { const s = sub(r); if (s.bind) s.bind(r, r.parts[1]); }
  };
})();
