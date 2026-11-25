/*
 * Borderless admin — edits content/*.json and commits each change to GitHub.
 * The live site (GitHub Pages) redeploys automatically after every save.
 */
(function () {
  "use strict";

  const CFG = window.ADMIN_CONFIG;
  const SCHEMA = window.ADMIN_SCHEMA;
  const TEXT_GROUPS = window.ADMIN_TEXT_GROUPS;
  const SECTIONS = SCHEMA.flatMap((g) => g.sections);
  const API = "https://api.github.com";
  const TOKEN_KEY = "bf-admin-token";
  const REPO_URL = "https://github.com/" + CFG.owner + "/" + CFG.repo;
  const GUIDE_URL = REPO_URL + "/blob/" + CFG.branch + "/ADMIN-GUIDE.md";

  const state = { token: "", user: null, files: {}, dirty: false, lastHash: "", textDraft: null };
  const $app = document.getElementById("app");

  /* ---------- Small helpers ---------- */

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const store = {
    get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k) || ""; } catch (e) { return ""; } },
    set(k, v, remember) { try { (remember ? localStorage : sessionStorage).setItem(k, v); } catch (e) { /* storage unavailable */ } },
    clear(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  };

  function slugify(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function setPath(obj, path, value) {
    const parts = path.split(".");
    let o = obj;
    parts.forEach((k, i) => {
      if (i === parts.length - 1) { o[k] = value; return; }
      if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      o = o[k];
    });
  }

  const ICON = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>'
  };
  const icon = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[n] || "") + "</svg>";

  /* ---------- Toasts, busy overlay, confirm ---------- */

  function toast(msg, kind) {
    let box = document.getElementById("toasts");
    if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    const el = document.createElement("div");
    el.className = "toast toast--" + (kind || "ok");
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), kind === "error" ? 9000 : 5000);
  }

  function busy(on, msg) {
    let el = document.getElementById("busy");
    if (!el) { el = document.createElement("div"); el.id = "busy"; el.innerHTML = '<div class="busy-box"><span class="spinner"></span><span class="busy-msg"></span></div>'; document.body.appendChild(el); }
    el.querySelector(".busy-msg").textContent = msg || "Saving…";
    el.classList.toggle("is-on", !!on);
  }

  function confirmBox(title, text, okLabel, danger) {
    return new Promise((resolve) => {
      const d = document.createElement("dialog");
      d.className = "confirm";
      d.innerHTML = "<h2>" + esc(title) + "</h2><p>" + esc(text) + '</p><div class="confirm-actions"><button type="button" class="btn btn--ghost" value="no">Cancel</button><button type="button" class="btn ' + (danger ? "btn--danger" : "btn--primary") + '" value="yes">' + esc(okLabel) + "</button></div>";
      document.body.appendChild(d);
      d.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        d.close(); d.remove(); resolve(b.value === "yes");
      });
      d.addEventListener("cancel", () => { d.remove(); resolve(false); });
      d.showModal();
    });
  }

  /* ---------- GitHub ---------- */

  class ApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }

  async function gh(path, opts) {
    opts = opts || {};
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + state.token };
    if (opts.body) headers["Content-Type"] = "application/json";
    const res = await fetch(API + path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: "no-store" });
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = (await res.json()).message || msg; } catch (e) { /* not JSON */ }
      throw new ApiError(res.status, msg);
    }
    return res.status === 204 ? null : res.json();
  }

  function toBase64(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  const encodeText = (s) => toBase64(new TextEncoder().encode(s));
  const decodeText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  const contentsUrl = (path) => "/repos/" + CFG.owner + "/" + CFG.repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/");

  async function loadFile(path) {
    const r = await gh(contentsUrl(path) + "?ref=" + encodeURIComponent(CFG.branch));
    state.files[path] = { sha: r.sha, data: JSON.parse(decodeText(r.content)) };
  }

  function friendlyError(err) {
    if (err.status === 401) return "Your access key isn't valid or has expired. Sign out and sign in with a new key.";
    if (err.status === 403) return "Your access key isn't allowed to save. Create a new key with write access to the " + CFG.repo + " repository (see step 2 of the admin guide).";
    if (err.status === 404) return "The repository " + CFG.owner + "/" + CFG.repo + " can't be found, or your key doesn't have access to it.";
    if (err.status === 409 || err.status === 422) return "Someone else changed this content at the same time. The latest version has been loaded — please make your change again.";
    if (err instanceof TypeError) return "No internet connection, or GitHub can't be reached. Please try again.";
    return "Something went wrong: " + err.message;
  }

  async function saveFile(path, data, message) {
    const text = JSON.stringify(data, null, 2) + "\n";
    try {
      const r = await gh(contentsUrl(path), {
        method: "PUT",
        body: { message: message, content: encodeText(text), sha: state.files[path].sha, branch: CFG.branch }
      });
      state.files[path] = { sha: r.content.sha, data: data };
    } catch (err) {
      if (err.status === 409 || err.status === 422) await loadFile(path).catch(() => {});
      throw err;
    }
  }

  // Runs a save with the busy overlay and a friendly message. Returns true on success.
  async function publish(task, okMsg) {
    busy(true, "Saving and publishing…");
    try {
      await task();
      toast(okMsg || "Saved. The live site updates in about a minute.");
      return true;
    } catch (err) {
      console.error(err);
      toast(friendlyError(err), "error");
      return false;
    } finally {
      busy(false);
    }
  }

  async function uploadFile(file) {
    if (file.size > 20 * 1024 * 1024) throw new Error("This file is larger than 20 MB. Please use a smaller file.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const dot = file.name.lastIndexOf(".");
    const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || "file";
    const ext = dot > 0 ? file.name.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
    const path = "uploads/" + stamp + "-" + base + ext;
    await gh(contentsUrl(path), { method: "PUT", body: { message: "Admin: upload " + file.name, content: toBase64(bytes), branch: CFG.branch } });
    return path;
  }

  /* ---------- Sign in ---------- */

  function allFiles() {
    const set = new Set();
    SECTIONS.forEach((s) => { if (s.file) set.add(s.file); if (s.files) Object.values(s.files).forEach((f) => set.add(f)); });
    return [...set];
  }

  async function signIn(token, remember) {
    state.token = token.trim();
    const repo = await gh("/repos/" + CFG.owner + "/" + CFG.repo);
    if (repo.permissions && repo.permissions.push === false) throw new ApiError(403, "read only");
    state.user = await gh("/user").catch(() => null);
    await Promise.all(allFiles().map(loadFile));
    store.set(TOKEN_KEY, state.token, remember);
  }

  function renderLogin(error) {
    document.body.classList.remove("signed-in");
    $app.innerHTML =
      '<div class="login"><div class="login-card">' +
      '<div class="login-brand">' + logo() + "<div><b>Borderless</b> Admin</div></div>" +
      "<h1>Sign in to edit the website</h1>" +
      '<p class="muted">You need a GitHub account with access to the <b>' + esc(CFG.repo) + "</b> repository, and an access key. You only do this once per device.</p>" +
      '<ol class="login-steps">' +
      '<li><b>Create your access key</b> by following step 2 of the <a href="' + GUIDE_URL + '" target="_blank" rel="noopener">admin guide ' + icon("ext") + "</a> (different steps for the owner and for team members).</li>" +
      "<li><b>Copy the key</b> GitHub shows you (it starts with <code>github_pat_</code> or <code>ghp_</code>).</li>" +
      "<li><b>Paste it below</b> and sign in.</li></ol>" +
      '<form id="login-form" novalidate>' +
      '<label for="token">Access key</label>' +
      '<input id="token" name="token" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" required>' +
      '<label class="check"><input type="checkbox" name="remember" checked> Keep me signed in on this device</label>' +
      (error ? '<p class="form-error" role="alert">' + esc(error) + "</p>" : "") +
      '<button type="submit" class="btn btn--primary btn--block">Sign in</button>' +
      "</form>" +
      '<p class="muted small">Never share your key. On a shared computer, untick “Keep me signed in”.</p>' +
      "</div></div>";
    document.getElementById("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.token.value.trim()) { f.token.focus(); return; }
      busy(true, "Signing in…");
      try {
        await signIn(f.token.value, f.remember.checked);
        startApp();
      } catch (err) {
        console.error(err);
        state.token = "";
        renderLogin(friendlyError(err));
      } finally {
        busy(false);
      }
    });
  }

  function signOut() {
    store.clear(TOKEN_KEY);
    location.hash = "";
    location.reload();
  }

  function logo() {
    return '<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="24" rx="21" ry="9" transform="rotate(-20 24 24)" fill="none" stroke="#5fd4e6" stroke-width="1.6" opacity=".55"/><circle cx="24" cy="24" r="10" fill="#f2b84b"/><path d="M4.27 31.18 A21 9 -20 0 0 43.73 16.82" fill="none" stroke="#5fd4e6" stroke-width="2.2" stroke-linecap="round"/><circle cx="43.73" cy="16.82" r="3" fill="#5fd4e6"/></svg>';
  }

  /* ---------- Layout ---------- */

  function startApp() {
    document.body.classList.add("signed-in");
    $app.innerHTML =
      '<header class="topbar"><button type="button" class="icon-btn menu-btn" aria-label="Menu">' + icon("menu") + "</button>" +
      '<a class="topbar-brand" href="#/">' + logo() + "<span><b>Borderless</b> Admin</span></a>" +
      '<div class="topbar-right">' +
      '<a class="btn btn--ghost btn--sm" href="' + esc(CFG.siteUrl) + '" target="_blank" rel="noopener">' + icon("eye") + '<span class="hide-sm">View website</span></a>' +
      (state.user ? '<span class="user">' + (state.user.avatar_url ? '<img src="' + esc(state.user.avatar_url) + '&s=64" alt="">' : "") + '<span class="hide-sm">' + esc(state.user.name || state.user.login) + "</span></span>" : "") +
      '<button type="button" class="btn btn--ghost btn--sm" data-signout>' + icon("out") + '<span class="hide-sm">Sign out</span></button></div></header>' +
      '<div class="layout"><nav class="sidebar" aria-label="Sections">' +
      '<a href="#/" data-nav="">' + icon("home") + "Dashboard</a>" +
      SCHEMA.map((g) => "<h4>" + esc(g.group) + "</h4>" + g.sections.map((s) => '<a href="#/s/' + s.id + '" data-nav="' + s.id + '">' + esc(s.title) + "</a>").join("")).join("") +
      '<h4>Help</h4><a href="' + GUIDE_URL + '" target="_blank" rel="noopener">Admin guide ' + icon("ext") + "</a>" +
      '<a href="' + REPO_URL + "/commits/" + CFG.branch + '" target="_blank" rel="noopener">Change history ' + icon("ext") + "</a>" +
      '</nav><main id="view" tabindex="-1"></main></div>';

    $app.querySelector("[data-signout]").addEventListener("click", async () => {
      if (state.dirty && !(await confirmBox("Leave without saving?", "You have unsaved changes on this page.", "Sign out", true))) return;
      signOut();
    });
    $app.querySelector(".menu-btn").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    state.lastHash = location.hash;
    route();
  }

  window.addEventListener("hashchange", async () => {
    if (!document.body.classList.contains("signed-in")) return;
    if (state.dirty) {
      const target = location.hash;
      history.replaceState(null, "", state.lastHash || "#/");
      if (!(await confirmBox("Leave without saving?", "You have unsaved changes on this page. They will be lost.", "Leave page", true))) return;
      state.dirty = false;
      history.replaceState(null, "", target);
    }
    state.lastHash = location.hash;
    route();
  });

  window.addEventListener("beforeunload", (e) => {
    if (state.dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  function route() {
    document.body.classList.remove("nav-open");
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const section = parts[0] === "s" ? SECTIONS.find((s) => s.id === parts[1]) : null;
    const view = document.getElementById("view");
    state.dirty = false;
    document.querySelectorAll(".sidebar [data-nav]").forEach((a) => a.toggleAttribute("aria-current", a.dataset.nav === (section ? section.id : "")));

    if (!section) view.innerHTML = dashboard();
    else if (section.kind === "list" && parts[2] === "new") view.innerHTML = editForm(section, "new");
    else if (section.kind === "list" && parts[2] === "edit") view.innerHTML = editForm(section, parseInt(parts[3], 10));
    else if (section.kind === "list") view.innerHTML = listView(section);
    else if (section.kind === "single") view.innerHTML = singleForm(section);
    else if (section.kind === "text") view.innerHTML = textView(section);

    bindView(section, parts);
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------- Dashboard ---------- */

  function items(section) {
    const data = state.files[section.file].data;
    return section.key ? data[section.key] : data;
  }

  function dashboard() {
    const name = state.user ? (state.user.name || state.user.login).split(" ")[0] : "";
    return '<div class="page-head"><h1>Welcome' + (name ? ", " + esc(name) : "") + "</h1>" +
      '<p class="muted">Choose what you want to update. Every save goes live on the website about a minute later.</p></div>' +
      '<div class="how card"><h2>How it works</h2><ol><li><b>Pick a section</b> on the left (or below).</li><li><b>Add, edit or delete</b> items with the buttons. Fill in English and French.</li><li><b>Press “Save & publish”.</b> Refresh the website after about a minute to see the change.</li></ol>' +
      '<p class="muted small">Made a mistake? Every change is kept in the <a href="' + REPO_URL + "/commits/" + CFG.branch + '" target="_blank" rel="noopener">change history</a>, so nothing is ever lost.</p></div>' +
      SCHEMA.map((g) => "<h2 class=\"group-title\">" + esc(g.group) + '</h2><div class="tiles">' +
        g.sections.map((s) => {
          const plural = /[^aeiou]y$/.test(s.singular) ? s.singular.slice(0, -1) + "ies" : s.singular + "s";
          const count = s.kind === "list" ? items(s).length + " " + (items(s).length === 1 ? s.singular : plural) :s.kind === "text" ? Object.keys(state.files[s.files.en].data).length + " texts" : "Settings";
          return '<a class="tile card" href="#/s/' + s.id + '"><strong>' + esc(s.title) + "</strong><span>" + esc(count) + "</span></a>";
        }).join("") + "</div>").join("");
  }

  /* ---------- List view ---------- */

  function listView(s) {
    const list = items(s);
    return '<div class="page-head"><div><h1>' + esc(s.title) + "</h1>" + (s.help ? '<p class="muted">' + esc(s.help) + "</p>" : "") + "</div>" +
      '<a class="btn btn--primary" href="#/s/' + s.id + '/new">' + icon("plus") + "Add " + esc(s.singular) + "</a></div>" +
      '<div class="search">' + icon("search") + '<input type="search" id="list-search" placeholder="Search ' + esc(s.title.toLowerCase()) + '…" aria-label="Search"></div>' +
      (list.length ? '<ul class="rows" id="rows">' + list.map((x, i) =>
        '<li class="row" data-search="' + esc((s.label(x) + " " + s.sub(x)).toLowerCase()) + '">' +
        '<a class="row-main" href="#/s/' + s.id + "/edit/" + i + '"><strong>' + esc(s.label(x) || "(untitled)") + "</strong><span>" + esc(s.sub(x) || "") + "</span></a>" +
        '<div class="row-actions">' +
        '<a class="icon-btn" href="#/s/' + s.id + "/edit/" + i + '" title="Edit" aria-label="Edit">' + icon("edit") + "</a>" +
        (s.view ? '<a class="icon-btn" href="' + esc(CFG.siteUrl + s.view(x)) + '" target="_blank" rel="noopener" title="View on website" aria-label="View on website">' + icon("eye") + "</a>" : "") +
        '<button type="button" class="icon-btn" data-act="up" data-i="' + i + '" title="Move up" aria-label="Move up"' + (i === 0 ? " disabled" : "") + ">" + icon("up") + "</button>" +
        '<button type="button" class="icon-btn" data-act="down" data-i="' + i + '" title="Move down" aria-label="Move down"' + (i === list.length - 1 ? " disabled" : "") + ">" + icon("down") + "</button>" +
        '<button type="button" class="icon-btn" data-act="copy" data-i="' + i + '" title="Duplicate" aria-label="Duplicate">' + icon("copy") + "</button>" +
        '<button type="button" class="icon-btn icon-btn--danger" data-act="delete" data-i="' + i + '" title="Delete" aria-label="Delete">' + icon("trash") + "</button>" +
        "</div></li>").join("") + "</ul>"
        : '<div class="empty card">Nothing here yet. <a href="#/s/' + s.id + '/new">Add the first ' + esc(s.singular) + "</a>.</div>") +
      '<p class="muted small" id="no-match" hidden>No item matches your search.</p>';
  }

  async function listAction(s, act, i) {
    const data = clone(state.files[s.file].data);
    const list = s.key ? data[s.key] : data;
    const item = list[i];
    const name = s.label(item) || s.singular;
    if (act === "delete") {
      if (!(await confirmBox("Delete “" + name + "”?", "It will be removed from the website. You can still recover it later from the change history.", "Delete", true))) return;
      list.splice(i, 1);
      if (await publish(() => saveFile(s.file, data, "Admin: delete " + s.singular + " “" + name + "”"), "Deleted. The live site updates in about a minute.")) route();
    } else if (act === "up" || act === "down") {
      const j = act === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      if (await publish(() => saveFile(s.file, data, "Admin: reorder " + s.title.toLowerCase()), "Order saved.")) route();
    } else if (act === "copy") {
      const copy = clone(item);
      const idField = s.fields.find((f) => f.type === "id");
      if (idField) copy.id = uniqueId(list, (copy.id || "item") + "-copy");
      const titleField = idField && s.fields.find((f) => f.key === idField.from);
      if (titleField && titleField.type === "bi" && copy[titleField.key]) { copy[titleField.key].en += " (copy)"; copy[titleField.key].fr += " (copie)"; }
      else if (titleField && copy[titleField.key]) copy[titleField.key] += " (copy)";
      list.splice(i + 1, 0, copy);
      if (await publish(() => saveFile(s.file, data, "Admin: duplicate " + s.singular + " “" + name + "”"), "Duplicated. Edit the copy to change it.")) location.hash = "#/s/" + s.id + "/edit/" + (i + 1);
    }
  }

  function uniqueId(list, base, skipIndex) {
    let id = base, n = 2;
    while (list.some((x, k) => k !== skipIndex && x.id === id)) id = base + "-" + n++;
    return id;
  }

  /* ---------- Forms ---------- */

  let fieldSeq = 0;
  const fid = () => "f" + (++fieldSeq);

  function options(f) {
    if (f.options === "scholarships") return state.files["content/scholarships.json"].data.map((g) => [g.id, g.name]);
    return f.options;
  }

  function langPair(type, path, value, f) {
    const one = (lang, label) => {
      const id = fid();
      const v = value && value[lang];
      const control = type === "input"
        ? '<input id="' + id + '" type="text" data-k="' + path + "." + lang + '" value="' + esc(v) + '">'
        : '<textarea id="' + id + '" data-k="' + path + "." + lang + '"' + (type === "list" ? ' data-t="' + (f.paras ? "paras" : "list") + '"' : "") + ' rows="' + rowsFor(v, f) + '">' +
          esc(Array.isArray(v) ? v.join(f.paras ? "\n\n" : "\n") : v) + "</textarea>";
      return '<div class="lang-col"><label class="lang" for="' + id + '">' + label + "</label>" + control + "</div>";
    };
    return '<div class="bi">' + one("en", "English") + one("fr", "Français") + "</div>";
  }

  function rowsFor(v, f) {
    const text = Array.isArray(v) ? v.join(f.paras ? "\n\n" : "\n") : String(v || "");
    const lines = text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 60)), 0);
    return Math.min(16, Math.max(f.type === "bilist" ? 4 : 3, lines + 1));
  }

  function fieldHtml(f, value, prefix) {
    const path = prefix ? prefix + "." + f.key : f.key;
    const id = fid();
    const label = (lbl) => '<label class="field-label" for="' + id + '">' + esc(lbl) + (f.req ? ' <span class="req">*</span>' : "") + "</label>";
    const hint = f.hint ? '<p class="hint">' + esc(f.hint) + "</p>" : "";
    let control;

    switch (f.type) {
      case "bi":
        return '<div class="field"><span class="field-label">' + esc(f.label) + (f.req ? ' <span class="req">*</span>' : "") + "</span>" + langPair("input", path, value, f) + hint + "</div>";
      case "bitext":
      case "bilist":
        return '<div class="field"><span class="field-label">' + esc(f.label) + (f.req ? ' <span class="req">*</span>' : "") + "</span>" + langPair(f.type === "bilist" ? "list" : "textarea", path, value, f) +
          (hint || (f.type === "bilist" ? '<p class="hint">' + (f.paras ? "Leave an empty line between paragraphs." : "One item per line.") + "</p>" : "")) + "</div>";
      case "textarea":
        control = '<textarea id="' + id + '" data-k="' + path + '" rows="4">' + esc(value) + "</textarea>"; break;
      case "checkbox":
        return '<div class="field"><label class="check"><input type="checkbox" data-k="' + path + '" data-t="checkbox"' + (value ? " checked" : "") + "> " + esc(f.label) + "</label>" + hint + "</div>";
      case "select":
        control = '<select id="' + id + '" data-k="' + path + '"><option value="">Choose…</option>' +
          options(f).map(([v, l]) => '<option value="' + esc(v) + '"' + (v === value ? " selected" : "") + ">" + esc(l) + "</option>").join("") + "</select>"; break;
      case "checks":
        return '<div class="field"><span class="field-label">' + esc(f.label) + '</span><div class="checks">' +
          options(f).map(([v, l]) => '<label class="check"><input type="checkbox" data-k="' + path + '" data-t="checks" value="' + esc(v) + '"' + ((value || []).includes(v) ? " checked" : "") + "> " + esc(l) + "</label>").join("") + "</div>" + hint + "</div>";
      case "tags":
        control = '<input id="' + id + '" type="text" data-k="' + path + '" data-t="tags" value="' + esc((value || []).join(", ")) + '">'; break;
      case "number":
        control = '<input id="' + id + '" type="number" data-k="' + path + '" data-t="number" value="' + esc(value) + '">'; break;
      case "date":
        control = '<input id="' + id + '" type="date" data-k="' + path + '" value="' + esc(value) + '">'; break;
      case "url":
        control = '<input id="' + id + '" type="url" data-k="' + path + '" value="' + esc(value) + '" placeholder="https://…">'; break;
      case "id":
        control = '<input id="' + id + '" type="text" data-k="' + path + '" data-t="id" value="' + esc(value) + '" placeholder="made automatically from the title">';
        return '<div class="field field--small">' + label(f.label) + control + (hint || '<p class="hint">Used in the page address. Letters, numbers and dashes only. Changing it breaks links people may have saved.</p>') + "</div>";
      case "file":
        control = '<div class="file-row"><input id="' + id + '" type="text" data-k="' + path + '" value="' + esc(value) + '" placeholder="No file yet">' +
          '<label class="btn btn--ghost btn--sm upload-btn">' + icon("upload") + 'Upload file<input type="file" data-upload="' + path + '" hidden></label></div>'; break;
      case "group":
        return groupHtml(f, value || [], path);
      default:
        control = '<input id="' + id + '" type="text" data-k="' + path + '" value="' + esc(value) + '">';
    }
    return '<div class="field">' + label(f.label) + control + hint + "</div>";
  }

  function groupHtml(f, list, path) {
    return '<div class="field"><span class="field-label">' + esc(f.label) + '</span><div class="group" data-group="' + path + '">' +
      list.map((item, i) =>
        '<div class="group-item"><div class="group-head"><strong>' + esc(f.item.charAt(0).toUpperCase() + f.item.slice(1)) + " " + (i + 1) + "</strong>" +
        '<span><button type="button" class="icon-btn" data-gact="up" data-g="' + path + '" data-gi="' + i + '" aria-label="Move up"' + (i === 0 ? " disabled" : "") + ">" + icon("up") + "</button>" +
        '<button type="button" class="icon-btn" data-gact="down" data-g="' + path + '" data-gi="' + i + '" aria-label="Move down"' + (i === list.length - 1 ? " disabled" : "") + ">" + icon("down") + "</button>" +
        '<button type="button" class="icon-btn icon-btn--danger" data-gact="remove" data-g="' + path + '" data-gi="' + i + '" aria-label="Remove">' + icon("trash") + "</button></span></div>" +
        f.fields.map((sf) => fieldHtml(sf, item[sf.key], path + "." + i)).join("") + "</div>"
      ).join("") +
      '<button type="button" class="btn btn--ghost btn--sm" data-gact="add" data-g="' + path + '">' + icon("plus") + "Add " + esc(f.item) + "</button></div></div>";
  }

  // Reads the form back into an object shaped like the content files.
  function collect(form, fields) {
    const out = {};
    fields.forEach((f) => {
      if (f.type === "checks" || f.type === "group") out[f.key] = [];
      if (f.type === "bilist") out[f.key] = { en: [], fr: [] };
    });
    form.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k, t = el.dataset.t;
      if (t === "checks") { if (el.checked) getPath(out, k).push(el.value); return; }
      let v = el.value;
      if (t === "checkbox") v = el.checked;
      else if (t === "number") v = v === "" ? null : Number(v);
      else if (t === "tags") v = v.split(",").map((x) => x.trim()).filter(Boolean);
      else if (t === "list") v = v.split("\n").map((x) => x.trim()).filter(Boolean);
      else if (t === "paras") v = v.split(/\n\s*\n/).map((x) => x.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
      else if (t === "id") v = slugify(v);
      else v = v.trim();
      setPath(out, k, v);
    });
    return out;
  }

  function validate(fields, obj) {
    for (const f of fields) {
      if (!f.req) continue;
      const v = obj[f.key];
      const empty = f.type === "bi" || f.type === "bitext" ? !(v && v.en) : v === "" || v == null;
      if (empty) return "Please fill in “" + f.label + "”" + (f.type === "bi" || f.type === "bitext" ? " (at least in English)" : "") + ".";
    }
    return "";
  }

  function formShell(title, back, body, extra) {
    return '<div class="page-head"><div>' + (back ? '<a class="back" href="' + back + '">' + icon("back") + "Back</a>" : "") + "<h1>" + esc(title) + "</h1></div></div>" +
      '<form id="edit-form" class="card form" novalidate>' + body +
      '<div class="savebar"><span class="savebar-note" id="save-note">No changes yet</span><div>' + (extra || "") +
      (back ? '<a class="btn btn--ghost" href="' + back + '">Cancel</a>' : "") +
      '<button type="submit" class="btn btn--primary">Save &amp; publish</button></div></div></form>';
  }

  function editForm(s, index) {
    const list = items(s);
    const isNew = index === "new";
    if (!isNew && !list[index]) return '<div class="empty card">This item doesn\'t exist any more. <a href="#/s/' + s.id + '">Back to the list</a>.</div>';
    const item = isNew ? (state.draft || s.blank()) : (state.draft || list[index]);
    state.draft = null;
    const title = isNew ? "New " + s.singular : "Edit “" + (s.label(list[index]) || s.singular) + "”";
    const extra = !isNew ? '<button type="button" class="btn btn--danger-ghost" data-delete>' + icon("trash") + "Delete</button>" : "";
    return formShell(title, "#/s/" + s.id, s.fields.map((f) => fieldHtml(f, item[f.key])).join(""), extra);
  }

  function singleForm(s) {
    const data = state.files[s.file].data;
    const item = state.draft || data;
    state.draft = null;
    return formShell(s.title, "", (s.help ? '<p class="muted">' + esc(s.help) + "</p>" : "") + s.fields.map((f) => fieldHtml(f, item[f.key])).join(""));
  }

  /* ---------- Page text ---------- */

  function textGroup(key) {
    return key.split(".")[0];
  }

  function textView(s) {
    const en = state.files[s.files.en].data, fr = state.files[s.files.fr].data;
    const keys = [...new Set(Object.keys(en).concat(Object.keys(fr)))];
    const groups = [...new Set(keys.map(textGroup))];
    state.textDraft = { en: clone(en), fr: clone(fr) };
    return '<div class="page-head"><div><h1>' + esc(s.title) + '</h1><p class="muted">' + esc(s.help) + "</p></div></div>" +
      '<div class="text-tools"><div class="search">' + icon("search") + '<input type="search" id="text-search" placeholder="Search words, e.g. “Join”" aria-label="Search page text"></div>' +
      '<select id="text-group" aria-label="Part of the site"><option value="">All parts of the site</option>' +
      groups.map((g) => '<option value="' + esc(g) + '">' + esc(TEXT_GROUPS[g] || g) + "</option>").join("") + "</select></div>" +
      '<p class="muted small">Words in {curly brackets} are filled in automatically (for example {n} becomes a number). Keep them as they are.</p>' +
      '<form id="text-form" class="card form" novalidate><div class="text-rows">' +
      keys.map((k) => {
        const area = (lang, v) => '<div class="lang-col"><span class="lang">' + (lang === "en" ? "English" : "Français") + '</span><textarea data-lang="' + lang + '" data-key="' + esc(k) + '" rows="' + Math.min(6, Math.max(1, Math.ceil(String(v || "").length / 55))) + '">' + esc(v) + "</textarea></div>";
        return '<div class="text-row" data-group="' + esc(textGroup(k)) + '" data-search="' + esc((k + " " + (en[k] || "") + " " + (fr[k] || "")).toLowerCase()) + '">' +
          '<div class="text-key">' + esc(TEXT_GROUPS[textGroup(k)] || textGroup(k)) + " · <code>" + esc(k) + "</code></div>" +
          '<div class="bi">' + area("en", en[k]) + area("fr", fr[k]) + "</div></div>";
      }).join("") +
      '</div><p class="muted small" id="text-none" hidden>No text matches your search.</p>' +
      '<div class="savebar"><span class="savebar-note" id="save-note">No changes yet</span><div><button type="submit" class="btn btn--primary">Save &amp; publish</button></div></div></form>';
  }

  /* ---------- Binding ---------- */

  function markDirty() {
    state.dirty = true;
    const note = document.getElementById("save-note");
    if (note) { note.textContent = "Unsaved changes"; note.classList.add("is-dirty"); }
  }

  function bindView(s, parts) {
    const view = document.getElementById("view");
    if (!s) return;

    if (s.kind === "list" && !parts[2]) {
      const search = document.getElementById("list-search");
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        let shown = 0;
        view.querySelectorAll(".row").forEach((r) => { const ok = !q || r.dataset.search.includes(q); r.hidden = !ok; shown += ok; });
        document.getElementById("no-match").hidden = shown > 0 || !q;
      });
      view.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => listAction(s, b.dataset.act, parseInt(b.dataset.i, 10))));
      return;
    }

    if (s.kind === "text") return bindText(s, view);

    const form = document.getElementById("edit-form");
    if (!form) return;
    const fields = s.fields;
    const index = parts[2] === "edit" ? parseInt(parts[3], 10) : "new";
    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);

    // Repeatable groups: add / remove / reorder by rebuilding the form from its current values.
    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-gact]");
      if (!b) return;
      const draft = Object.assign({}, s.kind === "single" ? state.files[s.file].data : (index === "new" ? {} : items(s)[index]), collect(form, fields));
      const list = getPath(draft, b.dataset.g);
      const i = parseInt(b.dataset.gi, 10);
      if (b.dataset.gact === "add") list.push({});
      if (b.dataset.gact === "remove") list.splice(i, 1);
      if (b.dataset.gact === "up" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (b.dataset.gact === "down" && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      const y = window.scrollY;
      state.draft = draft;
      view.innerHTML = s.kind === "single" ? singleForm(s) : editForm(s, index);
      bindView(s, parts);
      markDirty();
      window.scrollTo(0, y);
    });

    form.querySelectorAll("[data-upload]").forEach((input) => input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      busy(true, "Uploading " + file.name + "…");
      try {
        const path = await uploadFile(file);
        form.querySelector('[data-k="' + input.dataset.upload + '"]').value = path;
        markDirty();
        toast("File uploaded. Press “Save & publish” to use it.");
      } catch (err) {
        console.error(err);
        toast(err instanceof ApiError ? friendlyError(err) : err.message, "error");
      } finally {
        busy(false);
        input.value = "";
      }
    }));

    const del = form.querySelector("[data-delete]");
    if (del) del.addEventListener("click", async () => {
      state.dirty = false;
      await listAction(s, "delete", index);
      if (location.hash.includes("/edit/")) location.hash = "#/s/" + s.id;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const values = collect(form, fields);
      const error = validate(fields, values);
      if (error) { toast(error, "error"); return; }

      if (s.kind === "single") {
        const data = Object.assign(clone(state.files[s.file].data), values);
        if (await publish(() => saveFile(s.file, data, "Admin: update " + s.title.toLowerCase()))) { state.dirty = false; route(); }
        return;
      }

      const data = clone(state.files[s.file].data);
      const list = s.key ? data[s.key] : data;
      const idField = fields.find((f) => f.type === "id");
      if (idField) {
        const from = values[idField.from];
        const base = values.id || slugify(from && typeof from === "object" ? from.en : from) || s.singular.replace(/\s+/g, "-");
        values.id = uniqueId(list, base, index === "new" ? -1 : index);
      }
      const item = Object.assign({}, index === "new" ? {} : list[index], values);
      if (index === "new") list.unshift(item); else list[index] = item;
      const name = s.label(item) || s.singular;
      if (await publish(() => saveFile(s.file, data, "Admin: " + (index === "new" ? "add" : "update") + " " + s.singular + " “" + name + "”"))) {
        state.dirty = false;
        location.hash = "#/s/" + s.id;
      }
    });
  }

  function bindText(s, view) {
    const form = document.getElementById("text-form");
    const search = document.getElementById("text-search");
    const group = document.getElementById("text-group");
    const filter = () => {
      const q = search.value.trim().toLowerCase(), g = group.value;
      let shown = 0;
      view.querySelectorAll(".text-row").forEach((r) => {
        const ok = (!g || r.dataset.group === g) && (!q || r.dataset.search.includes(q));
        r.hidden = !ok; shown += ok;
      });
      document.getElementById("text-none").hidden = shown > 0;
    };
    search.addEventListener("input", filter);
    group.addEventListener("change", filter);
    form.addEventListener("input", (e) => {
      const ta = e.target.closest("textarea[data-key]");
      if (!ta) return;
      state.textDraft[ta.dataset.lang][ta.dataset.key] = ta.value;
      markDirty();
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const changed = ["en", "fr"].filter((l) => JSON.stringify(state.textDraft[l]) !== JSON.stringify(state.files[s.files[l]].data));
      if (!changed.length) { toast("Nothing to save — no text was changed."); return; }
      const ok = await publish(async () => {
        for (const l of changed) await saveFile(s.files[l], state.textDraft[l], "Admin: update page text (" + l.toUpperCase() + ")");
      });
      if (ok) { state.dirty = false; const note = document.getElementById("save-note"); note.textContent = "All changes saved"; note.classList.remove("is-dirty"); }
    });
  }

  /* ---------- Start ---------- */

  async function init() {
    const saved = store.get(TOKEN_KEY);
    if (!saved) return renderLogin();
    busy(true, "Loading…");
    try {
      await signIn(saved, !!(function () { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return ""; } })());
      startApp();
    } catch (err) {
      console.error(err);
      store.clear(TOKEN_KEY);
      state.token = "";
      renderLogin(err.status === 401 ? "Your saved key has expired. Please sign in with a new key." : friendlyError(err));
    } finally {
      busy(false);
    }
  }

  init();
})();
